import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { PackageSearch } from '@repo/ui/lib/icons';

interface InventoryItemsEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function InventoryItemsEmpty({
  hasFilters,
  onClearFilters,
}: InventoryItemsEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <PackageSearch className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters ? 'No inventory matches' : 'No inventory yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find matching stock.'
          : 'Approved stock will appear here after inventory is created or requests are approved.'}
      </p>
      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export default memo(InventoryItemsEmpty);