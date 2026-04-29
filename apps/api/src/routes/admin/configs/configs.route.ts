import { Hono } from 'hono';

import brochureTypesRoute from './brochure-types/brochure-types.route';
import brochuresRoute from './brochures/brochures.route';
import customersRoute from './customers/customers.route';
import warehousesRoute from './warehouses/warehouses.route';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const configsRoute = new Hono<AppBindings>();

configsRoute.route('/brochure-types', brochureTypesRoute);
configsRoute.route('/brochures', brochuresRoute);
configsRoute.route('/customers', customersRoute);
configsRoute.route('/warehouses', warehousesRoute);

export default configsRoute;
