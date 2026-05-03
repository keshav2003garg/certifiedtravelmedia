import { env } from '@repo/env/server';

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import onError from '@repo/server-utils/handlers/error';
import notFound from '@repo/server-utils/handlers/not-found';
import { createUserContextMiddleware } from '@repo/server-utils/middlewares/auth.middleware';

import auth from '@/services/auth';

import chartsRoute from '@/routes/admin/charts/charts.route';
import configsRoute from '@/routes/admin/configs/configs.route';
import inventoryRoute from '@/routes/admin/inventory/inventory.route';
import locationsRoute from '@/routes/admin/locations/locations.route';
import reportsRoute from '@/routes/admin/reports/reports.route';
import uploadsRoute from '@/routes/admin/uploads/uploads.route';
import publicChartsRoute from '@/routes/public/charts/charts.route';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const app = new Hono<AppBindings>();

app.use(
  '/api/*',
  cors({
    origin: env.ALLOWED_ORIGINS,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.use('/api/*', createUserContextMiddleware(auth));

app.get('/', (c) => {
  return c.text('Zygot API server is running');
});

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

app.route('/api/admin/configs', configsRoute);
app.route('/api/admin/charts', chartsRoute);
app.route('/api/admin/inventory', inventoryRoute);
app.route('/api/admin/locations', locationsRoute);
app.route('/api/admin/reports', reportsRoute);
app.route('/api/admin/uploads', uploadsRoute);
app.route('/api/charts', publicChartsRoute);

app.notFound(notFound);
app.onError(onError);

export default app;
