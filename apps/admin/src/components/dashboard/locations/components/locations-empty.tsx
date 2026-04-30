import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { MapPin, X } from '@repo/ui/lib/icons';

interface LocationsEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function LocationsEmpty({ hasFilters, onClearFilters }: LocationsEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-md">
        <MapPin className="text-muted-foreground size-6" />
      </div>
      <h2 className="text-base font-semibold tracking-normal">
        No locations found
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Clear the current filters to review the full location list.'
          : 'Locations will appear here after they are synced into the system.'}
      </p>
      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={onClearFilters}
        >
          <X className="size-4" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export default memo(LocationsEmpty);
