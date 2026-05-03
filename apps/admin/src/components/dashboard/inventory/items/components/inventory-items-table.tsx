import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import InventoryItemsTableRow from './inventory-items-table-row';

import type { InventoryListItem } from '@/hooks/useInventoryItems/types';

interface InventoryItemsTableProps {
  items: InventoryListItem[];
}

function InventoryItemsTable({ items }: InventoryItemsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '1180px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[26%]">Brochure</TableHead>
              <TableHead className="w-[14%]">Type</TableHead>
              <TableHead className="w-[15%]">Customer</TableHead>
              <TableHead className="w-[17%]">Warehouse</TableHead>
              <TableHead className="w-[10%]">No. of boxes</TableHead>
              <TableHead className="w-[10%]">Units per box</TableHead>
              <TableHead className="w-[8%]">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <InventoryItemsTableRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(InventoryItemsTable);
