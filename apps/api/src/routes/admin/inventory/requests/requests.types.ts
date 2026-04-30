import type { z } from '@repo/utils/zod';
import type {
  createInventoryRequestValidator,
  listInventoryRequestsValidator,
} from './requests.validators';

export type CreateInventoryRequestInput = z.infer<
  (typeof createInventoryRequestValidator)['json']
>;

export type ListInventoryRequestsParams = z.infer<
  (typeof listInventoryRequestsValidator)['query']
>;
