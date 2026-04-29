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

import type { Warehouse } from '@/hooks/useWarehouses/types';

interface RetireWarehouseDialogProps {
  warehouse: Warehouse | null;
  open: boolean;
  isRetiring: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function RetireWarehouseDialog({
  warehouse,
  open,
  isRetiring,
  onOpenChange,
  onConfirm,
}: RetireWarehouseDialogProps) {
  const canRetire = Boolean(warehouse?.isActive);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retire warehouse?</AlertDialogTitle>
          <AlertDialogDescription>
            {warehouse
              ? `This will mark "${warehouse.name}" as retired.`
              : 'This warehouse will be marked as retired.'}
            {!canRetire ? ' This warehouse is already retired.' : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRetiring}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isRetiring || !canRetire}
            className={cn(
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {isRetiring ? <Loader2 className="size-4 animate-spin" /> : null}
            Retire
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default memo(RetireWarehouseDialog);
