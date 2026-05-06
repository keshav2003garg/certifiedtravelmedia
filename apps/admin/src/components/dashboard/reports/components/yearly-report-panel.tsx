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
import { ExternalLink, Loader2, UserRound, X } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useCustomers } from '@/hooks/useCustomers';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  ListCustomersRequest,
  SortOrder as CustomerSortOrder,
} from '@/hooks/useCustomers/types';
import type { useReportsFilters } from '@/hooks/useReports/useReportsFilters';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';

type ReportsFilters = ReturnType<typeof useReportsFilters>['yearEnd'];
type CustomerOptionData = ListCustomersRequest['response']['data'];

interface YearlyReportPanelProps {
  filters: ReportsFilters;
  isOpening: boolean;
  onGenerate: () => void;
}

function YearlyReportPanel({
  filters,
  isOpening,
  onGenerate,
}: YearlyReportPanelProps) {
  const { customerQueryOptions, getCustomers } = useCustomers();
  const selectedCustomerQuery = useQuery(
    customerQueryOptions(filters.customerId ?? ''),
  );

  const selectCustomerOptions = useCallback(
    (data: CustomerOptionData | undefined): SearchableSelectOption[] =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.acumaticaId,
      })),
    [],
  );

  const selectedCustomerOption = useMemo<SearchableSelectOption | null>(() => {
    const customer = selectedCustomerQuery.data?.customer;

    if (!customer) return null;

    return {
      value: customer.id,
      label: customer.name,
      description: customer.acumaticaId,
    };
  }, [selectedCustomerQuery.data?.customer]);

  const buildCustomerParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as CustomerSortOrder,
    }),
    [],
  );

  const {
    options: customerOptions,
    setSearch: setCustomerSearch,
    isSearching: isSearchingCustomers,
  } = useServerSearchSelectOptions({
    queryKey: (params: ListCustomersRequest['payload']) =>
      [ReactQueryKeys.GET_CUSTOMERS, 'year-end-report', params] as const,
    queryFn: getCustomers,
    selectOptions: selectCustomerOptions,
    buildParams: buildCustomerParams,
    baseOptions: selectedCustomerOption ? [selectedCustomerOption] : [],
  });

  const canGenerate = Boolean(filters.customerId) && !isOpening;

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
            Customer year-end report
          </CardTitle>
          <CardDescription>
            Generate annual Distribution totals for the selected customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <Label>Customer</Label>
                <SearchableSelect
                  options={customerOptions}
                  value={filters.customerId ?? undefined}
                  onChange={filters.handleCustomerChange}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers"
                  emptyMessage="No customers found"
                  isLoading={isSearchingCustomers}
                  icon={<UserRound className="size-4 shrink-0" />}
                  onSearchChange={setCustomerSearch}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year-end-report-year">Year</Label>
                <NumericInput
                  id="year-end-report-year"
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

export default memo(YearlyReportPanel);
