import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';

interface MonthEndCountsEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  title?: string;
  description?: string;
}

function MonthEndCountsEmpty({
  hasFilters,
  onClearFilters,
  title = 'No inventory items found',
  description = 'Adjust filters to load inventory items for this count period.',
}: MonthEndCountsEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {description}
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

export default memo(MonthEndCountsEmpty);
