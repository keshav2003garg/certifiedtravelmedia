import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Plus, Warehouse as WarehouseIcon } from '@repo/ui/lib/icons';

interface WarehousesEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}

function WarehousesEmpty({
  hasFilters,
  onClearFilters,
  onCreate,
}: WarehousesEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-md">
        <WarehouseIcon className="size-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters ? 'No warehouses match' : 'No warehouses yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the current filters to find a matching warehouse.'
          : 'Create the first warehouse so inventory can be mapped to sectors and locations.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters ? (
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          New warehouse
        </Button>
      </div>
    </div>
  );
}

export default memo(WarehousesEmpty);
