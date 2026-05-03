import type { SearchableSelectOption } from '@/components/common/searchable-select';

export interface ReviewBrochureOption extends SearchableSelectOption {
  brochureTypeId: string;
  customerId: string | null;
  customerName: string | null;
}

export interface ReviewCustomerOption extends SearchableSelectOption {
  acumaticaId: string;
}
