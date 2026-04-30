import { formatDateTime } from '@repo/utils/date';

export function formatDate(date: string | Date) {
  return formatDateTime(date);
}
