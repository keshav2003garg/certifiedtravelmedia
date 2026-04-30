import type { z } from '@repo/utils/zod';
import type { createInventoryRequestValidator } from './requests.validators';

export type CreateInventoryRequestInput = z.infer<
  (typeof createInventoryRequestValidator)['json']
>;
