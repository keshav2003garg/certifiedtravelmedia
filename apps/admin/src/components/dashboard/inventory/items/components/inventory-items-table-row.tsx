import { memo, useCallback } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { Badge } from '@repo/ui/components/base/badge';
import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { FileImage } from '@repo/ui/lib/icons';
import { formatShortDate } from '@repo/utils/date';
import { formatDecimal } from '@repo/utils/number';

import InventoryStockLevelBadge from './inventory-stock-level-badge';

import type { InventoryListItem } from '@/hooks/useInventoryItems/types';

interface InventoryItemsTableRowProps {
  item: InventoryListItem;
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function InventoryItemsTableRow({ item }: InventoryItemsTableRowProps) {
  const navigate = useNavigate();
  const openDetail = useCallback(() => {
    void navigate({
      to: '/dashboard/inventory/$id',
      params: { id: item.id },
    });
  }, [item.id, navigate]);

  return (
    <TableRow
      tabIndex={0}
      className="cursor-pointer"
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="size-full object-contain"
                loading="lazy"
              />
            ) : (
              <FileImage className="size-5" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{item.brochureName}</p>
            <p className="text-muted-foreground truncate text-xs">
              Updated {formatShortDate(item.updatedAt)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="max-w-40 rounded-md">
          <span className="truncate">{item.brochureTypeName}</span>
        </Badge>
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          {item.customerName ? (
            <p className="truncate text-sm font-medium">{item.customerName}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Unassigned</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{item.warehouseName}</p>
          {item.warehouseAcumaticaId ? (
            <p className="text-muted-foreground truncate text-xs">
              {item.warehouseAcumaticaId}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <span className="flex justify-center text-sm font-medium">
          {formatQuantity(item.boxes)}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex justify-center text-sm font-medium">
          {formatQuantity(item.unitsPerBox)}
        </span>
      </TableCell>
      <TableCell>
        <InventoryStockLevelBadge stockLevel={item.stockLevel} />
      </TableCell>
    </TableRow>
  );
}

export default memo(InventoryItemsTableRow);
