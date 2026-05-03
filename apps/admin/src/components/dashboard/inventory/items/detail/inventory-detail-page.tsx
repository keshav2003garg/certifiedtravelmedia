import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

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
  RefreshCw,
} from '@repo/ui/lib/icons';
import { formatShortDate } from '@repo/utils/date';
import { formatCount, formatDecimal } from '@repo/utils/number';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useInventoryItemTransactionsFilters } from '@/hooks/useInventoryItems/useInventoryItemTransactionsFilters';

import InventoryStockLevelBadge from '../components/inventory-stock-level-badge';
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
              <p className="text-muted-foreground mt-1 text-sm">
                {item.customerName ?? 'Unassigned customer'} in{' '}
                {item.warehouseName}
              </p>
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
        <CardDescription>Reference fields for this stock item.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DetailField label="Inventory ID" value={item.id} />
        <DetailField label="Brochure ID" value={item.brochureId} />
        <DetailField label="Brochure type ID" value={item.brochureTypeId} />
        <DetailField label="Brochure image ID" value={item.brochureImageId} />
        <DetailField label="Customer ID" value={item.customerId} />
        <DetailField label="Warehouse address" value={item.warehouseAddress} />
        <DetailField label="Created" value={formatShortDate(item.createdAt)} />
        <DetailField
          label="Brochure updated"
          value={formatShortDate(item.brochureUpdatedAt)}
        />
        <DetailField
          label="Pack size updated"
          value={formatShortDate(item.packSizeUpdatedAt)}
        />
        <div className="space-y-1 rounded-md border p-3 md:col-span-2 xl:col-span-3">
          <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
            QR code
          </p>
          {item.qrCodeUrl ? (
            <Button asChild variant="link" className="h-auto p-0">
              <a href={item.qrCodeUrl} target="_blank" rel="noreferrer">
                Open QR code
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
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
  const { inventoryItemQueryOptions, inventoryItemTransactionsQueryOptions } =
    useInventoryItems();
  const transactionFilters = useInventoryItemTransactionsFilters();

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
        <Button asChild variant="outline" className="mt-5">
          <Link to="/dashboard/inventory">
            <ArrowLeft className="size-4" />
            Back to inventory
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/dashboard/inventory">
            <ArrowLeft className="size-4" />
            Back to inventory
          </Link>
        </Button>
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

      <InventoryOverviewCard item={item} />
      <InventoryMetricCards item={item} />
      <InventoryReferenceCard item={item} />

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
    </div>
  );
}

export default InventoryDetailPage;
