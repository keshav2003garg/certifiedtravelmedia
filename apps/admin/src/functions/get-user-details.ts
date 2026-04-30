// Node Module
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

// Lib
import { auth } from '@/lib/auth';

export const getUser = createServerFn().handler(async () => {
  const { data: session } = await auth.getSession({
    fetchOptions: {
      headers: getRequestHeaders(),
    },
  });

  if (!session) return null;

  const allowedRoles = ['admin', 'manager', 'staff'];
  if (!allowedRoles.includes(session.user.role ?? '')) return null;

  return session;
});
