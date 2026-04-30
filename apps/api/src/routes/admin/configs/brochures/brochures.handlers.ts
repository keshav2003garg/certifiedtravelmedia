import sendResponse from '@repo/server-utils/utils/response';

import { brochuresService } from './brochures.services';

import type {
  BrochureIdContext,
  CreateBrochureContext,
  CreateBrochureImageContext,
  CreateImagePackSizeContext,
  DeleteBrochureContext,
  DeleteBrochureImageContext,
  DeleteImagePackSizeContext,
  ListBrochuresContext,
  UpdateBrochureContext,
  UpdateBrochureImageContext,
  UpdateImagePackSizeContext,
} from './brochures.validators';

export async function listBrochuresHandler(ctx: ListBrochuresContext) {
  const params = ctx.req.valid('query');

  const result = await brochuresService.list(params);

  return sendResponse(ctx, 200, 'Brochures retrieved successfully', {
    brochures: result.data,
    pagination: result.pagination,
  });
}

export async function getBrochureHandler(ctx: BrochureIdContext) {
  const { id } = ctx.req.valid('param');

  const brochure = await brochuresService.getById(id);

  return sendResponse(ctx, 200, 'Brochure retrieved successfully', {
    brochure,
  });
}

export async function createBrochureHandler(ctx: CreateBrochureContext) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');

  const brochure = await brochuresService.create(body, user.id);

  return sendResponse(ctx, 201, 'Brochure created successfully', {
    brochure,
  });
}

export async function updateBrochureHandler(ctx: UpdateBrochureContext) {
  const body = ctx.req.valid('json');
  const { id } = ctx.req.valid('param');

  const brochure = await brochuresService.update(id, body);

  return sendResponse(ctx, 200, 'Brochure updated successfully', {
    brochure,
  });
}

export async function deleteBrochureHandler(ctx: DeleteBrochureContext) {
  const { id } = ctx.req.valid('param');

  const brochure = await brochuresService.delete(id);

  return sendResponse(ctx, 200, 'Brochure deleted successfully', {
    brochure,
  });
}

export async function createBrochureImageHandler(
  ctx: CreateBrochureImageContext,
) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');
  const { id } = ctx.req.valid('param');

  const brochure = await brochuresService.createImage(id, body, user.id);

  return sendResponse(ctx, 201, 'Brochure image created successfully', {
    brochure,
  });
}

export async function updateBrochureImageHandler(
  ctx: UpdateBrochureImageContext,
) {
  const body = ctx.req.valid('json');
  const { id, imageId } = ctx.req.valid('param');

  const brochure = await brochuresService.updateImage(id, imageId, body);

  return sendResponse(ctx, 200, 'Brochure image updated successfully', {
    brochure,
  });
}

export async function deleteBrochureImageHandler(
  ctx: DeleteBrochureImageContext,
) {
  const { id, imageId } = ctx.req.valid('param');

  const brochure = await brochuresService.deleteImage(id, imageId);

  return sendResponse(ctx, 200, 'Brochure image deleted successfully', {
    brochure,
  });
}

export async function createImagePackSizeHandler(
  ctx: CreateImagePackSizeContext,
) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');
  const { id, imageId } = ctx.req.valid('param');

  const packSize = await brochuresService.createImagePackSize(
    id,
    imageId,
    body,
    user.id,
  );

  return sendResponse(ctx, 201, 'Image pack size created successfully', {
    packSize,
  });
}

export async function updateImagePackSizeHandler(
  ctx: UpdateImagePackSizeContext,
) {
  const body = ctx.req.valid('json');
  const { id, imageId, packSizeId } = ctx.req.valid('param');

  const packSize = await brochuresService.updateImagePackSize(
    id,
    imageId,
    packSizeId,
    body,
  );

  return sendResponse(ctx, 200, 'Image pack size updated successfully', {
    packSize,
  });
}

export async function deleteImagePackSizeHandler(
  ctx: DeleteImagePackSizeContext,
) {
  const { id, imageId, packSizeId } = ctx.req.valid('param');

  const packSize = await brochuresService.deleteImagePackSize(
    id,
    imageId,
    packSizeId,
  );

  return sendResponse(ctx, 200, 'Image pack size deleted successfully', {
    packSize,
  });
}
