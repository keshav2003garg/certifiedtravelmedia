import HttpError from '../errors/http-error';

import type { Context, Next } from 'hono';
import type { BetterAuth } from '@services/betterauth';
import type { AppBindings } from '../types/app.types';

export function createUserContextMiddleware(auth: BetterAuth) {
  return async function addUserToContext(
    ctx: Context<AppBindings>,
    next: Next,
  ) {
    const session = await auth.api.getSession({
      headers: ctx.req.raw.headers,
    });

    if (!session) {
      ctx.set('user', null);
      ctx.set('session', null);
      return next();
    }

    ctx.set('user', session.user);
    ctx.set('session', session.session);

    return next();
  };
}

export async function isAuthenticated(ctx: Context<AppBindings>, next: Next) {
  const user = ctx.get('user');
  const session = ctx.get('session');
  if (!user || !session) {
    throw new HttpError(401, 'You are not authenticated', 'UNAUTHORIZED');
  }

  return next();
}

export async function isAdmin(ctx: Context<AppBindings>, next: Next) {
  const user = ctx.get('user');
  if (!user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  if (user.role !== 'admin') {
    throw new HttpError(
      403,
      'Access denied. Admin privileges required.',
      'FORBIDDEN',
    );
  }

  return next();
}

export async function isManagerOrAbove(ctx: Context<AppBindings>, next: Next) {
  const user = ctx.get('user');
  if (!user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  if (!['admin', 'manager'].includes(user.role ?? '')) {
    throw new HttpError(403, 'Manager access required', 'FORBIDDEN');
  }

  return next();
}

export async function isStaffOrAbove(ctx: Context<AppBindings>, next: Next) {
  const user = ctx.get('user');
  if (!user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  if (!['admin', 'manager', 'staff'].includes(user.role ?? '')) {
    throw new HttpError(403, 'Staff access required', 'FORBIDDEN');
  }

  return next();
}

export async function isStaffOnly(ctx: Context<AppBindings>, next: Next) {
  const user = ctx.get('user');
  if (!user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  if (user.role !== 'staff') {
    throw new HttpError(403, 'Staff-only access required', 'FORBIDDEN');
  }

  return next();
}
