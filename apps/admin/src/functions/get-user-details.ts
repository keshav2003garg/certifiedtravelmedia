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

  if (session.user.role !== 'admin') return null;

  return session;
});
