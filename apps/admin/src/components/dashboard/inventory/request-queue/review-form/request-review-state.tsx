import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { AlertCircle, Image as ImageIcon } from '@repo/ui/lib/icons';
import { formatFullDate, parseISODate } from '@repo/utils/date';
import { formatDecimal } from '@repo/utils/number';

import InventoryRequestStatusBadge from '../requests-table/components/inventory-request-status-badge';

import type { InventoryRequest } from '@/hooks/useInventoryRequests/types';

interface BackActionProps {
  onBack: () => void;
}

function ReviewAccessCard() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-normal">
          Managers and admins only
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Reviewing unconfirmed brochures is restricted to managers and admins.
        </p>
      </CardContent>
    </Card>
  );
}

function ReviewPageSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function RequestNotFoundCard({ onBack }: BackActionProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-normal">
          Unconfirmed brochure not found
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          This unconfirmed brochure could not be loaded.
        </p>
        <Button type="button" onClick={onBack} className="mt-5">
          Back to unconfirmed brochures
        </Button>
      </CardContent>
    </Card>
  );
}

function FieldLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1 border-b py-3 last:border-b-0">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="text-foreground text-sm font-medium">{value}</div>
    </div>
  );
}

function ClosedRequestCard({
  request,
  onBack,
}: BackActionProps & { request: InventoryRequest }) {
  const dateReceived = parseISODate(request.dateReceived);

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Unconfirmed brochure already reviewed
            </h2>
            {request.status === 'Rejected' && request.rejectionReason ? (
              <p className="text-muted-foreground mt-1 text-sm">
                Reason: {request.rejectionReason}
              </p>
            ) : null}
          </div>
          <InventoryRequestStatusBadge status={request.status} />
        </div>

        <div className="bg-muted relative flex h-80 w-full items-center justify-center overflow-hidden rounded-md border sm:h-96">
          {request.imageUrl ? (
            <img
              src={request.imageUrl}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>

        <div className="rounded-md border px-4">
          <FieldLine label="Warehouse" value={request.warehouseName ?? '-'} />
          <FieldLine
            label="Brochure type"
            value={request.brochureTypeName ?? '-'}
          />
          <FieldLine
            label="Acumatica customer"
            value={request.customerName ?? '-'}
          />
          <FieldLine label="Brochure" value={request.brochureName ?? '-'} />
          <FieldLine label="Type" value={request.transactionType} />
          <FieldLine label="Boxes" value={formatDecimal(request.boxes)} />
          <FieldLine
            label="Units per box"
            value={formatDecimal(request.unitsPerBox)}
          />
          <FieldLine
            label="Date received"
            value={dateReceived ? formatFullDate(dateReceived) : '-'}
          />
          {request.notes ? (
            <FieldLine label="Notes" value={request.notes} />
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to unconfirmed brochures
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const InventoryRequestReviewAccessCard = memo(ReviewAccessCard);
export const InventoryRequestReviewSkeleton = memo(ReviewPageSkeleton);
export const InventoryRequestNotFoundCard = memo(RequestNotFoundCard);
export const InventoryRequestClosedCard = memo(ClosedRequestCard);
