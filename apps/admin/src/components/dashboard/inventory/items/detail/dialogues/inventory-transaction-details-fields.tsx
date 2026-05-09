import { memo } from 'react';

import { DatePicker } from '@repo/ui/components/base/date-picker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { Textarea } from '@repo/ui/components/base/textarea';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface InventoryTransactionDetailsFieldsProps {
  currentBoxes: number;
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isAdjustmentTransaction: boolean;
  isSubmitting: boolean;
}

function InventoryTransactionDetailsFields({
  currentBoxes,
  form,
  isAdjustmentTransaction,
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
                  min={isAdjustmentTransaction ? undefined : 0.01}
                  max={
                    isAdjustmentTransaction || currentBoxes <= 0
                      ? undefined
                      : currentBoxes
                  }
                  step={0.01}
                  decimals={2}
                  placeholder="Enter boxes"
                  disabled={isSubmitting}
                />
              </FormControl>
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
                <DatePicker
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? '')}
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
