import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Plus, Users } from '@repo/ui/lib/icons';

interface UsersEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}

function UsersEmpty({ hasFilters, onClearFilters, onCreate }: UsersEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <Users className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters ? 'No users match' : 'No users yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find a matching account.'
          : 'Create the first staff, manager, or admin account for this dashboard.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters ? (
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          Add user
        </Button>
      </div>
    </div>
  );
}

export default memo(UsersEmpty);
