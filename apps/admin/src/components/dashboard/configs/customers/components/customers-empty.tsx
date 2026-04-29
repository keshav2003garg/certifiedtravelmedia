import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Plus, Users } from '@repo/ui/lib/icons';

interface CustomersEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}

function CustomersEmpty({
  hasFilters,
  onClearFilters,
  onCreate,
}: CustomersEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <Users className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters ? 'No customers match' : 'No customers yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find a matching customer.'
          : 'Create the first customer so brochures and contracts can be linked cleanly.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters ? (
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          New customer
        </Button>
      </div>
    </div>
  );
}

export default memo(CustomersEmpty);
