/**
 * Round a number to a fixed number of decimal places, returning a number.
 * Use for normalizing user-supplied decimals before persisting (e.g. boxes,
 * unitsPerBox). Defaults to 2 decimals.
 */
export function roundDecimals(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

/**
 * Format an integer count with locale-aware grouping (e.g. 1,234).
 * Use for displaying counts (locations, items, etc.) in the UI.
 */
export function formatCount(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(value);
}

interface FormatDecimalOptions {
  /** Maximum decimal digits when value is fractional. Defaults to 2. */
  maxDecimals?: number;
  /** Minimum decimal digits when value is fractional. Defaults to maxDecimals. */
  minDecimals?: number;
  /** When true, integer values render without decimals. Defaults to true. */
  stripIntegerDecimals?: boolean;
  locale?: string;
}

/**
 * Format a decimal number for display with locale-aware grouping. Strips
 * trailing `.00` for integer values by default.
 */
export function formatDecimal(
  value: number,
  options: FormatDecimalOptions = {},
) {
  const {
    maxDecimals = 2,
    minDecimals = maxDecimals,
    stripIntegerDecimals = true,
    locale = 'en-US',
  } = options;

  const isInteger = Number.isInteger(value);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: stripIntegerDecimals && isInteger ? 0 : minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}
