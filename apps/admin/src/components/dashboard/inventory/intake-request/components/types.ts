import type { SearchableSelectOption } from '@/components/common/searchable-select';

export interface BrochureOption extends SearchableSelectOption {
  brochureTypeId: string;
  customerName: string | null;
}
