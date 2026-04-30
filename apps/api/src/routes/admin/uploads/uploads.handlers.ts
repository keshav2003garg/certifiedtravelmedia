import sendResponse from '@repo/server-utils/utils/response';

import { uploadsService } from './uploads.services';

import type {
  CreateSignedDownloadUrlContext,
  CreateSignedUploadUrlContext,
  DeleteObjectContext,
} from './uploads.validators';

export async function createSignedUploadUrlHandler(
  ctx: CreateSignedUploadUrlContext,
) {
  const body = ctx.req.valid('json');

  const upload = await uploadsService.createSignedUploadUrl(body);

  return sendResponse(ctx, 200, 'Signed upload URL created successfully', {
    upload,
  });
}

export async function createSignedDownloadUrlHandler(
  ctx: CreateSignedDownloadUrlContext,
) {
  const body = ctx.req.valid('json');

  const download = await uploadsService.createSignedDownloadUrl(body);

  return sendResponse(ctx, 200, 'Signed download URL created successfully', {
    download,
  });
}

export async function deleteObjectHandler(ctx: DeleteObjectContext) {
  const body = ctx.req.valid('json');

  const object = await uploadsService.deleteObject(body);

  return sendResponse(ctx, 200, 'Storage object deleted successfully', {
    object,
  });
}
