import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { FileImage } from '@repo/ui/lib/icons';

import { formatQuantity } from '../utils';

import type { MonthEndCountRow } from '../types';

interface MonthEndCountsTableRowProps {
  row: MonthEndCountRow;
  onCountChange: (inventoryItemId: string, value: number | undefined) => void;
}

function MonthEndCountsTableRow({
  row,
  onCountChange,
}: MonthEndCountsTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {row.item.imageUrl ? (
              <img
                src={row.item.imageUrl}
                alt=""
                className="size-full object-contain"
                loading="lazy"
              />
            ) : (
              <FileImage className="size-5" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.item.brochureName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.item.brochureTypeName}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">
            {row.item.warehouseName}
          </p>
          {row.item.warehouseAcumaticaId ? (
            <p className="text-muted-foreground truncate text-xs">
              {row.item.warehouseAcumaticaId}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {formatQuantity(row.item.unitsPerBox)}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {formatQuantity(row.item.previousMonthEndCount)}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {formatQuantity(row.item.transactionBoxes)}
      </TableCell>
      <TableCell>
        <NumericInput
          value={row.endCount}
          onChange={(value) => onCountChange(row.item.inventoryItemId, value)}
          min={0}
          step={0.01}
          decimals={2}
          placeholder="0"
          className="h-10"
        />
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {row.item.distributionBoxes === null
          ? '—'
          : formatQuantity(row.item.distributionBoxes)}
      </TableCell>
      <TableCell>
        {row.item.countId ? (
          <Badge>Counted</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export default memo(MonthEndCountsTableRow);
