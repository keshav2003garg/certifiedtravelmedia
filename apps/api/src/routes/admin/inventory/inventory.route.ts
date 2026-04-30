import { Hono } from 'hono';

import requestsRoute from './requests/requests.route';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const inventoryRoute = new Hono<AppBindings>();

inventoryRoute.route('/requests', requestsRoute);

export default inventoryRoute;
