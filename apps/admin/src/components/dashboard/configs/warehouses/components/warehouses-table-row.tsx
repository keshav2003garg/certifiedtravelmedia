import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
import { TableCell, TableRow } from '@repo/ui/components/base/table';
import {
  Archive,
  Download,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';

import type { Warehouse } from '@/hooks/useWarehouses/types';

interface WarehousesTableRowProps {
  warehouse: Warehouse;
  isRetiring: boolean;
  isDownloadingFullTruckLoad: boolean;
  isFullTruckLoadDownloadDisabled: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onRetire: (warehouse: Warehouse) => void;
  onDownloadFullTruckLoad: (warehouse: Warehouse) => void;
}

const VISIBLE_SECTOR_COUNT = 5;

function WarehousesTableRow({
  warehouse,
  isRetiring,
  isDownloadingFullTruckLoad,
  isFullTruckLoadDownloadDisabled,
  onEdit,
  onRetire,
  onDownloadFullTruckLoad,
}: WarehousesTableRowProps) {
  const visibleSectors = warehouse.sectors.slice(0, VISIBLE_SECTOR_COUNT);
  const hiddenSectorCount = Math.max(
    warehouse.sectorCount - visibleSectors.length,
    0,
  );

  return (
    <TableRow className={cn(isRetiring && 'pointer-events-none opacity-50')}>
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{warehouse.name}</p>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {warehouse.address || 'No address recorded'}
            </span>
          </p>
        </div>
      </TableCell>
      <TableCell>
        {warehouse.acumaticaId ? (
          <Badge variant="outline" className="rounded-md">
            {warehouse.acumaticaId}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        {visibleSectors.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {visibleSectors.map((sector) => (
              <Badge
                key={sector.id}
                variant="secondary"
                title={sector.description}
                className="bg-muted/70 text-muted-foreground hover:bg-muted/70 max-w-36 rounded-full border-transparent px-2.5 py-1"
              >
                <span className="truncate">{sector.acumaticaId}</span>
              </Badge>
            ))}
            {hiddenSectorCount > 0 ? (
              <Badge
                variant="outline"
                className="bg-background rounded-full px-2.5 py-1 text-xs font-semibold"
              >
                +{hiddenSectorCount}
              </Badge>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">
          {warehouse.inventoryItemCount}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant={warehouse.isActive ? 'secondary' : 'outline'}
          className={cn(
            'rounded-md',
            warehouse.isActive
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
              : 'text-muted-foreground',
          )}
        >
          {warehouse.isActive ? 'Active' : 'Retired'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(warehouse.updatedAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Download FTL for ${warehouse.name}`}
            title="Download FTL"
            disabled={isFullTruckLoadDownloadDisabled}
            onClick={() => onDownloadFullTruckLoad(warehouse)}
          >
            {isDownloadingFullTruckLoad ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRetire(warehouse)}
                disabled={isRetiring || !warehouse.isActive}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 size-4" />
                Retire
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default memo(WarehousesTableRow);
