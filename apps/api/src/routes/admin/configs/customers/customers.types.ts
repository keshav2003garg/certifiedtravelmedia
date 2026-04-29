import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type { Customer } from '@services/database/types';
import type {
  createCustomerValidator,
  customerIdValidator,
  deleteCustomerValidator,
  listCustomersValidator,
  updateCustomerValidator,
} from './customers.validators';

export type ListCustomersParams = z.infer<
  (typeof listCustomersValidator)['query']
>;

export type CustomerIdParams = z.infer<(typeof customerIdValidator)['param']>;

export type DeleteCustomerParams = z.infer<
  (typeof deleteCustomerValidator)['param']
>;

export type CreateCustomerInput = z.infer<
  (typeof createCustomerValidator)['json']
>;

export type UpdateCustomerInput = z.infer<
  (typeof updateCustomerValidator)['json']
>;

export type CustomerWithUsage = Customer & {
  brochureCount: number;
  contractCount: number;
};

export type ListCustomersResult = PaginatedResponse<CustomerWithUsage>;
