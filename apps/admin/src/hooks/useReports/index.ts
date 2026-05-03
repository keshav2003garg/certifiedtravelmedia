import { env } from '@repo/env/client';

import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import type {
  OpenCustomerYearlyReportPdfRequest,
  OpenInventoryMonthlyReportPdfRequest,
} from './types';

const REPORTS_ENDPOINT = '/admin/reports';

export function useReports() {
  const openPdfUrl = useCallback(async (url: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Reports can only be opened in the browser');
    }

    const reportWindow = window.open(url, '_blank');

    if (!reportWindow) {
      throw new Error('Allow pop-ups to open the report PDF');
    }

    reportWindow.opener = null;
  }, []);

  const getInventoryMonthlyReportPdfUrl = useCallback(
    (params: OpenInventoryMonthlyReportPdfRequest['payload']) => {
      const url = new URL(
        `${env.VITE_API_URL}/api${REPORTS_ENDPOINT}/inventory/monthly/pdf`,
      );

      url.searchParams.set('warehouseId', params.warehouseId);
      url.searchParams.set('month', String(params.month));
      url.searchParams.set('year', String(params.year));

      return url.toString();
    },
    [],
  );

  const getCustomerYearlyReportPdfUrl = useCallback(
    (params: OpenCustomerYearlyReportPdfRequest['payload']) => {
      const url = new URL(
        `${env.VITE_API_URL}/api${REPORTS_ENDPOINT}/customer/year-end/pdf`,
      );

      url.searchParams.set('customerId', params.customerId);
      url.searchParams.set('year', String(params.year));

      return url.toString();
    },
    [],
  );

  const openInventoryMonthlyReportPdf = useCallback(
    async (params: OpenInventoryMonthlyReportPdfRequest['payload']) => {
      await openPdfUrl(getInventoryMonthlyReportPdfUrl(params));
    },
    [getInventoryMonthlyReportPdfUrl, openPdfUrl],
  );

  const openCustomerYearlyReportPdf = useCallback(
    async (params: OpenCustomerYearlyReportPdfRequest['payload']) => {
      await openPdfUrl(getCustomerYearlyReportPdfUrl(params));
    },
    [getCustomerYearlyReportPdfUrl, openPdfUrl],
  );

  const openInventoryMonthlyReportPdfMutation = useMutation({
    mutationFn: openInventoryMonthlyReportPdf,
    meta: {
      errorMessage: 'Report could not be opened',
      errorDescription: 'Allow pop-ups for this site and try again.',
    },
  });

  const openCustomerYearlyReportPdfMutation = useMutation({
    mutationFn: openCustomerYearlyReportPdf,
    meta: {
      errorMessage: 'Report could not be opened',
      errorDescription: 'Allow pop-ups for this site and try again.',
    },
  });

  return {
    getCustomerYearlyReportPdfUrl,
    getInventoryMonthlyReportPdfUrl,
    openCustomerYearlyReportPdf,
    openInventoryMonthlyReportPdf,
    openCustomerYearlyReportPdfMutation,
    openInventoryMonthlyReportPdfMutation,
  };
}
