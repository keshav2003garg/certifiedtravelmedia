import type { ExternalApiData } from '@/lib/api/types';

export type OpenInventoryMonthlyReportPdfRequest = ExternalApiData<
  {
    warehouseId: string;
    month: number;
    year: number;
  },
  void
>;

export type OpenCustomerYearlyReportPdfRequest = ExternalApiData<
  {
    customerId: string;
    year: number;
  },
  void
>;
