import { memo } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';

import {
  DELIVERY_OR_START_COUNT_TAB,
  INVENTORY_TRANSACTION_ACTION_TYPES,
} from './create-inventory-transaction-dialog.constants';
import InventoryTransactionTypeTabs from './inventory-transaction-type-tabs';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { InventoryTransactionTabValue } from './create-inventory-transaction-dialog.constants';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

interface InventoryTransactionTypeFieldProps {
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isSubmitting: boolean;
}

/**
 * Maps a tab value to the API `transactionType` it should default to
 * when the tab is activated. The combined "Delivery & Start Count"
 * tab defaults to `Delivery`.
 */
function getDefaultTransactionTypeForTab(
  tab: InventoryTransactionTabValue,
): CreateInventoryTransactionFormData['transactionType'] {
  if (tab === DELIVERY_OR_START_COUNT_TAB) return 'Delivery';
  return tab;
}

function isApiTransactionType(
  value: string,
): value is CreateInventoryTransactionFormData['transactionType'] {
  return (
    INVENTORY_TRANSACTION_ACTION_TYPES as readonly string[]
  ).includes(value);
}

function InventoryTransactionTypeField({
  form,
  isSubmitting,
}: InventoryTransactionTypeFieldProps) {
  function handleTabChange(nextTab: InventoryTransactionTabValue) {
    form.setValue('formTab', nextTab, { shouldValidate: false });

    const currentType = form.getValues('transactionType');
    const tabActsAsType = isApiTransactionType(nextTab);

    if (tabActsAsType) {
      form.setValue('transactionType', nextTab, { shouldValidate: true });
    } else if (
      // For the combined tab, only reset the API type when the previous
      // selection wasn't already one of the combined-tab options.
      currentType !== 'Delivery' &&
      currentType !== 'Start Count'
    ) {
      form.setValue(
        'transactionType',
        getDefaultTransactionTypeForTab(nextTab),
        { shouldValidate: true },
      );
    }

    if (nextTab !== 'Transfer') {
      form.setValue('destinationWarehouseId', '', { shouldValidate: false });
    }
  }

  return (
    <FormField
      control={form.control}
      name="formTab"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction type</FormLabel>
          <FormControl>
            <InventoryTransactionTypeTabs
              value={field.value}
              onValueChange={handleTabChange}
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
