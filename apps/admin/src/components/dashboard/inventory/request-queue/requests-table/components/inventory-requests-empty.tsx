import { memo } from 'react';

import { Inbox } from '@repo/ui/lib/icons';

interface InventoryRequestsEmptyProps {
  hasFilters: boolean;
}

function InventoryRequestsEmpty({ hasFilters }: InventoryRequestsEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <Inbox className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters
          ? 'No unconfirmed brochures match your filters'
          : 'No unconfirmed brochures yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find a matching brochure.'
          : 'When staff submit intake requests, they will appear here for review.'}
      </p>
    </div>
  );
}

export default memo(InventoryRequestsEmpty);
