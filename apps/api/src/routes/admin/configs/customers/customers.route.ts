import { Hono } from 'hono';

import {
  isAdmin,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createCustomerHandler,
  deleteCustomerHandler,
  getCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
} from './customers.handlers';
import {
  createCustomerValidator,
  customerIdValidator,
  deleteCustomerValidator,
  listCustomersValidator,
  updateCustomerValidator,
} from './customers.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const customersRoute = new Hono<AppBindings>();

customersRoute.get(
  '/',
  isStaffOrAbove,
  validator(listCustomersValidator),
  listCustomersHandler,
);

customersRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(customerIdValidator),
  getCustomerHandler,
);

customersRoute.post(
  '/',
  isAdmin,
  validator(createCustomerValidator),
  createCustomerHandler,
);

customersRoute.put(
  '/:id',
  isAdmin,
  validator(updateCustomerValidator),
  updateCustomerHandler,
);

customersRoute.patch(
  '/:id',
  isAdmin,
  validator(updateCustomerValidator),
  updateCustomerHandler,
);

customersRoute.delete(
  '/:id',
  isAdmin,
  validator(deleteCustomerValidator),
  deleteCustomerHandler,
);

export default customersRoute;
