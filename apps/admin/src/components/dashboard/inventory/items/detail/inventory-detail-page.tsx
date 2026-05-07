import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import {
  ArrowLeft,
  ExternalLink,
  FileImage,
  Loader2,
  Plus,
  RefreshCw,
} from '@repo/ui/lib/icons';
import { formatCount, formatDecimal } from '@repo/utils/number';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useInventoryItemTransactionsFilters } from '@/hooks/useInventoryItems/useInventoryItemTransactionsFilters';
import { useUserRole } from '@/hooks/useUserRole';

import InventoryStockLevelBadge from '../components/inventory-stock-level-badge';
import CreateInventoryTransactionDialog from './dialogues/create-inventory-transaction-dialog';
import InventoryDetailSkeleton from './inventory-detail-skeleton';
import InventoryTransactionsFilterBar from './inventory-transactions-filter-bar';
import InventoryTransactionsTable from './inventory-transactions-table';

import type { InventoryItemDetail } from '@/hooks/useInventoryItems/types';

interface InventoryDetailPageProps {
  inventoryId: string;
}

interface DetailFieldProps {
  label: string;
  value: string | null | undefined;
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="space-y-1 rounded-md border p-3">
      <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
        {label}
      </p>
      <p className="text-sm font-medium wrap-break-word">
        {value || 'Not set'}
      </p>
    </div>
  );
}

function InventoryMetricCards({ item }: { item: InventoryItemDetail }) {
  const totalUnits = item.boxes * item.unitsPerBox;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Current boxes</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatQuantity(item.boxes)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Units per box</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatQuantity(item.unitsPerBox)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Total units</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatQuantity(totalUnits)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Stock level</p>
          <div className="mt-3">
            <InventoryStockLevelBadge stockLevel={item.stockLevel} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryOverviewCard({ item }: { item: InventoryItemDetail }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[220px_1fr]">
        <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden rounded-md border">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <FileImage className="size-10" />
          )}
        </div>

        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md">
                {item.brochureTypeName}
              </Badge>
              <InventoryStockLevelBadge stockLevel={item.stockLevel} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">
                {item.brochureName}
              </h1>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Warehouse" value={item.warehouseName} />
            <DetailField
              label="Warehouse ID"
              value={item.warehouseAcumaticaId}
            />
            <DetailField label="Customer" value={item.customerName} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryReferenceCard({ item }: { item: InventoryItemDetail }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Inventory details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
            QR code
          </p>
          {item.qrCodeUrl ? (
            <div className="flex flex-col items-start gap-3">
              <img
                src={item.qrCodeUrl}
                alt="QR code"
                className="h-40 w-40 rounded-md border object-contain"
              />
              <Button asChild variant="outline" size="sm">
                <a href={item.qrCodeUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open full size
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium">Not generated</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryTransactionsEmpty({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold tracking-normal">
        {hasFilters ? 'No transactions match' : 'No transactions yet'}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {hasFilters
          ? 'Adjust the transaction filters to review more activity.'
          : 'Transactions will appear here when stock is recorded for this item.'}
      </p>
    </div>
  );
}

function InventoryDetailPage({ inventoryId }: InventoryDetailPageProps) {
  const { isManager } = useUserRole();
  const router = useRouter();

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const transactionFilters = useInventoryItemTransactionsFilters();
  const { inventoryItemQueryOptions, inventoryItemTransactionsQueryOptions } =
    useInventoryItems();

  const itemQuery = useQuery(inventoryItemQueryOptions(inventoryId));
  const transactionsQuery = useQuery(
    inventoryItemTransactionsQueryOptions(
      inventoryId,
      transactionFilters.params,
    ),
  );

  const item = itemQuery.data?.item ?? null;
  const transactions = transactionsQuery.data?.transactions ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const goBackToInventory = useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/dashboard/inventory' });
  }, [router]);

  if (itemQuery.isLoading) {
    return <InventoryDetailSkeleton />;
  }

  if (itemQuery.isError || !item) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold tracking-normal">
          Inventory item not found
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This stock item may have been removed or is unavailable.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={goBackToInventory}
        >
          <ArrowLeft className="size-4" />
          Back to inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={goBackToInventory}
        >
          <ArrowLeft className="size-4" />
          Back to inventory
        </Button>
        <div className="flex flex-wrap gap-2">
          {isManager ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsTransactionDialogOpen(true)}
            >
              <Plus className="size-4" />
              Create transaction
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void itemQuery.refetch();
              void transactionsQuery.refetch();
            }}
            disabled={itemQuery.isFetching || transactionsQuery.isFetching}
          >
            {itemQuery.isFetching || transactionsQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {isManager ? (
        <CreateInventoryTransactionDialog
          open={isTransactionDialogOpen}
          onOpenChange={setIsTransactionDialogOpen}
          item={item}
        />
      ) : null}

      <InventoryOverviewCard item={item} />
      <InventoryMetricCards item={item} />

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Latest stock activity for this inventory item.
              </CardDescription>
            </div>
            {pagination ? (
              <p className="text-muted-foreground text-sm">
                {formatCount(pagination.total)} records
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InventoryTransactionsFilterBar filters={transactionFilters} />

          {transactionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-md" />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h2 className="text-lg font-semibold tracking-normal">
                Transactions could not be loaded
              </h2>
              <Button
                type="button"
                className="mt-5"
                onClick={() => transactionsQuery.refetch()}
                disabled={transactionsQuery.isFetching}
              >
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <InventoryTransactionsEmpty
              hasFilters={transactionFilters.hasActiveFilters}
            />
          ) : (
            <div className="space-y-4">
              <InventoryTransactionsTable transactions={transactions} />
              {pagination ? (
                <DataPaginationControls
                  pagination={pagination}
                  currentLimit={transactionFilters.limit}
                  onPageChange={transactionFilters.handlePageChange}
                  onLimitChange={transactionFilters.handleLimitChange}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <InventoryReferenceCard item={item} />
    </div>
  );
}

export default InventoryDetailPage;
