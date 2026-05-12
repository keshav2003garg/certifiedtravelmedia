import { memo } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import { FileImage } from '@repo/ui/lib/icons';

import { formatQuantity } from '../utils';

import type { SubmittedMonthEndCountListItem } from '@/hooks/useInventoryMonthEndCounts/types';

interface SubmittedMonthEndCountsTableProps {
  items: SubmittedMonthEndCountListItem[];
}

function SubmittedMonthEndCountsTable({
  items,
}: SubmittedMonthEndCountsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '860px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[42%]">Brochure</TableHead>
              <TableHead className="w-[24%]">Warehouse</TableHead>
              <TableHead className="w-[14%] text-right">Units/Box</TableHead>
              <TableHead className="w-[20%] text-right">
                Submitted count
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.countId}>
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
                      <p className="truncate font-medium">
                        {item.brochureName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {item.brochureTypeName}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {item.warehouseName}
                    </p>
                    {item.warehouseAcumaticaId ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {item.warehouseAcumaticaId}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatQuantity(item.unitsPerBox)}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold">
                  {formatQuantity(item.endCount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(SubmittedMonthEndCountsTable);
