import { memo, useCallback } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/base/tabs';

import { useReports } from '@/hooks/useReports';
import { useReportsFilters } from '@/hooks/useReports/useReportsFilters';

import MonthlyReportPanel from './components/monthly-report-panel';
import YearlyReportPanel from './components/yearly-report-panel';

function ReportsPage() {
  const filters = useReportsFilters();
  const {
    openCustomerYearlyReportPdfMutation,
    openInventoryMonthlyReportPdfMutation,
  } = useReports();

  const handleGenerateMonthEnd = useCallback(() => {
    if (!filters.monthEnd.params.warehouseId) return;

    openInventoryMonthlyReportPdfMutation.mutate({
      warehouseId: filters.monthEnd.params.warehouseId,
      month: filters.monthEnd.params.month,
      year: filters.monthEnd.params.year,
    });
  }, [filters.monthEnd.params, openInventoryMonthlyReportPdfMutation]);

  const handleGenerateYearEnd = useCallback(() => {
    if (!filters.yearEnd.params.customerId) return;

    openCustomerYearlyReportPdfMutation.mutate({
      customerId: filters.yearEnd.params.customerId,
      year: filters.yearEnd.params.year,
    });
  }, [filters.yearEnd.params, openCustomerYearlyReportPdfMutation]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-normal">
          Reports
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Inventory report PDFs with balances and transaction details.
        </p>
      </div>

      <Tabs
        value={filters.activeTab}
        onValueChange={filters.handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="month-end">Month-end reports</TabsTrigger>
          <TabsTrigger value="year-end">Customer reports</TabsTrigger>
        </TabsList>

        <TabsContent value="month-end" className="mt-0">
          <MonthlyReportPanel
            filters={filters.monthEnd}
            isOpening={openInventoryMonthlyReportPdfMutation.isPending}
            onGenerate={handleGenerateMonthEnd}
          />
        </TabsContent>

        <TabsContent value="year-end" className="mt-0">
          <YearlyReportPanel
            filters={filters.yearEnd}
            isOpening={openCustomerYearlyReportPdfMutation.isPending}
            onGenerate={handleGenerateYearEnd}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default memo(ReportsPage);
