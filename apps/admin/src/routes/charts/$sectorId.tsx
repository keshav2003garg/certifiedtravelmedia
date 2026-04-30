import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import { ArrowLeft } from '@repo/ui/lib/icons';

import ChartEditorPage from '@/components/dashboard/charts/chart-editor/chart-editor-page';
import { validateChartEditorSearch } from '@/components/dashboard/charts/chart-editor/chart-editor-search';

import { getMetadata } from '@/utils/metadata.util';

import { getUser } from '@/functions/get-user-details';

const MANAGER_ROLES = new Set(['admin', 'manager']);

export const Route = createFileRoute('/charts/$sectorId')({
  validateSearch: validateChartEditorSearch,
  component: RouteComponent,
  head: () => getMetadata('/dashboard/charts'),
  loader: async function () {
    const data = await getUser();

    if (!data) {
      throw redirect({ to: '/login' });
    }

    return { user: data.user };
  },
});

function RouteComponent() {
  const { sectorId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = Route.useLoaderData();
  const navigate = useNavigate();
  const isManager =
    typeof user.role === 'string' && MANAGER_ROLES.has(user.role);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-white px-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link to="/dashboard/charts" aria-label="Back to charts">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-foreground text-base font-semibold tracking-normal">
          Sector Chart Editor
        </h1>
      </header>

      <main className="h-[calc(100vh-3rem)] overflow-hidden p-3">
        <ChartEditorPage
          sectorId={sectorId}
          width={search.width}
          height={search.height}
          month={search.month}
          year={search.year}
          isManager={isManager}
          isFullscreen
          showBackButton={false}
          onMonthChange={(month, year) =>
            navigate({
              to: '/charts/$sectorId',
              params: { sectorId },
              search: { ...search, month, year },
            })
          }
        />
      </main>
    </div>
  );
}
