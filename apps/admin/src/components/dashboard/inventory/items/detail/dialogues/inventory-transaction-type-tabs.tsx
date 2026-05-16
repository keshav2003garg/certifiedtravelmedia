import { memo } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/base/tabs';

import { inventoryTransactionTypeOptions } from './create-inventory-transaction-dialog.constants';

import type { InventoryTransactionTabValue } from './create-inventory-transaction-dialog.constants';

interface InventoryTransactionTypeTabsProps {
  disabled: boolean;
  onValueChange: (value: InventoryTransactionTabValue) => void;
  value: InventoryTransactionTabValue;
}

function InventoryTransactionTypeTabs({
  disabled,
  onValueChange,
  value,
}: InventoryTransactionTypeTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as InventoryTransactionTabValue)
      }
    >
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
        {inventoryTransactionTypeOptions.map((option) => {
          const Icon = option.icon;

          return (
            <TabsTrigger
              key={option.value}
              value={option.value}
              disabled={disabled}
              className="min-w-0 gap-2 px-2"
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{option.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export default memo(InventoryTransactionTypeTabs);
