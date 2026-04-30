import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { cn } from '@repo/ui/lib/utils';

import type { InventoryRequestStatus } from '@/hooks/useInventoryRequests/types';

const STATUS_CLASSES: Record<InventoryRequestStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-muted text-muted-foreground border-border',
};

interface InventoryRequestStatusBadgeProps {
  status: InventoryRequestStatus;
  className?: string;
}

function InventoryRequestStatusBadge({
  status,
  className,
}: InventoryRequestStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md font-medium', STATUS_CLASSES[status], className)}
    >
      {status}
    </Badge>
  );
}

export default memo(InventoryRequestStatusBadge);
