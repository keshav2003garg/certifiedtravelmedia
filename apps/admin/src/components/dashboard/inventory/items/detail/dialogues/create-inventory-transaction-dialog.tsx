import { memo, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import { Form } from '@repo/ui/components/base/form';
import { zodResolver } from '@repo/ui/lib/form';
import { useForm } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import { INVENTORY_TRANSACTION_DECIMAL_EPSILON } from './create-inventory-transaction-dialog.constants';
import {
  createInventoryTransactionFormSchema,
  getDefaultInventoryTransactionValues,
} from './create-inventory-transaction-dialog.schema';
import {
  buildInventoryTransactionPayload,
  getInventoryReductionBoxes,
  shouldReduceInventory,
} from './create-inventory-transaction-dialog.utils';
import InventoryTransactionBalanceSummary from './inventory-transaction-balance-summary';
import InventoryTransactionDestinationField from './inventory-transaction-destination-field';
import InventoryTransactionDetailsFields from './inventory-transaction-details-fields';
import InventoryTransactionTypeField from './inventory-transaction-type-field';

import type { SubmitHandler } from '@repo/ui/lib/form';
import type { InventoryItemDetail } from '@/hooks/useInventoryItems/types';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface CreateInventoryTransactionDialogProps {
  item: InventoryItemDetail;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function CreateInventoryTransactionDialog({
  item,
  onOpenChange,
  open,
}: CreateInventoryTransactionDialogProps) {
  const { createTransactionMutation } = useInventoryItems();

  const defaultValues = useMemo<CreateInventoryTransactionFormData>(
    () => getDefaultInventoryTransactionValues(),
    [],
  );

  const form = useForm<CreateInventoryTransactionFormData>({
    resolver: zodResolver(createInventoryTransactionFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useResetFormOnActivation(open, form.reset, defaultValues, item.id);

  const transactionType = form.watch('transactionType');

  const isTransferTransaction = transactionType === 'Transfer';
  const isAdjustmentTransaction = transactionType === 'Adjustment';
  const isSubmitting = createTransactionMutation.isPending;

  const handleSubmit: SubmitHandler<
    CreateInventoryTransactionFormData
  > = async (values) => {
    if (
      values.transactionType === 'Transfer' &&
      values.destinationWarehouseId === item.warehouseId
    ) {
      form.setError('destinationWarehouseId', {
        message:
          'Destination warehouse must be different from the current warehouse',
      });
      return;
    }

    if (values.boxes === undefined) {
      form.setError('boxes', { message: 'Boxes is required' });
      return;
    }

    if (
      shouldReduceInventory(values) &&
      getInventoryReductionBoxes(values) >
        item.boxes + INVENTORY_TRANSACTION_DECIMAL_EPSILON
    ) {
      form.setError('boxes', {
        message: 'Boxes cannot exceed current inventory balance',
      });
      return;
    }

    await createTransactionMutation.mutateAsync({
      id: item.id,
      body: buildInventoryTransactionPayload({
        ...values,
        boxes: values.boxes,
      }),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create inventory transaction</DialogTitle>
          <DialogDescription>
            Record a transfer, return, recycle movement, or adjustment for this
            inventory item.
          </DialogDescription>
        </DialogHeader>

        <InventoryTransactionBalanceSummary item={item} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <InventoryTransactionTypeField
              form={form}
              isSubmitting={isSubmitting}
            />

            {isTransferTransaction ? (
              <InventoryTransactionDestinationField
                form={form}
                currentWarehouseId={item.warehouseId}
                isOpen={open}
                isSubmitting={isSubmitting}
              />
            ) : null}

            <InventoryTransactionDetailsFields
              form={form}
              currentBoxes={item.boxes}
              isAdjustmentTransaction={isAdjustmentTransaction}
              isSubmitting={isSubmitting}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Create transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(CreateInventoryTransactionDialog);
