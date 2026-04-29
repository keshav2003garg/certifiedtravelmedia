import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { ChevronLeft, ChevronRight } from '@repo/ui/lib/icons';

export interface DataPagination {
  page: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DataPaginationControlsProps {
  pagination: DataPagination;
  currentLimit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: readonly number[];
}

const DEFAULT_LIMIT_OPTIONS = [10, 25, 50, 100] as const;

function DataPaginationControls({
  pagination,
  currentLimit,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
}: DataPaginationControlsProps) {
  const firstItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * currentLimit + 1;
  const lastItem = Math.min(pagination.page * currentLimit, pagination.total);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Showing {firstItem}-{lastItem} of {pagination.total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(currentLimit)}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((limit) => (
              <SelectItem key={limit} value={String(limit)}>
                {limit} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(DataPaginationControls);