import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import InventoryRequestsTableRow from './inventory-requests-table-row';

import type { InventoryRequest } from '@/hooks/useInventoryRequests/types';

interface InventoryRequestsTableProps {
  requests: InventoryRequest[];
  onSelect?: (request: InventoryRequest) => void;
}

function InventoryRequestsTable({
  requests,
  onSelect,
}: InventoryRequestsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed" style={{ minWidth: '960px' }}>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[28%]">Brochure</TableHead>
            <TableHead className="w-[12%]">Status</TableHead>
            <TableHead className="w-[16%]">Warehouse</TableHead>
            <TableHead className="w-[16%]">Quantity</TableHead>
            <TableHead className="w-[16%]">Requested by</TableHead>
            <TableHead className="w-[12%]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <InventoryRequestsTableRow
              key={request.id}
              request={request}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default memo(InventoryRequestsTable);
