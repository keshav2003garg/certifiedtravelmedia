import { memo } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/base/alert-dialog';
import { Loader2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { Customer } from '@/hooks/useCustomers/types';

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DeleteCustomerDialog({
  customer,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteCustomerDialogProps) {
  const usageCount = customer
    ? customer.brochureCount + customer.contractCount
    : 0;
  const canDelete = usageCount === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          <AlertDialogDescription>
            {customer
              ? `This will permanently delete "${customer.name}".`
              : 'This customer will be permanently deleted.'}
            {!canDelete
              ? ' Customers linked to brochures or contracts cannot be deleted.'
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting || !canDelete}
            className={cn(
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default memo(DeleteCustomerDialog);
