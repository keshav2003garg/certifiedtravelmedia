import { useLoaderData } from '@tanstack/react-router';

const USER_ROLES = ['admin', 'manager', 'staff', 'user'] as const;
const MANAGER_ROLES = new Set<UserRole>(['admin', 'manager']);
const STAFF_ROLES = new Set<UserRole>(['admin', 'manager', 'staff']);

export type UserRole = (typeof USER_ROLES)[number];

function isUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && USER_ROLES.includes(role as UserRole);
}

export function useUserRole() {
  const { user } = useLoaderData({ from: '/dashboard' });
  const role = isUserRole(user.role) ? user.role : 'user';

  return {
    role,
    isAdmin: role === 'admin',
    isManager: MANAGER_ROLES.has(role),
    isStaff: STAFF_ROLES.has(role),
  };
}
