import { useCallback, useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import {
  ScanConfirmCard,
  ScanCountForm,
  ScanErrorCard,
  ScanLoading,
  ScanSuccessCard,
} from '@/components/scan';

import { useScan } from '@/hooks/useScan';

import type { SubmitScanCountPayload } from '@/hooks/useScan/types';

interface SubmittedCountState {
  endCount: number;
  month: number;
  year: number;
}

export const Route = createFileRoute('/scan/$id')({
  component: ScanPage,
  head: () => ({
    meta: [{ title: 'Inventory Scan - CTM Media' }],
  }),
});

function ScanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    scanIdResolveQueryOptions,
    scanItemQueryOptions,
    submitCountMutation,
  } = useScan();

  const resolveQuery = useQuery(scanIdResolveQueryOptions(id));
  const resolved = resolveQuery.data?.resolved;
  const shouldRedirect = resolved?.shouldRedirect ?? false;
  const inventoryItemId = shouldRedirect
    ? ''
    : (resolved?.inventoryItemId ?? '');

  const { data, isLoading, isError } = useQuery(
    scanItemQueryOptions(inventoryItemId),
  );
  const activeInventoryItemId = data?.item.inventoryItemId ?? '';

  const [confirmed, setConfirmed] = useState(false);
  const [submittedCount, setSubmittedCount] =
    useState<SubmittedCountState | null>(null);

  useEffect(() => {
    if (!resolved?.shouldRedirect) return;

    void navigate({
      to: '/scan/$id',
      params: { id: resolved.inventoryItemId },
      replace: true,
    });
  }, [navigate, resolved]);

  const handleSubmit = useCallback(
    (payload: SubmitScanCountPayload) => {
      if (!activeInventoryItemId) return;

      submitCountMutation.mutate(
        { id: activeInventoryItemId, body: payload },
        {
          onSuccess: (result) => {
            setSubmittedCount({
              endCount: result.count.count.endCount,
              month: result.count.count.month,
              year: result.count.count.year,
            });
          },
        },
      );
    },
    [activeInventoryItemId, submitCountMutation],
  );

  if (resolveQuery.isLoading || shouldRedirect || isLoading) {
    return <ScanLoading />;
  }

  if (resolveQuery.isError || isError || !data?.item) {
    return <ScanErrorCard />;
  }

  const item = data.item;

  if (submittedCount !== null) {
    return (
      <ScanSuccessCard
        endCount={submittedCount.endCount}
        month={submittedCount.month}
        year={submittedCount.year}
        itemName={item.brochureName || item.brochureTypeName}
      />
    );
  }

  if (!confirmed) {
    return <ScanConfirmCard item={item} onConfirm={() => setConfirmed(true)} />;
  }

  return (
    <ScanCountForm
      item={item}
      onSubmit={handleSubmit}
      onBack={() => setConfirmed(false)}
      isSubmitting={submitCountMutation.isPending}
      submitError={
        submitCountMutation.isError
          ? 'Failed to submit count. Please try again.'
          : null
      }
    />
  );
}
