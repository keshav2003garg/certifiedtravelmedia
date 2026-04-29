---
name: numeric_input
description: Use the NumericInput component from @repo/ui for all numeric/price/quantity form fields instead of <Input type="number">.
---

# NumericInput Component

**Location:** `@repo/ui/components/base/numeric-input`

Use `NumericInput` for **all** form fields that accept numeric values (prices, quantities, percentages, weights, dimensions, etc.). **Never** use `<Input type="number">` — it has a well-known UX bug where browser-level `min`/`max` enforcement prevents clearing the field to type a new value.

## Import

```typescript
import { NumericInput } from '@repo/ui/components/base/numeric-input';
```

## API

```typescript
interface NumericInputProps {
  value: number | undefined | null;        // Current numeric value
  onChange: (value: number | undefined) => void;  // Parsed number or undefined when empty
  onBlur?: () => void;
  min?: number;          // Clamped on blur (NOT during typing)
  max?: number;          // Clamped on blur (NOT during typing)
  step?: number;         // Infers decimal places (e.g. 0.01 → 2 decimals). Default 1
  decimals?: number;     // Explicit max decimal places (overrides step)
  integerOnly?: boolean; // No decimal point allowed
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
}
```

## Key Behaviors

- Uses `type="text"` + `inputMode="decimal"/"numeric"` — avoids browser min/max enforcement during typing, still shows numeric keyboard on mobile
- Internal string state allows intermediate values like `""`, `"-"`, `"0."` while typing
- Auto-selects text on focus for easy value replacement
- Clamps to `min`/`max` and rounds to allowed decimals on blur
- Calls `onChange(undefined)` when field is empty (for optional fields)
- Filters non-numeric characters during keystroke input

## Usage Patterns

### 1. Required Number (react-hook-form)

```tsx
<FormField
  control={form.control}
  name="salePrice"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Sale Price *</FormLabel>
      <FormControl>
        <NumericInput
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          step={0.01}
          min={0}
          placeholder="0.00"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2. Optional Number (react-hook-form)

Same pattern — `NumericInput` returns `undefined` when empty, which maps to optional schema fields.

```tsx
<FormField
  control={form.control}
  name="weight"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Weight</FormLabel>
      <FormControl>
        <NumericInput
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          step={0.01}
          min={0}
          placeholder="0.00"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 3. Integer Only (e.g. quantity)

```tsx
<NumericInput
  value={field.value}
  onChange={field.onChange}
  onBlur={field.onBlur}
  name={field.name}
  ref={field.ref}
  min={1}
  integerOnly
  placeholder="1"
/>
```

### 4. Percentage with Suffix

```tsx
<div className="relative">
  <NumericInput
    value={field.value}
    onChange={field.onChange}
    onBlur={field.onBlur}
    name={field.name}
    ref={field.ref}
    step={0.01}
    min={0.01}
    max={100}
    placeholder="e.g. 5"
    className="pr-8"
  />
  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
    %
  </span>
</div>
```

### 5. Price with Currency Prefix

```tsx
<div className="relative">
  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
    kr
  </span>
  <NumericInput
    value={field.value}
    onChange={field.onChange}
    onBlur={field.onBlur}
    name={field.name}
    ref={field.ref}
    step={0.01}
    min={0}
    placeholder="0.00"
    className="pl-9"
  />
</div>
```

### 6. Required field that must never be undefined

When the schema requires a number (not optional), wrap `onChange` to fall back to 0:

```tsx
<NumericInput
  value={field.value}
  onChange={(v) => field.onChange(v ?? 0)}
  ...
/>
```

### 7. Uncontrolled / non-form usage with debounce

```tsx
const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

<NumericInput
  value={currentValue}
  onChange={(v) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleChange(v ?? null);
    }, 500);
  }}
  min={0}
  step={0.01}
  placeholder="0.00"
/>
```

## Common Mistakes to Avoid

1. **NEVER use `<Input type="number">`** — always use `NumericInput`
2. **NEVER use `{...field}` spread** — NumericInput has its own `value`/`onChange` signature, pass them individually: `value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref}`
3. **NEVER manually parse with `parseFloat`/`parseInt`** — NumericInput handles all parsing internally
4. **NEVER set `min`/`max` as strings** — they are `number` props: `min={0}` not `min="0"`
5. **NEVER use `e.target.valueAsNumber`** — NumericInput's `onChange` already provides the parsed value
6. **DO use `integerOnly` for quantity/count fields** instead of `step={1}`
7. **DO use `step={0.01}` for currency fields** — it infers 2 decimal places
