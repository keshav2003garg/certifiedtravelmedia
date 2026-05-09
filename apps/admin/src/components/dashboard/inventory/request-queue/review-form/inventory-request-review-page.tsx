import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useLoaderData, useRouter } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { ArrowLeft } from '@repo/ui/lib/icons';

import { useInventoryRequests } from '@/hooks/useInventoryRequests';
import { useUserRole } from '@/hooks/useUserRole';

import InventoryRequestRejectDialog from './components/inventory-request-reject-dialog';
import InventoryRequestReviewForm from './components/inventory-request-review-form';
import {
  InventoryRequestClosedCard,
  InventoryRequestNotFoundCard,
  InventoryRequestReviewAccessCard,
  InventoryRequestReviewSkeleton,
} from './components/request-review-state';

import type { ApproveInventoryRequestPayload } from '@/hooks/useInventoryRequests/types';

interface InventoryRequestReviewPageProps {
  requestId: string;
}

function InventoryRequestReviewPage({
  requestId,
}: InventoryRequestReviewPageProps) {
  const { role } = useUserRole();
  const isManagerOrAdmin = role === 'manager' || role === 'admin';

  const { user } = useLoaderData({ from: '/dashboard' });
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);

  const { inventoryRequestQueryOptions, approveMutation, rejectMutation } =
    useInventoryRequests();

  const requestQuery = useQuery({
    ...inventoryRequestQueryOptions(requestId),
    enabled: isManagerOrAdmin && requestId.length > 0,
  });
  const request = requestQuery.data?.request ?? null;

  const goBack = useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/dashboard/inventory/request-queue' });
  }, [router]);

  const handleSubmit = useCallback(
    (values: ApproveInventoryRequestPayload) => {
      if (!request) return;

      approveMutation.mutate(
        { id: request.id, payload: values },
        { onSuccess: goBack },
      );
    },
    [approveMutation, goBack, request],
  );

  const handleRejectSubmit = useCallback(
    (rejectionReason: string) => {
      if (!request) return;

      rejectMutation.mutate(
        { id: request.id, payload: { rejectionReason } },
        {
          onSuccess: () => {
            setRejectOpen(false);
            goBack();
          },
        },
      );
    },
    [goBack, rejectMutation, request],
  );

  if (!isManagerOrAdmin) {
    return <InventoryRequestReviewAccessCard />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={goBack}
        >
          <ArrowLeft className="size-4" />
          Back to unconfirmed brochures
        </Button>
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Review unconfirmed brochure
          </h1>
        </div>
      </div>

      {requestQuery.isLoading ? (
        <InventoryRequestReviewSkeleton />
      ) : requestQuery.isError || !request ? (
        <InventoryRequestNotFoundCard onBack={goBack} />
      ) : request.status !== 'Pending' ? (
        <InventoryRequestClosedCard request={request} onBack={goBack} />
      ) : (
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            <InventoryRequestReviewForm
              key={request.id}
              ownerId={user.id}
              request={request}
              isSubmitting={approveMutation.isPending}
              isRejecting={rejectMutation.isPending}
              onSubmit={handleSubmit}
              onReject={() => setRejectOpen(true)}
            />
          </CardContent>
        </Card>
      )}

      <InventoryRequestRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isSubmitting={rejectMutation.isPending}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}

export default InventoryRequestReviewPage;
