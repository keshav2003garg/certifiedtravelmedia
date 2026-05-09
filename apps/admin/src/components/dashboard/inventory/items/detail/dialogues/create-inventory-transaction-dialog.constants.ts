import {
  ArrowRightLeft,
  Recycle,
  RotateCcw,
  SlidersHorizontal,
} from '@repo/ui/lib/icons';

import type { InventoryItemTransactionActionType } from '@/hooks/useInventoryItems/types';

export const INVENTORY_TRANSACTION_ACTION_TYPES = [
  'Transfer',
  'Return to Client',
  'Recycle',
  'Adjustment',
] as const satisfies readonly InventoryItemTransactionActionType[];

export const INVENTORY_TRANSACTION_DECIMAL_EPSILON = 0.000_001;

export const inventoryTransactionTypeOptions = [
  { value: 'Transfer', label: 'Transfer', icon: ArrowRightLeft },
  { value: 'Return to Client', label: 'Return', icon: RotateCcw },
  { value: 'Recycle', label: 'Recycle', icon: Recycle },
  { value: 'Adjustment', label: 'Adjust', icon: SlidersHorizontal },
] as const satisfies readonly {
  value: (typeof INVENTORY_TRANSACTION_ACTION_TYPES)[number];
  label: string;
  icon: typeof ArrowRightLeft;
}[];
