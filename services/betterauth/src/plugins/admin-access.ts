import { createAccessControl } from 'better-auth/plugins/access';

const statements = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
  inventory: ['create', 'read', 'update', 'delete', 'confirm'],
  charts: ['create', 'read', 'update', 'delete', 'archive'],
  counts: ['create', 'read', 'update'],
  reports: ['create', 'read'],
  config: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  user: ac.newRole({
    user: [],
    session: [],
    inventory: ['read'],
    charts: ['read'],
    counts: ['read'],
    reports: ['read'],
  }),
  staff: ac.newRole({
    user: [],
    session: [],
    inventory: ['create', 'read'],
    charts: ['read'],
    counts: ['create', 'read'],
    reports: ['read'],
  }),
  manager: ac.newRole({
    user: [],
    session: [],
    inventory: ['create', 'read', 'update', 'delete', 'confirm'],
    charts: ['create', 'read', 'update', 'delete', 'archive'],
    counts: ['create', 'read', 'update'],
    reports: ['create', 'read'],
  }),
  admin: ac.newRole({
    user: [
      'create',
      'list',
      'set-role',
      'ban',
      'impersonate',
      'delete',
      'set-password',
      'get',
      'update',
    ],
    session: ['list', 'revoke', 'delete'],
    inventory: ['create', 'read', 'update', 'delete', 'confirm'],
    charts: ['create', 'read', 'update', 'delete', 'archive'],
    counts: ['create', 'read', 'update'],
    reports: ['create', 'read'],
    config: ['create', 'read', 'update', 'delete'],
  }),
};

export type BetterAuthRole = keyof typeof roles;
