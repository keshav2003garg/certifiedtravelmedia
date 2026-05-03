import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { cn } from '@repo/ui/lib/utils';

import type { InventoryStockLevel } from '@/hooks/useInventoryItems/types';

interface InventoryStockLevelBadgeProps {
  stockLevel: InventoryStockLevel;
}

const stockLevelClassName: Record<InventoryStockLevel, string> = {
  Low: 'border-destructive/30 bg-destructive/10 text-destructive',
  'On Target': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  Overstock: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
};

function InventoryStockLevelBadge({
  stockLevel,
}: InventoryStockLevelBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md', stockLevelClassName[stockLevel])}
    >
      {stockLevel}
    </Badge>
  );
}

export default memo(InventoryStockLevelBadge);