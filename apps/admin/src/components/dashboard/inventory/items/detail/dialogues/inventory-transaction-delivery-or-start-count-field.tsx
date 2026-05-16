import { memo } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/base/tabs';

import { DELIVERY_OR_START_COUNT_OPTIONS } from './create-inventory-transaction-dialog.constants';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

type DeliveryOrStartCountValue =
  (typeof DELIVERY_OR_START_COUNT_OPTIONS)[number]['value'];

interface InventoryTransactionDeliveryOrStartCountFieldProps {
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isSubmitting: boolean;
}

function isDeliveryOrStartCountValue(
  value: string,
): value is DeliveryOrStartCountValue {
  return DELIVERY_OR_START_COUNT_OPTIONS.some(
    (option) => option.value === value,
  );
}

function InventoryTransactionDeliveryOrStartCountField({
  form,
  isSubmitting,
}: InventoryTransactionDeliveryOrStartCountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="transactionType"
      render={({ field }) => {
        const currentValue: DeliveryOrStartCountValue =
          field.value === 'Start Count' ? 'Start Count' : 'Delivery';

        return (
          <FormItem>
            <FormLabel>Sub-type</FormLabel>
            <FormControl>
              <Tabs
                value={currentValue}
                onValueChange={(nextValue) => {
                  if (!isDeliveryOrStartCountValue(nextValue)) return;
                  field.onChange(nextValue);
                }}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
                  {DELIVERY_OR_START_COUNT_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      disabled={isSubmitting}
                      className="min-w-0 px-2"
                    >
                      <span className="truncate">{option.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default memo(InventoryTransactionDeliveryOrStartCountField);
