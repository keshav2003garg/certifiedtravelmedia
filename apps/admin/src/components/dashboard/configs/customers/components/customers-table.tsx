import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import CustomersTableRow from './customers-table-row';

import type { Customer } from '@/hooks/useCustomers/types';

interface CustomersTableProps {
  customers: Customer[];
  deletingId: string | null;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function CustomersTable({
  customers,
  deletingId,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '980px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%]">Customer</TableHead>
              <TableHead className="w-[14%]">Acumatica ID</TableHead>
              <TableHead className="w-[10%]">Brochures</TableHead>
              <TableHead className="w-[10%]">Contracts</TableHead>
              <TableHead className="w-[14%]">Created</TableHead>
              <TableHead className="w-[14%]">Updated</TableHead>
              <TableHead className="w-[8%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <CustomersTableRow
                key={customer.id}
                customer={customer}
                isDeleting={deletingId === customer.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(CustomersTable);
