import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
  beforeLoad: function () {
    throw redirect({ to: '/login' });
  },
});

function RouteComponent() {
  return null;
}
