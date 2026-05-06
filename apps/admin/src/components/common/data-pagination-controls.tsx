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
import { cn } from '@repo/ui/lib/utils';

export interface DataPagination {
  page: number;
  total: number;
  totalPages: number;
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

function getPageNumbers(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (
    let i = Math.max(1, current - 1);
    i <= Math.min(total, current + 1);
    i++
  ) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | '...')[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (sorted[i] as number) - (sorted[i - 1] as number) > 1) {
      result.push('...');
    }
    result.push(sorted[i] as number);
  }

  return result;
}

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

  const totalPages = pagination.totalPages ?? 1;
  const pageNumbers = getPageNumbers(pagination.page, totalPages);

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

          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span
                key={`ellipsis-${i}`}
                className="text-muted-foreground px-1 text-sm select-none"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'min-w-9',
                  p === pagination.page &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground border-primary',
                )}
                onClick={() => onPageChange(p)}
                disabled={p === pagination.page}
              >
                {p}
              </Button>
            ),
          )}

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
