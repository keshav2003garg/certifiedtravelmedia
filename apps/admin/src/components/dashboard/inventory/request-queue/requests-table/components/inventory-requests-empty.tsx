import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Inbox } from '@repo/ui/lib/icons';

interface InventoryRequestsEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function InventoryRequestsEmpty({
  hasFilters,
  onClearFilters,
}: InventoryRequestsEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <Inbox className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters
          ? 'No requests match your filters'
          : 'No inventory requests yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find a matching inventory request.'
          : 'When staff submit intake requests, they will appear here for review.'}
      </p>
      {hasFilters ? (
        <div className="mt-5">
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default memo(InventoryRequestsEmpty);
