import { Globe, Monitor, Smartphone, Tablet } from '@repo/ui/lib/icons';

import type { LucideIcon } from '@repo/ui/lib/icons';

export function getDeviceIcon(userAgent: string | null): LucideIcon {
  const value = userAgent?.toLowerCase() ?? '';

  if (/ipad|tablet/.test(value)) return Tablet;
  if (/mobile|iphone|android/.test(value)) return Smartphone;
  if (value.length === 0) return Globe;

  return Monitor;
}

export function getDeviceName(userAgent: string | null) {
  const value = userAgent?.toLowerCase() ?? '';

  if (value.length === 0) return 'Unknown device';

  const browser = value.includes('edg/')
    ? 'Edge'
    : value.includes('chrome/')
      ? 'Chrome'
      : value.includes('safari/')
        ? 'Safari'
        : value.includes('firefox/')
          ? 'Firefox'
          : 'Browser';

  const platform = /iphone|ipad/.test(value)
    ? 'iOS'
    : value.includes('android')
      ? 'Android'
      : value.includes('mac os')
        ? 'macOS'
        : value.includes('windows')
          ? 'Windows'
          : value.includes('linux')
            ? 'Linux'
            : 'Device';

  return `${browser} on ${platform}`;
}
