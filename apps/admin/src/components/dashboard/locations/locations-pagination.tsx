import { Button } from '@repo/ui/components/base/button';
import { ChevronLeft, ChevronRight } from '@repo/ui/lib/icons';
interface PaginationType {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasMore?: boolean;
}

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  entityName?: string;
}

export function Pagination({
  pagination,
  onPageChange,
  entityName = 'locations',
}: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  const hasNextPage =
    pagination.hasNextPage ?? pagination.hasMore ?? page < totalPages;
  const hasPrevPage = page > 1;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-muted-foreground flex-1 text-sm">
        Showing <span className="text-foreground font-medium">{startItem}</span>{' '}
        to <span className="text-foreground font-medium">{endItem}</span> of{' '}
        <span className="text-foreground font-medium">{total}</span>{' '}
        {entityName}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
