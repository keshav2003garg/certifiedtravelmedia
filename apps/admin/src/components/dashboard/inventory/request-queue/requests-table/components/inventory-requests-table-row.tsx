import { memo, useCallback } from 'react';

import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';
import { formatCount, formatDecimal } from '@repo/utils/number';

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
  const totalUnits = request.boxes * request.unitsPerBox;
  const requesterLabel =
    request.requestedByName ?? request.requestedByEmail ?? 'Unknown';

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
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {formatCount(request.boxes)} boxes
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDecimal(totalUnits)} units
            <span className="px-1">·</span>
            {formatDecimal(request.unitsPerBox)}/box
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm">{requesterLabel}</p>
          <p className="text-muted-foreground text-xs">
            {formatShortDate(request.dateReceived)}
          </p>
        </div>
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
