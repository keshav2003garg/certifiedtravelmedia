import { memo } from 'react';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { Textarea } from '@repo/ui/components/base/textarea';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface InventoryTransactionDetailsFieldsProps {
  currentBoxes: number;
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isAdditionTransaction: boolean;
  isSubmitting: boolean;
}

function InventoryTransactionDetailsFields({
  currentBoxes,
  form,
  isAdditionTransaction,
  isSubmitting,
}: InventoryTransactionDetailsFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="boxes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Boxes</FormLabel>
              <FormControl>
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  min={0.01}
                  max={
                    isAdditionTransaction || currentBoxes <= 0
                      ? undefined
                      : currentBoxes
                  }
                  step={0.01}
                  decimals={2}
                  placeholder="1"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                {isAdditionTransaction
                  ? 'Boxes to add to this inventory item.'
                  : 'Boxes to move out of this inventory item.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transactionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="h-11"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder="Optional transaction notes"
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export default memo(InventoryTransactionDetailsFields);
