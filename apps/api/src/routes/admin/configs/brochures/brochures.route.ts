import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createBrochureHandler,
  createBrochureImageHandler,
  createImagePackSizeHandler,
  deleteBrochureHandler,
  deleteBrochureImageHandler,
  deleteImagePackSizeHandler,
  getBrochureHandler,
  listBrochuresHandler,
  updateBrochureHandler,
  updateBrochureImageHandler,
  updateImagePackSizeHandler,
} from './brochures.handlers';
import {
  brochureIdValidator,
  createBrochureImageValidator,
  createBrochureValidator,
  createImagePackSizeValidator,
  deleteBrochureImageValidator,
  deleteBrochureValidator,
  deleteImagePackSizeValidator,
  listBrochuresValidator,
  updateBrochureImageValidator,
  updateBrochureValidator,
  updateImagePackSizeValidator,
} from './brochures.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const brochuresRoute = new Hono<AppBindings>();

brochuresRoute.get(
  '/',
  isStaffOrAbove,
  validator(listBrochuresValidator),
  listBrochuresHandler,
);

brochuresRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(brochureIdValidator),
  getBrochureHandler,
);

brochuresRoute.post(
  '/',
  isManagerOrAbove,
  validator(createBrochureValidator),
  createBrochureHandler,
);

brochuresRoute.put(
  '/:id',
  isManagerOrAbove,
  validator(updateBrochureValidator),
  updateBrochureHandler,
);

brochuresRoute.patch(
  '/:id',
  isManagerOrAbove,
  validator(updateBrochureValidator),
  updateBrochureHandler,
);

brochuresRoute.delete(
  '/:id',
  isManagerOrAbove,
  validator(deleteBrochureValidator),
  deleteBrochureHandler,
);

brochuresRoute.post(
  '/:id/images',
  isManagerOrAbove,
  validator(createBrochureImageValidator),
  createBrochureImageHandler,
);

brochuresRoute.patch(
  '/:id/images/:imageId',
  isManagerOrAbove,
  validator(updateBrochureImageValidator),
  updateBrochureImageHandler,
);

brochuresRoute.delete(
  '/:id/images/:imageId',
  isManagerOrAbove,
  validator(deleteBrochureImageValidator),
  deleteBrochureImageHandler,
);

brochuresRoute.post(
  '/:id/images/:imageId/pack-sizes',
  isManagerOrAbove,
  validator(createImagePackSizeValidator),
  createImagePackSizeHandler,
);

brochuresRoute.patch(
  '/:id/images/:imageId/pack-sizes/:packSizeId',
  isManagerOrAbove,
  validator(updateImagePackSizeValidator),
  updateImagePackSizeHandler,
);

brochuresRoute.delete(
  '/:id/images/:imageId/pack-sizes/:packSizeId',
  isManagerOrAbove,
  validator(deleteImagePackSizeValidator),
  deleteImagePackSizeHandler,
);

export default brochuresRoute;
