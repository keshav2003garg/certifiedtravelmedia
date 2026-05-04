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
import { hasEditedCount } from './utils';

import type { MonthEndCountRow } from './types';

function MonthEndCountsPage() {
  const [countValues, setCountValues] = useState<Record<string, number | null>>(
    {},
  );
  const filters = useInventoryMonthEndCountsFilters();
  const { monthEndCountsQueryOptions, bulkMonthEndCountMutation } =
    useInventoryMonthEndCounts();

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    monthEndCountsQueryOptions(filters.params),
  );

  const pagination = data?.pagination;

  const rows = useMemo<MonthEndCountRow[]>(() => {
    const items = data?.items ?? [];

    return items.map((item) => {
      const editedCount = countValues[item.inventoryItemId];
      const countedBoxes = hasEditedCount(countValues, item.inventoryItemId)
        ? (editedCount ?? null)
        : (item.countedBoxes ?? item.countBasisBoxes);
      const distributionBoxes =
        countedBoxes === null
          ? 0
          : Math.max(item.countBasisBoxes - countedBoxes, 0);

      return { item, countedBoxes, distributionBoxes };
    });
  }, [countValues, data?.items]);

  const hasInvalidCount = rows.some(
    (row) =>
      row.countedBoxes === null ||
      row.countedBoxes < 0 ||
      row.countedBoxes > row.item.countBasisBoxes,
  );
  const isSubmitting = bulkMonthEndCountMutation.isPending;
  const canSubmit = rows.length > 0 && !hasInvalidCount && !isSubmitting;

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
    if (!canSubmit) return;

    bulkMonthEndCountMutation.mutate(
      {
        month: filters.month,
        year: filters.year,
        counts: rows.map((row) => ({
          inventoryItemId: row.item.inventoryItemId,
          countedBoxes: row.countedBoxes ?? 0,
        })),
      },
      {
        onSuccess: () => {
          setCountValues({});
        },
      },
    );
  }, [bulkMonthEndCountMutation, canSubmit, filters.month, filters.year, rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Month-end counts
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Enter physical end counts by inventory item and save one monthly
            Distribution transaction per item.
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
    </div>
  );
}

export default memo(MonthEndCountsPage);
