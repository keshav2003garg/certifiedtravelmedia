import { type FormEvent, memo, useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Label } from '@repo/ui/components/base/label';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { ExternalLink, Loader2, Warehouse, X } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { useReportsFilters } from '@/hooks/useReports/useReportsFilters';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';
import type {
  ListWarehousesRequest,
  SortOrder as WarehouseSortOrder,
} from '@/hooks/useWarehouses/types';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

type ReportsFilters = ReturnType<typeof useReportsFilters>['monthEnd'];
type WarehouseOptionData = ListWarehousesRequest['response']['data'];

interface MonthlyReportPanelProps {
  filters: ReportsFilters;
  isOpening: boolean;
  onGenerate: () => void;
}

function MonthlyReportPanel({
  filters,
  isOpening,
  onGenerate,
}: MonthlyReportPanelProps) {
  const { getWarehouses, warehouseQueryOptions } = useWarehouses();
  const selectedWarehouseQuery = useQuery(
    warehouseQueryOptions(filters.warehouseId ?? ''),
  );

  const selectWarehouseOptions = useCallback(
    (data: WarehouseOptionData | undefined): SearchableSelectOption[] =>
      (data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
        description: warehouse.acumaticaId ?? undefined,
      })),
    [],
  );

  const selectedWarehouseOption = useMemo<SearchableSelectOption | null>(() => {
    const warehouse = selectedWarehouseQuery.data?.warehouse;

    if (!warehouse) return null;

    return {
      value: warehouse.id,
      label: warehouse.name,
      description: warehouse.acumaticaId ?? undefined,
    };
  }, [selectedWarehouseQuery.data?.warehouse]);

  const buildWarehouseParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as WarehouseSortOrder,
    }),
    [],
  );

  const {
    options: warehouseOptions,
    setSearch: setWarehouseSearch,
    isSearching: isSearchingWarehouses,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.list,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: buildWarehouseParams,
    baseOptions: selectedWarehouseOption ? [selectedWarehouseOption] : [],
  });

  const canGenerate = Boolean(filters.warehouseId) && !isOpening;

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!canGenerate) return;
      onGenerate();
    },
    [canGenerate, onGenerate],
  );

  return (
    <div className="space-y-5">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-xl tracking-normal">
            Monthly inventory report
          </CardTitle>
          <CardDescription>
            Generate the warehouse ledger report for the selected month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.7fr)_minmax(140px,0.55fr)]">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <SearchableSelect
                  options={warehouseOptions}
                  value={filters.warehouseId ?? undefined}
                  onChange={filters.handleWarehouseChange}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouses"
                  emptyMessage="No warehouses found"
                  isLoading={isSearchingWarehouses}
                  icon={<Warehouse className="size-4 shrink-0" />}
                  onSearchChange={setWarehouseSearch}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-month">Month</Label>
                <Select
                  value={String(filters.month)}
                  onValueChange={(value) =>
                    filters.handleMonthChange(Number(value))
                  }
                >
                  <SelectTrigger id="report-month" className="h-11">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-year">Year</Label>
                <NumericInput
                  id="report-year"
                  value={filters.year}
                  onChange={filters.handleYearChange}
                  min={2000}
                  max={2100}
                  integerOnly
                  placeholder="Year"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={filters.clearFilters}
                disabled={!filters.hasActiveFilters || isOpening}
              >
                <X className="size-4" />
                Clear
              </Button>
              <Button type="submit" disabled={!canGenerate}>
                {isOpening ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
                Generate PDF
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(MonthlyReportPanel);
