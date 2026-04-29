import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type { BrochureType } from '@services/database/types';
import type {
  brochureTypeIdValidator,
  createBrochureTypeValidator,
  deleteBrochureTypeValidator,
  listBrochureTypesValidator,
  updateBrochureTypeValidator,
} from './brochure-types.validators';

export type ListBrochureTypesParams = z.infer<
  (typeof listBrochureTypesValidator)['query']
>;

export type BrochureTypeIdParams = z.infer<
  (typeof brochureTypeIdValidator)['param']
>;

export type DeleteBrochureTypeParams = z.infer<
  (typeof deleteBrochureTypeValidator)['param']
>;

export type CreateBrochureTypeInput = z.infer<
  (typeof createBrochureTypeValidator)['json']
>;

export type UpdateBrochureTypeInput = z.infer<
  (typeof updateBrochureTypeValidator)['json']
>;

export type ListBrochureTypesResult = PaginatedResponse<BrochureType>;
