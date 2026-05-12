import { memo, useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import {
  AlertCircle,
  ClipboardCheck,
  Loader2,
  RefreshCw,
} from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryMonthEndCounts } from '@/hooks/useInventoryMonthEndCounts';
import { useInventoryMonthEndCountsFilters } from '@/hooks/useInventoryMonthEndCounts/useInventoryMonthEndCountsFilters';

import MonthEndCountsEmpty from './components/month-end-counts-empty';
import MonthEndCountsFilterBar from './components/month-end-counts-filter-bar';
import MonthEndCountsSkeleton from './components/month-end-counts-skeleton';
import MonthEndCountsTable from './components/month-end-counts-table';
import SubmittedMonthEndCountsSkeleton from './components/submitted-month-end-counts-skeleton';
import SubmittedMonthEndCountsTable from './components/submitted-month-end-counts-table';
import { hasEditedCount } from './utils';

import type { MonthEndCountRow } from './types';

function MonthEndCountsPage() {
  const [countValues, setCountValues] = useState<Record<string, number | null>>(
    {},
  );
  const filters = useInventoryMonthEndCountsFilters();
  const submittedFilters = useInventoryMonthEndCountsFilters('submitted');
  const {
    monthEndCountsQueryOptions,
    submittedMonthEndCountsQueryOptions,
    bulkMonthEndCountMutation,
  } = useInventoryMonthEndCounts();

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    ...monthEndCountsQueryOptions(filters.params),
    enabled: filters.params.month !== undefined && !!filters.params.warehouseId,
  });

  const pagination = data?.pagination;

  const {
    data: submittedData,
    isError: isSubmittedError,
    isFetching: isSubmittedFetching,
    isLoading: isSubmittedLoading,
    refetch: refetchSubmitted,
  } = useQuery({
    ...submittedMonthEndCountsQueryOptions(submittedFilters.params),
    enabled:
      submittedFilters.params.month !== undefined &&
      !!submittedFilters.params.warehouseId,
  });

  const submittedRows = submittedData?.items ?? [];
  const submittedPagination = submittedData?.pagination;
  const emptyTitle =
    filters.warehouseId === null && filters.month === null
      ? 'Select a warehouse and month'
      : filters.warehouseId === null
        ? 'Select a warehouse to load counts'
        : filters.month === null
          ? 'Select a month to load counts'
          : 'No counts found';
  const emptyDescription =
    filters.warehouseId === null && filters.month === null
      ? 'Choose a warehouse and month to view inventory counts.'
      : filters.warehouseId === null
        ? 'Choose a warehouse to load counts for this period.'
        : filters.month === null
          ? 'Choose a month to load counts for this warehouse.'
          : 'Adjust filters to find counts for this period.';
  const submittedEmptyTitle =
    submittedFilters.warehouseId === null && submittedFilters.month === null
      ? 'Select a warehouse and month'
      : submittedFilters.warehouseId === null
        ? 'Select a warehouse to view submitted counts'
        : submittedFilters.month === null
          ? 'Select a month to view submitted counts'
          : 'No submitted counts found';
  const submittedEmptyDescription =
    submittedFilters.warehouseId === null && submittedFilters.month === null
      ? 'Choose a warehouse and month to load previously submitted counts.'
      : submittedFilters.warehouseId === null
        ? 'Choose a warehouse to load submitted counts for this period.'
        : submittedFilters.month === null
          ? 'Choose a month and year to load previously submitted counts.'
          : 'Adjust filters to find submitted counts for this period.';

  const rows = useMemo<MonthEndCountRow[]>(() => {
    const items = data?.items ?? [];

    return items.map((item) => {
      const editedCount = countValues[item.inventoryItemId];
      const endCount = hasEditedCount(countValues, item.inventoryItemId)
        ? (editedCount ?? null)
        : item.endCount;

      return { item, endCount };
    });
  }, [countValues, data?.items]);

  const filledRows = rows.filter((row) => row.endCount !== null);
  const hasInvalidCount = filledRows.some((row) => (row.endCount ?? 0) < 0);
  const isSubmitting = bulkMonthEndCountMutation.isPending;
  const canSubmit =
    filledRows.length > 0 &&
    !hasInvalidCount &&
    !isSubmitting &&
    filters.month !== null;

  const handleCountChange = useCallback(
    (inventoryItemId: string, value: number | undefined) => {
      setCountValues((current) => ({
        ...current,
        [inventoryItemId]: value ?? null,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit || filters.month === null) return;

    bulkMonthEndCountMutation.mutate(
      {
        month: filters.month,
        year: filters.year,
        counts: filledRows.map((row) => ({
          inventoryItemId: row.item.inventoryItemId,
          endCount: row.endCount ?? 0,
        })),
      },
      {
        onSuccess: () => {
          setCountValues({});
        },
      },
    );
  }, [
    bulkMonthEndCountMutation,
    canSubmit,
    filledRows,
    filters.month,
    filters.year,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Month-end counts
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter physical inventory counts for each brochure at the end of the
            month. End count number can be entered with up to 2 decimal places
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh month-end counts"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ClipboardCheck className="size-4" />
            )}
            Save counts
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <MonthEndCountsFilterBar filters={filters} />

          {isError ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
                <AlertCircle className="size-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-normal">
                Month-end counts could not be loaded
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Refresh the list or try again after checking the API connection.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <MonthEndCountsSkeleton />
          ) : rows.length === 0 ? (
            <MonthEndCountsEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <div className="space-y-4">
              <MonthEndCountsTable
                rows={rows}
                onCountChange={handleCountChange}
              />
              {pagination ? (
                <DataPaginationControls
                  pagination={pagination}
                  currentLimit={filters.limit}
                  onPageChange={filters.handlePageChange}
                  onLimitChange={filters.handleLimitChange}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-foreground text-xl font-semibold tracking-normal">
              Previously Submitted
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetchSubmitted()}
            disabled={
              submittedFilters.params.month === undefined ||
              !submittedFilters.params.warehouseId ||
              isSubmittedFetching
            }
            aria-label="Refresh submitted month-end counts"
          >
            {isSubmittedFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>

        <Card className="shadow-none">
          <CardContent className="space-y-5 p-5">
            <MonthEndCountsFilterBar filters={submittedFilters} />

            {isSubmittedError ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
                  <AlertCircle className="size-6" />
                </div>
                <h2 className="text-lg font-semibold tracking-normal">
                  Submitted counts could not be loaded
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  Refresh the list or try again after checking the API
                  connection.
                </p>
                <Button
                  type="button"
                  className="mt-5"
                  onClick={() => refetchSubmitted()}
                  disabled={isSubmittedFetching}
                >
                  {isSubmittedFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Retry
                </Button>
              </div>
            ) : isSubmittedLoading ? (
              <SubmittedMonthEndCountsSkeleton />
            ) : submittedRows.length === 0 ? (
              <MonthEndCountsEmpty
                hasFilters={submittedFilters.hasActiveFilters}
                onClearFilters={submittedFilters.clearFilters}
                title={submittedEmptyTitle}
                description={submittedEmptyDescription}
              />
            ) : (
              <div className="space-y-4">
                <SubmittedMonthEndCountsTable items={submittedRows} />
                {submittedPagination ? (
                  <DataPaginationControls
                    pagination={submittedPagination}
                    currentLimit={submittedFilters.limit}
                    onPageChange={submittedFilters.handlePageChange}
                    onLimitChange={submittedFilters.handleLimitChange}
                  />
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default memo(MonthEndCountsPage);
