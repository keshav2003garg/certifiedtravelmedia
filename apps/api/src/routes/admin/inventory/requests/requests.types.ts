import type { z } from '@repo/utils/zod';
import type {
  approveInventoryRequestValidator,
  createInventoryRequestValidator,
  listInventoryRequestsValidator,
  rejectInventoryRequestValidator,
} from './requests.validators';

export type CreateInventoryRequestInput = z.infer<
  (typeof createInventoryRequestValidator)['json']
>;

export type ListInventoryRequestsParams = z.infer<
  (typeof listInventoryRequestsValidator)['query']
>;

export type ApproveInventoryRequestInput = z.infer<
  (typeof approveInventoryRequestValidator)['json']
>;

export type RejectInventoryRequestInput = z.infer<
  (typeof rejectInventoryRequestValidator)['json']
>;
