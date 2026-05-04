import type { z } from '@repo/utils/zod';
import type { TransactionType } from '@services/database/types';
import type {
  customerYearlyReportValidator,
  inventoryMonthlyReportValidator,
} from './reports.validators';

export type InventoryMonthlyReportParams = z.infer<
  (typeof inventoryMonthlyReportValidator)['query']
>;

export interface InventoryMonthlyReportWarehouse {
  id: string;
  name: string;
  acumaticaId: string | null;
  address: string | null;
}

export interface InventoryMonthlyReportPeriod {
  month: number;
  year: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface InventoryMonthlyReportTransaction {
  id: string;
  transactionType: TransactionType;
  transactionDate: string;
  boxes: number;
  movementBoxes: number;
  movementUnits: number;
  balanceBeforeBoxes: number;
  balanceAfterBoxes: number;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: string;
}

export interface InventoryMonthlyReportItem {
  id: string;
  brochureImagePackSizeId: string;
  brochureId: string;
  brochureName: string;
  brochureTypeId: string;
  brochureTypeName: string;
  customerId: string | null;
  customerName: string | null;
  brochureImageId: string;
  imageUrl: string | null;
  warehouseId: string;
  warehouseName: string;
  currentBoxes: number;
  unitsPerBox: number;
  currentUnits: number;
  startingBalanceBoxes: number;
  startingBalanceUnits: number;
  endingBalanceBoxes: number;
  endingBalanceUnits: number;
  netMovementBoxes: number;
  netMovementUnits: number;
  transactionCount: number;
  hasLedgerBalance: boolean;
  transactions: InventoryMonthlyReportTransaction[];
}

export interface InventoryMonthlyReportSummary {
  inventoryItemCount: number;
  transactionCount: number;
  startingBalanceBoxes: number;
  startingBalanceUnits: number;
  endingBalanceBoxes: number;
  endingBalanceUnits: number;
  netMovementBoxes: number;
  netMovementUnits: number;
}

export interface InventoryMonthlyReportResult {
  warehouse: InventoryMonthlyReportWarehouse;
  period: InventoryMonthlyReportPeriod;
  summary: InventoryMonthlyReportSummary;
  items: InventoryMonthlyReportItem[];
}

export type CustomerYearlyReportParams = z.infer<
  (typeof customerYearlyReportValidator)['query']
>;

export interface CustomerYearlyReportCustomer {
  id: string;
  name: string;
  acumaticaId: string;
}

export interface CustomerYearlyReportPeriod {
  year: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface CustomerYearlyReportVariant {
  inventoryItemId: string;
  brochureImagePackSizeId: string;
  brochureImageId: string;
  imageUrl: string | null;
  unitsPerBox: number;
  transactionCount: number;
  distributionBoxes: number;
  distributionUnits: number;
}

export interface CustomerYearlyReportBrochure {
  id: string;
  name: string;
  brochureTypeId: string;
  brochureTypeName: string;
  transactionCount: number;
  variantCount: number;
  distributionBoxes: number;
  distributionUnits: number;
  variants: CustomerYearlyReportVariant[];
}

export interface CustomerYearlyReportWarehouse {
  id: string;
  name: string;
  acumaticaId: string | null;
  address: string | null;
  transactionCount: number;
  brochureCount: number;
  variantCount: number;
  distributionBoxes: number;
  distributionUnits: number;
  brochures: CustomerYearlyReportBrochure[];
}

export interface CustomerYearlyReportSummary {
  warehouseCount: number;
  brochureCount: number;
  variantCount: number;
  transactionCount: number;
  distributionBoxes: number;
  distributionUnits: number;
}

export interface CustomerYearlyReportResult {
  customer: CustomerYearlyReportCustomer;
  period: CustomerYearlyReportPeriod;
  summary: CustomerYearlyReportSummary;
  warehouses: CustomerYearlyReportWarehouse[];
}

export interface CustomerYearlyBrochureAggregate extends Omit<
  CustomerYearlyReportBrochure,
  'variants'
> {
  variants: CustomerYearlyReportVariant[];
  variantMap: Map<string, CustomerYearlyReportVariant>;
}

export interface CustomerYearlyWarehouseAggregate extends Omit<
  CustomerYearlyReportWarehouse,
  'brochures'
> {
  brochures: CustomerYearlyBrochureAggregate[];
  brochureMap: Map<string, CustomerYearlyBrochureAggregate>;
}
