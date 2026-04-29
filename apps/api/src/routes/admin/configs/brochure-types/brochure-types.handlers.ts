import sendResponse from '@repo/server-utils/utils/response';

import { brochureTypesService } from './brochure-types.services';

import type {
  BrochureTypeIdContext,
  CreateBrochureTypeContext,
  DeleteBrochureTypeContext,
  ListBrochureTypesContext,
  UpdateBrochureTypeContext,
} from './brochure-types.validators';

export async function listBrochureTypesHandler(ctx: ListBrochureTypesContext) {
  const params = ctx.req.valid('query');

  const result = await brochureTypesService.list(params);

  return sendResponse(ctx, 200, 'Brochure types retrieved successfully', {
    brochureTypes: result.data,
    pagination: result.pagination,
  });
}

export async function getBrochureTypeHandler(ctx: BrochureTypeIdContext) {
  const { id } = ctx.req.valid('param');

  const brochureType = await brochureTypesService.getById(id);

  return sendResponse(ctx, 200, 'Brochure type retrieved successfully', {
    brochureType,
  });
}

export async function createBrochureTypeHandler(
  ctx: CreateBrochureTypeContext,
) {
  const body = ctx.req.valid('json');

  const brochureType = await brochureTypesService.create(body);

  return sendResponse(ctx, 201, 'Brochure type created successfully', {
    brochureType,
  });
}

export async function updateBrochureTypeHandler(
  ctx: UpdateBrochureTypeContext,
) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const brochureType = await brochureTypesService.update(id, body);

  return sendResponse(ctx, 200, 'Brochure type updated successfully', {
    brochureType,
  });
}

export async function deleteBrochureTypeHandler(
  ctx: DeleteBrochureTypeContext,
) {
  const { id } = ctx.req.valid('param');

  const brochureType = await brochureTypesService.delete(id);

  return sendResponse(ctx, 200, 'Brochure type deleted successfully', {
    brochureType,
  });
}
