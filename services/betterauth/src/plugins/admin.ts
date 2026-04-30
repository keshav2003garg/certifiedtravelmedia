import { admin } from 'better-auth/plugins';

import { ac, roles } from './admin-access';

export default function adminPlugin() {
  return admin({
    defaultRole: 'user',
    adminRoles: ['admin'],
    ac,
    roles,
  });
}
