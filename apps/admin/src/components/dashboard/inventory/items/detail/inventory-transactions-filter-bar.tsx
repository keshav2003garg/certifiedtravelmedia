import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';

import {
  INVENTORY_TRANSACTION_TYPE_OPTIONS,
  type useInventoryItemTransactionsFilters,
} from '@/hooks/useInventoryItems/useInventoryItemTransactionsFilters';

import type { InventoryTransactionType } from '@/hooks/useInventoryItems/types';

type InventoryTransactionFilters = ReturnType<
  typeof useInventoryItemTransactionsFilters
>;

interface InventoryTransactionsFilterBarProps {
  filters: InventoryTransactionFilters;
}

const FILTER_ALL = '__all__';

function InventoryTransactionsFilterBar({
  filters,
}: InventoryTransactionsFilterBarProps) {
  const {
    transactionType,
    dateFrom,
    dateTo,
    handleTransactionTypeChange,
    handleDateFromChange,
    handleDateToChange,
    clearFilters,
    hasActiveFilters,
  } = filters;

  return (
    <div className="grid gap-3 lg:grid-cols-[220px_1fr_1fr_auto]">
      <Select
        value={transactionType ?? FILTER_ALL}
        onValueChange={(value) =>
          handleTransactionTypeChange(
            value === FILTER_ALL ? null : (value as InventoryTransactionType),
          )
        }
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder="All transaction types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>All transaction types</SelectItem>
          {INVENTORY_TRANSACTION_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={dateFrom ?? ''}
        onChange={(event) => handleDateFromChange(event.target.value)}
        aria-label="Transaction start date"
        className="h-11"
      />

      <Input
        type="date"
        value={dateTo ?? ''}
        onChange={(event) => handleDateToChange(event.target.value)}
        aria-label="Transaction end date"
        className="h-11"
      />

      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={!hasActiveFilters}
        onClick={clearFilters}
      >
        Clear filters
      </Button>
    </div>
  );
}

export default memo(InventoryTransactionsFilterBar);
