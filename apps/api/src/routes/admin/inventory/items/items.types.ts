import type { z } from '@repo/utils/zod';
import type {
  InventoryItem,
  InventoryTransaction,
} from '@services/database/types';
import type { createInventoryIntakeValidator } from './items.validators';

export type CreateInventoryIntakeInput = z.infer<
  (typeof createInventoryIntakeValidator)['json']
>;

export interface InventoryIntakeResult {
  item: InventoryItem;
  transaction: InventoryTransaction;
  created: boolean;
}
