import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import MonthEndCountsTableRow from './month-end-counts-table-row';

import type { MonthEndCountRow } from '../types';

interface MonthEndCountsTableProps {
  rows: MonthEndCountRow[];
  onCountChange: (inventoryItemId: string, value: number | undefined) => void;
}

function MonthEndCountsTable({
  rows,
  onCountChange,
}: MonthEndCountsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '1180px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[25%]">Brochure</TableHead>
              <TableHead className="w-[15%]">Warehouse</TableHead>
              <TableHead className="w-[8%] text-right">Units/Box</TableHead>
              <TableHead className="w-[12%] text-right">
                Prev month count
              </TableHead>
              <TableHead className="w-[12%] text-right">
                This month transactions
              </TableHead>
              <TableHead className="w-[10%]">End count</TableHead>
              <TableHead className="w-[9%] text-right">Distribution</TableHead>
              <TableHead className="w-[9%]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <MonthEndCountsTableRow
                key={row.item.inventoryItemId}
                row={row}
                onCountChange={onCountChange}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(MonthEndCountsTable);
