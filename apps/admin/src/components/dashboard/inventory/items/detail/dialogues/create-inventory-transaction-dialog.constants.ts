import {
  ArrowRightLeft,
  PackagePlus,
  Recycle,
  RotateCcw,
  SlidersHorizontal,
} from '@repo/ui/lib/icons';

import type { InventoryItemTransactionActionType } from '@/hooks/useInventoryItems/types';

export const INVENTORY_TRANSACTION_ACTION_TYPES = [
  'Delivery',
  'Start Count',
  'Transfer',
  'Return to Client',
  'Recycle',
  'Adjustment',
] as const satisfies readonly InventoryItemTransactionActionType[];

export const INVENTORY_TRANSACTION_DECIMAL_EPSILON = 0.000_001;

/**
 * The combined "Delivery & Start Count" tab is rendered as a single
 * tab in the type selector but lets the user pick between two
 * underlying transaction types. The tab is keyed by this synthetic
 * value; the actual API `transactionType` is stored separately on the
 * form.
 */
export const DELIVERY_OR_START_COUNT_TAB = 'DeliveryOrStartCount' as const;

export const INVENTORY_TRANSACTION_TAB_VALUES = [
  DELIVERY_OR_START_COUNT_TAB,
  'Transfer',
  'Return to Client',
  'Recycle',
  'Adjustment',
] as const;

export type InventoryTransactionTabValue =
  (typeof INVENTORY_TRANSACTION_TAB_VALUES)[number];

export const inventoryTransactionTypeOptions = [
  {
    value: DELIVERY_OR_START_COUNT_TAB,
    label: 'Delivery & Start Count',
    icon: PackagePlus,
  },
  { value: 'Transfer', label: 'Transfer', icon: ArrowRightLeft },
  { value: 'Return to Client', label: 'Return', icon: RotateCcw },
  { value: 'Recycle', label: 'Recycle', icon: Recycle },
  { value: 'Adjustment', label: 'Adjust', icon: SlidersHorizontal },
] as const satisfies readonly {
  value: InventoryTransactionTabValue;
  label: string;
  icon: typeof ArrowRightLeft;
}[];

export const DELIVERY_OR_START_COUNT_OPTIONS = [
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Start Count', label: 'Start Count' },
] as const satisfies readonly {
  value: Extract<
    InventoryItemTransactionActionType,
    'Delivery' | 'Start Count'
  >;
  label: string;
}[];
