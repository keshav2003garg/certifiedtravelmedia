import { memo } from 'react';

import { formatDecimal } from '@repo/utils/number';

import type { InventoryItemDetail } from '@/hooks/useInventoryItems/types';

interface InventoryTransactionBalanceSummaryProps {
  item: InventoryItemDetail;
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function InventoryTransactionBalanceSummary({
  item,
}: InventoryTransactionBalanceSummaryProps) {
  return (
    <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
          Current boxes
        </p>
        <p className="mt-1 text-sm font-semibold">
          {formatQuantity(item.boxes)}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
          Units per box
        </p>
        <p className="mt-1 text-sm font-semibold">
          {formatQuantity(item.unitsPerBox)}
        </p>
      </div>
    </div>
  );
}

export default memo(InventoryTransactionBalanceSummary);
