import { Hono } from 'hono';

import itemsRoute from './items/items.route';
import requestsRoute from './requests/requests.route';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const inventoryRoute = new Hono<AppBindings>();

inventoryRoute.route('/items', itemsRoute);
inventoryRoute.route('/requests', requestsRoute);

export default inventoryRoute;
