---
name: create_list_page
description: Create a standardized list page with table, filter bar, stats cards, skeleton, empty state, and pagination.
---

# Create List Page

This skill creates the complete list view for admin features: page orchestrator, table, table rows, filter bar, stats cards, skeleton, and empty state.

**Location:** `apps/<app>/src/components/<feature>/<feature>-list/`

## 1. Page Orchestrator (`<feature>-page.tsx`)

The page component connects hooks, manages local state, and orchestrates child components.

```typescript
// apps/<app>/src/components/<feature>/<feature>-list/<feature>-page.tsx
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@repo/ui/components/base/button';
import { Plus, Download, Loader2 } from '@repo/ui/lib/icons';
import { useFeatures } from '@/hooks/useFeatures';
import { useFeaturesFilters } from '@/hooks/useFeatures/useFeaturesFilters';
import FilterBar from './filter-bar';
import StatsCards from './stats-cards';
import FeaturesTable from './features-table';
import FeaturesSkeleton from './features-skeleton';
import FeaturesEmpty from './features-empty';
import PaginationControls from '../common/pagination-controls';

export default function FeaturesPage() {
  const { t } = useTranslation('<feature>');
  const { featuresQueryOptions, deleteMutation, exportFeatures } = useFeatures();
  const filters = useFeaturesFilters();

  // Single query — params come from filter hook
  const { data, isLoading } = useQuery(featuresQueryOptions(filters.params));

  // Local state for delete-in-progress tracking
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  // ─── Delete handler ────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSettled: () => setDeletingId(null),
      });
    },
    [deleteMutation],
  );

  // ─── Export handler (CSV download) ─────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportFeatures({
        format: 'csv',
        search: filters.params.search,
      });
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `<feature>-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [exportFeatures, filters.params]);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('page.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('page.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t('page.export')}
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard/<feature>/new">
              <Plus className="size-4" />
              {t('page.newItem')}
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Stats Cards ──────────────────────────────────────── */}
      <StatsCards />

      {/* ─── Main Content Card ────────────────────────────────── */}
      <div className="bg-card ring-border/30 overflow-hidden rounded-2xl shadow-sm ring-1">
        {/* Filter bar in card header */}
        <div className="border-border/40 border-b p-5">
          <FilterBar />
        </div>

        {/* Content area */}
        <div className="p-5">
          {isLoading ? (
            <FeaturesSkeleton />
          ) : items.length === 0 ? (
            <FeaturesEmpty hasFilters={filters.hasActiveFilters} />
          ) : (
            <div className="space-y-5">
              <FeaturesTable
                items={items}
                onDelete={handleDelete}
                isDeletingId={deletingId}
              />
              {pagination ? (
                <PaginationControls
                  pagination={pagination}
                  onPageChange={filters.handlePageChange}
                  onLimitChange={filters.handleLimitChange}
                  currentLimit={filters.limit}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 2. Table Component (`<feature>-table.tsx`)

Read-only table with responsive overflow, fixed column widths, and memoized rows.

```typescript
// apps/<app>/src/components/<feature>/<feature>-list/<feature>-table.tsx
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import FeaturesTableRow from './features-table-row';
import type { FeatureItem } from '@/hooks/useFeatures/types';

interface FeaturesTableProps {
  items: FeatureItem[];
  onDelete: (id: string) => void;
  isDeletingId: string | null;
}

function FeaturesTable({ items, onDelete, isDeletingId }: FeaturesTableProps) {
  const { t } = useTranslation('<feature>');

  return (
    <div className="border-border/50 overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        {/* table-fixed with explicit widths prevents content from shifting */}
        <Table className="table-fixed" style={{ minWidth: '1000px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%]">{t('table.name')}</TableHead>
              <TableHead className="w-[20%]">{t('table.price')}</TableHead>
              <TableHead className="w-[15%]">{t('table.stock')}</TableHead>
              <TableHead className="w-[15%]">{t('table.category')}</TableHead>
              <TableHead className="w-[12%]">{t('table.status')}</TableHead>
              {/* Actions column — small fixed width, no header text */}
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <FeaturesTableRow
                key={item.id}
                item={item}
                onDelete={onDelete}
                isDeleting={isDeletingId === item.id}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(FeaturesTable);
```

**Table Rules:**

- Use `table-fixed` Layout + `minWidth` for horizontal scroll on mobile
- Column widths add up to ~100% (leave ~8% for actions)
- Header row: `bg-muted/50 hover:bg-muted/50` (prevent hover highlight on header)
- Always memoize with `memo()`

## 3. Table Row Component (`<feature>-table-row.tsx`)

Each row is individually memoized and contains cell rendering, actions dropdown, and delete dialog.

```typescript
// apps/<app>/src/components/<feature>/<feature>-list/<feature>-table-row.tsx
import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
import { MoreHorizontal, Eye, Trash2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatNOK } from '@repo/utils/price';
import { formatShortDate } from '@repo/utils/date';
import StatusBadge from '../common/status-badge';
import DeleteFeatureDialog from '../common/delete-feature-dialog';
import type { FeatureItem } from '@/hooks/useFeatures/types';

interface FeaturesTableRowProps {
  item: FeatureItem;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function FeaturesTableRow({ item, onDelete, isDeleting }: FeaturesTableRowProps) {
  const { t } = useTranslation('<feature>');
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <TableRow className={cn(isDeleting && 'opacity-50 pointer-events-none')}>
        {/* Name Cell — with link to detail */}
        <TableCell>
          <div className="flex items-center gap-3">
            {item.images?.[0] ? (
              <img
                src={item.images[0]}
                alt={item.name}
                className="size-10 rounded-lg border object-cover"
              />
            ) : (
              <div className="bg-muted flex size-10 items-center justify-center rounded-lg border">
                <Package className="text-muted-foreground size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                to="/dashboard/<feature>/$id"
                params={{ id: item.id }}
                className="hover:text-primary truncate font-medium transition-colors"
              >
                {item.name}
              </Link>
              {item.sku ? (
                <p className="text-muted-foreground truncate text-xs">{item.sku}</p>
              ) : null}
            </div>
          </div>
        </TableCell>

        {/* Price Cell */}
        <TableCell>
          <span className="font-medium">{formatNOK(item.salePrice)}</span>
        </TableCell>

        {/* Stock Cell */}
        <TableCell>
          <StockIndicator stock={item.totalStock} />
        </TableCell>

        {/* Category Cell — badges with overflow */}
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {item.categories?.slice(0, 2).map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs">
                {cat.name}
              </Badge>
            ))}
            {(item.categories?.length ?? 0) > 2 ? (
              <Badge variant="outline" className="text-xs">
                +{item.categories!.length - 2}
              </Badge>
            ) : null}
          </div>
        </TableCell>

        {/* Status Cell */}
        <TableCell>
          <StatusBadge isActive={item.isActive} deletedAt={item.deletedAt} />
        </TableCell>

        {/* Actions Cell — dropdown menu */}
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/<feature>/$id" params={{ id: item.id }}>
                  <Eye className="mr-2 size-4" />
                  {t('actions.view')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={!!item.deletedAt}
              >
                <Trash2 className="mr-2 size-4" />
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Delete confirmation dialog */}
      <DeleteFeatureDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={item.name}
        onConfirm={() => {
          onDelete(item.id);
          setDeleteOpen(false);
        }}
        isPending={isDeleting}
      />
    </>
  );
}

export default memo(FeaturesTableRow);
```

**Row Rules:**

- Always `memo()` each row component
- Use `cn()` for conditional opacity during delete
- Disable delete action if already soft-deleted
- Truncate long text with `truncate` class
- Max 2-3 badges visible, then "+N" overflow
- Actions dropdown with `align="end"` to prevent overflow
- Delete dialog is co-located inside the row

## 4. Filter Bar (`filter-bar.tsx`)

```typescript
// apps/<app>/src/components/<feature>/<feature>-list/filter-bar.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@repo/ui/components/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/base/select';
import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Switch } from '@repo/ui/components/base/switch';
import { Search, Filter, X, Trash2 } from '@repo/ui/lib/icons';
import { useFeaturesFilters } from '@/hooks/useFeatures/useFeaturesFilters';

export default function FilterBar() {
  const { t } = useTranslation('<feature>');
  const {
    searchInputValue, sortBy, order, isActive,
    setSearch, handleSortByChange, handleOrderChange, handleIsActiveChange,
    clearFilters, hasActiveFilters,
  } = useFeaturesFilters();

  // Build active filter badges for display
  const activeFilters = useMemo(() => {
    const filters: { label: string; onClear: () => void }[] = [];
    if (isActive !== null) {
      filters.push({
        label: isActive ? t('filter.active') : t('filter.inactive'),
        onClear: () => handleIsActiveChange(null),
      });
    }
    if (sortBy) {
      filters.push({
        label: `${t('filter.sortBy')}: ${sortBy}`,
        onClear: () => { handleSortByChange(null); handleOrderChange(null); },
      });
    }
    return filters;
  }, [isActive, sortBy, t, handleIsActiveChange, handleSortByChange, handleOrderChange]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('filter.searchPlaceholder')}
          value={searchInputValue}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <Select
          value={isActive === null ? 'all' : String(isActive)}
          onValueChange={(v) => handleIsActiveChange(v === 'all' ? null : v === 'true')}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 rounded-lg border-border/50 bg-muted/30 px-2.5 text-xs">
            <Filter className="text-muted-foreground size-3" />
            <SelectValue placeholder={t('filter.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allStatus')}</SelectItem>
            <SelectItem value="true">{t('filter.active')}</SelectItem>
            <SelectItem value="false">{t('filter.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort select */}
        <Select
          value={sortBy ?? 'default'}
          onValueChange={(v) => handleSortByChange(v === 'default' ? null : v as any)}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 rounded-lg border-border/50 bg-muted/30 px-2.5 text-xs">
            <SelectValue placeholder={t('filter.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t('filter.newest')}</SelectItem>
            <SelectItem value="name">{t('filter.name')}</SelectItem>
            <SelectItem value="salePrice">{t('filter.price')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Add more filters as needed */}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <Badge key={filter.label} variant="secondary" className="gap-1 text-xs">
              {filter.label}
              <button
                onClick={filter.onClear}
                className="hover:text-foreground ml-0.5 rounded-full"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
            {t('filter.clearAll')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
```

**Filter Bar Rules:**

- Search uses `searchInputValue` (immediate) not `search` (debounced)
- Select filters use `'all'` as sentinel value for "no filter" (converted to `null`)
- Active filters displayed as removable badges
- "Clear All" button only shown when `hasActiveFilters` is true

## 5. Stats Cards (`stats-cards.tsx`)

```typescript
// apps/<app>/src/components/<feature>/<feature>-list/stats-cards.tsx
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { Package, CheckCircle, XCircle, AlertTriangle } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { useFeatures } from '@/hooks/useFeatures';
import type { LucideIcon } from '@repo/ui/lib/icons';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

function StatCard({ label, value, icon: Icon, colorClass, bgClass }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', bgClass)}>
          <Icon className={cn('size-5', colorClass)} />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function StatsCards() {
  const { t } = useTranslation('<feature>');
  const { statsQueryOptions } = useFeatures();
  const { data, isLoading } = useQuery(statsQueryOptions());

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data?.stats;
  if (!stats) return null;

  const cards: StatCardProps[] = [
    { label: t('stats.total'), value: stats.total, icon: Package, colorClass: 'text-blue-600', bgClass: 'bg-blue-500/10' },
    { label: t('stats.active'), value: stats.active, icon: CheckCircle, colorClass: 'text-green-600', bgClass: 'bg-green-500/10' },
    { label: t('stats.inactive'), value: stats.inactive, icon: XCircle, colorClass: 'text-amber-600', bgClass: 'bg-amber-500/10' },
    { label: t('stats.outOfStock'), value: stats.outOfStock, icon: AlertTriangle, colorClass: 'text-red-600', bgClass: 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
```

**Stats Card Rules:**

- Show skeleton cards during loading (same count as actual cards)
- Responsive grid: 2 cols mobile → 3 tablet → 4 desktop
- Color-coded: blue=total, green=active, amber=inactive, red=critical
- Use `tabular-nums` class for number alignment

## 6. Skeleton Loading (`<feature>-skeleton.tsx`)

```typescript
import { Skeleton } from '@repo/ui/components/base/skeleton';

export default function FeaturesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
```

## 7. Empty State (`<feature>-empty.tsx`)

```typescript
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Button } from '@repo/ui/components/base/button';
import { Package, Plus, SearchX } from '@repo/ui/lib/icons';

interface FeaturesEmptyProps {
  hasFilters?: boolean;
}

export default function FeaturesEmpty({ hasFilters }: FeaturesEmptyProps) {
  const { t } = useTranslation('<feature>');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-2xl">
        {hasFilters ? (
          <SearchX className="text-muted-foreground size-8" />
        ) : (
          <Package className="text-muted-foreground size-8" />
        )}
      </div>
      <h3 className="text-lg font-semibold">
        {hasFilters ? t('empty.noResults') : t('empty.noItems')}
      </h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {hasFilters ? t('empty.noResultsDescription') : t('empty.noItemsDescription')}
      </p>
      {!hasFilters ? (
        <Button asChild className="mt-4" size="sm">
          <Link to="/dashboard/<feature>/new">
            <Plus className="mr-2 size-4" />
            {t('empty.createFirst')}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
```

**Empty State Rules:**

- Different message for "no items exist" vs "no items match filters"
- Show "Create first" CTA only when there are no filters active
- Use different icons for each state (Package vs SearchX)

## 8. Pagination Controls (`pagination-controls.tsx`)

Place in `common/` since it's reusable across features.

```typescript
import { useTranslation } from 'react-i18next';
import { Button } from '@repo/ui/components/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/base/select';
import { ChevronLeft, ChevronRight } from '@repo/ui/lib/icons';
import type { Pagination } from '@/hooks/useFeatures/types';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  currentLimit: number;
}

export default function PaginationControls({
  pagination,
  onPageChange,
  onLimitChange,
  currentLimit,
}: PaginationControlsProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        {t('pagination.showing', {
          from: (pagination.page - 1) * currentLimit + 1,
          to: Math.min(pagination.page * currentLimit, pagination.total),
          total: pagination.total,
        })}
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={String(currentLimit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!pagination.hasPrevPage}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm tabular-nums px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Common Mistakes to Avoid

1. **NEVER fetch data in child components** — only the page orchestrator fetches; children receive data as props
2. **NEVER forget `memo()` on table and table-row components** — prevents expensive re-renders
3. **NEVER render empty `<Table>` with no rows** — always show empty state component
4. **NEVER forget skeleton loading** — blank pages feel broken
5. **NEVER use inline delete** — always use confirmation dialog
6. **NEVER forget `onSettled` in delete callbacks** — clear loading state even on error
7. **ALWAYS pass `hasFilters` to empty state** — different messaging for "no data" vs "no match"
8. **ALWAYS use `table-fixed` with explicit column widths** — prevents layout shifts
9. **ALWAYS set `minWidth` on table** — ensures horizontal scroll on mobile
10. **ALWAYS show "showing X-Y of Z"** in pagination — users need context
11. **ALWAYS use `tabular-nums`** on numbers in stats cards and pagination — prevents layout shift
12. **ALWAYS clean up blob URLs** with `URL.revokeObjectURL()` after export download
