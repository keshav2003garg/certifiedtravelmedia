import { memo } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';

import { INVENTORY_ADJUSTMENT_DIRECTIONS } from './create-inventory-transaction-dialog.constants';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface InventoryAdjustmentDirectionFieldProps {
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isSubmitting: boolean;
}

function InventoryAdjustmentDirectionField({
  form,
  isSubmitting,
}: InventoryAdjustmentDirectionFieldProps) {
  return (
    <FormField
      control={form.control}
      name="adjustmentDirection"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Adjustment type</FormLabel>
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={isSubmitting}
          >
            <FormControl>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {INVENTORY_ADJUSTMENT_DIRECTIONS.map((direction) => (
                <SelectItem key={direction} value={direction}>
                  {direction}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default memo(InventoryAdjustmentDirectionField);
