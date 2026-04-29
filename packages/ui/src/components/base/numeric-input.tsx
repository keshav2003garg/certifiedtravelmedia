'use client';

import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

export interface NumericInputProps extends Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'
> {
  /** Current numeric value. `undefined` or `null` = empty field. */
  value: number | undefined | null;
  /** Called with the parsed number, or `undefined` when the input is empty. */
  onChange: (value: number | undefined) => void;
  /** Minimum allowed value (clamped on blur, NOT during typing). */
  min?: number;
  /** Maximum allowed value (clamped on blur, NOT during typing). */
  max?: number;
  /**
   * Step size — also used to infer decimal places when `decimals` is not set.
   * e.g. `step={0.01}` → 2 decimal places. Default `1`.
   */
  step?: number;
  /**
   * Explicit maximum number of decimal places allowed.
   * Overrides the value inferred from `step`.
   */
  decimals?: number;
  /** Shorthand: only allow integer input (no decimal point). */
  integerOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Count the decimal places in a step value (e.g. 0.01 → 2). */
function decimalsFromStep(step: number): number {
  const str = String(step);
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

/**
 * Check whether a string is a valid *intermediate* numeric input.
 * Allows partial states like "", "-", "3.", "0.0" that are valid while typing
 * but might not parse to a finite number yet.
 */
function isValidIntermediate(
  s: string,
  allowNegative: boolean,
  allowDecimal: boolean,
): boolean {
  if (s === '' || s === '-') return true;
  if (!allowDecimal) {
    return allowNegative ? /^-?\d*$/.test(s) : /^\d*$/.test(s);
  }
  return allowNegative ? /^-?\d*\.?\d*$/.test(s) : /^\d*\.?\d*$/.test(s);
}

/** Format a number for display, preserving trailing decimals up to maxDecimals. */
function formatForDisplay(
  value: number | undefined | null,
  maxDecimals: number,
) {
  if (value === undefined || value === null) return '';
  // Use fixed notation to avoid floating-point display issues,
  // but strip unnecessary trailing zeros except when we want to keep precision.

  // eslint-disable-next-line unused-imports/no-unused-vars
  const fixed = value.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point, but keep at least one if there's a dot
  // Actually, for display we just show the plain number representation
  return String(value);
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      min,
      max,
      step = 1,
      decimals,
      integerOnly = false,
      className,
      placeholder,
      ...rest
    },
    ref,
  ) => {
    const maxDecimals = integerOnly
      ? 0
      : decimals !== undefined
        ? decimals
        : decimalsFromStep(step);

    const allowNegative = min === undefined || min < 0;
    const allowDecimal = maxDecimals > 0;

    // ── Internal display state ──────────────────────────────────
    const [displayValue, setDisplayValue] = React.useState(() =>
      formatForDisplay(value, maxDecimals),
    );

    // Track whether the input is currently focused
    const isFocusedRef = React.useRef(false);

    // Sync display value from prop when NOT focused (external changes)
    React.useEffect(() => {
      if (!isFocusedRef.current) {
        setDisplayValue(formatForDisplay(value, maxDecimals));
      }
    }, [value, maxDecimals]);

    // ── Handlers ────────────────────────────────────────────────
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Validate the string is a valid intermediate numeric input
        if (!isValidIntermediate(raw, allowNegative, allowDecimal)) {
          return; // reject the keystroke
        }

        // Enforce max decimal places
        if (allowDecimal && raw.includes('.')) {
          const parts = raw.split('.');
          if (parts[1] && parts[1].length > maxDecimals) {
            return; // too many decimal places
          }
        }

        setDisplayValue(raw);

        // If the string represents a valid, finite number → emit it
        const parsed = parseFloat(raw);
        if (
          raw !== '' &&
          raw !== '-' &&
          raw !== '.' &&
          raw !== '-.' &&
          !isNaN(parsed)
        ) {
          onChange(parsed);
        } else if (raw === '') {
          onChange(undefined);
        }
        // For partial states like "-", "3.", we keep typing but don't emit yet
      },
      [allowNegative, allowDecimal, maxDecimals, onChange],
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = false;

        let finalValue: number | undefined;

        const parsed = parseFloat(displayValue);
        if (isNaN(parsed) || displayValue === '' || displayValue === '-') {
          finalValue = undefined;
        } else {
          let clamped = parsed;
          if (min !== undefined && clamped < min) clamped = min;
          if (max !== undefined && clamped > max) clamped = max;

          // Round to max decimals
          const factor = Math.pow(10, maxDecimals);
          clamped = Math.round(clamped * factor) / factor;

          finalValue = clamped;
        }

        // Update display with clean format
        setDisplayValue(formatForDisplay(finalValue, maxDecimals));
        onChange(finalValue);
        onBlur?.(e);
      },
      [displayValue, min, max, maxDecimals, onChange, onBlur],
    );

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true;
        // Select all text on focus for easy replacement
        e.target.select();
      },
      [],
    );

    return (
      <input
        {...rest}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn(
          'border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
      />
    );
  },
);
NumericInput.displayName = 'NumericInput';

export { NumericInput };
