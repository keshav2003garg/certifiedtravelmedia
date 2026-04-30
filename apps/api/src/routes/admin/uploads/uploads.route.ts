import { Hono } from 'hono';

import { isStaffOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createSignedDownloadUrlHandler,
  createSignedUploadUrlHandler,
  deleteObjectHandler,
} from './uploads.handlers';
import {
  createSignedDownloadUrlValidator,
  createSignedUploadUrlValidator,
  deleteObjectValidator,
} from './uploads.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const uploadsRoute = new Hono<AppBindings>();

uploadsRoute.post(
  '/signed-upload-url',
  isStaffOrAbove,
  validator(createSignedUploadUrlValidator),
  createSignedUploadUrlHandler,
);

uploadsRoute.post(
  '/signed-download-url',
  isStaffOrAbove,
  validator(createSignedDownloadUrlValidator),
  createSignedDownloadUrlHandler,
);

uploadsRoute.post(
  '/delete',
  isStaffOrAbove,
  validator(deleteObjectValidator),
  deleteObjectHandler,
);

export default uploadsRoute;
