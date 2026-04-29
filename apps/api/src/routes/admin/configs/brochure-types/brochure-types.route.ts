import { Hono } from 'hono';

import {
  isAdmin,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createBrochureTypeHandler,
  deleteBrochureTypeHandler,
  getBrochureTypeHandler,
  listBrochureTypesHandler,
  updateBrochureTypeHandler,
} from './brochure-types.handlers';
import {
  brochureTypeIdValidator,
  createBrochureTypeValidator,
  deleteBrochureTypeValidator,
  listBrochureTypesValidator,
  updateBrochureTypeValidator,
} from './brochure-types.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const brochureTypesRoute = new Hono<AppBindings>();

brochureTypesRoute.get(
  '/',
  isStaffOrAbove,
  validator(listBrochureTypesValidator),
  listBrochureTypesHandler,
);

brochureTypesRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(brochureTypeIdValidator),
  getBrochureTypeHandler,
);

brochureTypesRoute.post(
  '/',
  isAdmin,
  validator(createBrochureTypeValidator),
  createBrochureTypeHandler,
);

brochureTypesRoute.put(
  '/:id',
  isAdmin,
  validator(updateBrochureTypeValidator),
  updateBrochureTypeHandler,
);

brochureTypesRoute.patch(
  '/:id',
  isAdmin,
  validator(updateBrochureTypeValidator),
  updateBrochureTypeHandler,
);

brochureTypesRoute.delete(
  '/:id',
  isAdmin,
  validator(deleteBrochureTypeValidator),
  deleteBrochureTypeHandler,
);

export default brochureTypesRoute;
