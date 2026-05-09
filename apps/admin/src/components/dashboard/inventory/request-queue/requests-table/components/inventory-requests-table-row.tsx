import { memo, useCallback } from 'react';

import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';
import { formatDecimal } from '@repo/utils/number';

import InventoryRequestStatusBadge from './inventory-request-status-badge';

import type { InventoryRequest } from '@/hooks/useInventoryRequests/types';

interface InventoryRequestsTableRowProps {
  request: InventoryRequest;
  onSelect?: (request: InventoryRequest) => void;
}

function InventoryRequestsTableRow({
  request,
  onSelect,
}: InventoryRequestsTableRowProps) {
  const isReviewable = request.status === 'Pending' && Boolean(onSelect);

  const handleClick = useCallback(() => {
    if (isReviewable) onSelect?.(request);
  }, [isReviewable, onSelect, request]);

  return (
    <TableRow
      onClick={isReviewable ? handleClick : undefined}
      className={cn(isReviewable && 'cursor-pointer')}
    >
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{request.brochureName ?? '—'}</p>
          <p className="text-muted-foreground truncate text-xs">
            {request.brochureTypeName ?? '—'}
            {request.customerName ? ` · ${request.customerName}` : ''}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <InventoryRequestStatusBadge status={request.status} />
      </TableCell>
      <TableCell>
        <span className="text-sm">{request.warehouseName ?? '—'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">
          {formatDecimal(request.unitsPerBox)} units/box
        </span>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(request.createdAt)}
        </span>
      </TableCell>
    </TableRow>
  );
}

export default memo(InventoryRequestsTableRow);
