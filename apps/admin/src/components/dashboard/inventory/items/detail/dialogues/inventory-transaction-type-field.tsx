import { memo } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';

import InventoryTransactionTypeTabs from './inventory-transaction-type-tabs';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface InventoryTransactionTypeFieldProps {
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isSubmitting: boolean;
}

function InventoryTransactionTypeField({
  form,
  isSubmitting,
}: InventoryTransactionTypeFieldProps) {
  function handleTypeChange(
    nextType: CreateInventoryTransactionFormData['transactionType'],
  ) {
    form.setValue('transactionType', nextType, { shouldValidate: true });

    if (nextType !== 'Transfer') {
      form.setValue('destinationWarehouseId', '', { shouldValidate: false });
    }
  }

  return (
    <FormField
      control={form.control}
      name="transactionType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction type</FormLabel>
          <FormControl>
            <InventoryTransactionTypeTabs
              value={field.value}
              onValueChange={handleTypeChange}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default memo(InventoryTransactionTypeField);
