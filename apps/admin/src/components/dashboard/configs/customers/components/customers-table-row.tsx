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
import { MoreHorizontal, Pencil, Trash2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';

import type { Customer } from '@/hooks/useCustomers/types';

interface CustomersTableRowProps {
  customer: Customer;
  isDeleting: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function CustomersTableRow({
  customer,
  isDeleting,
  onEdit,
  onDelete,
}: CustomersTableRowProps) {
  const usageCount = customer.brochureCount + customer.contractCount;
  const canDelete = usageCount === 0;

  return (
    <TableRow className={cn(isDeleting && 'pointer-events-none opacity-50')}>
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{customer.name}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="rounded-md">
          {customer.acumaticaId}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(customer.createdAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(customer)}
              disabled={isDeleting || !canDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default memo(CustomersTableRow);
