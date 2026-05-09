import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { normalizeReviewText } from '../utils';

import type { SearchableSelectOption } from '@/components/common/searchable-select';

interface ReviewCreatableSearchFieldProps<
  TOption extends SearchableSelectOption,
> {
  value: string;
  selectedValue?: string;
  options: TOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (option: TOption) => void;
  onUseText?: (value: string) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  icon: React.ReactNode;
  getTextLabel?: (value: string) => string;
  textDescription?: string;
}

function ReviewCreatableSearchField<TOption extends SearchableSelectOption>({
  value,
  selectedValue,
  options,
  search,
  onSearchChange,
  onSelect,
  onUseText,
  isLoading,
  disabled,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  icon,
  getTextLabel,
  textDescription,
}: ReviewCreatableSearchFieldProps<TOption>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const normalizedSearch = useMemo(() => normalizeReviewText(search), [search]);
  const hasExactOption = useMemo(() => {
    if (!normalizedSearch) return false;
    const target = normalizedSearch.toLowerCase();

    return options.some(
      (option) => normalizeReviewText(option.label).toLowerCase() === target,
    );
  }, [normalizedSearch, options]);
  const canUseText =
    Boolean(onUseText) && normalizedSearch.length > 0 && !hasExactOption;

  const closeAndClear = useCallback(() => {
    setOpen(false);
    onSearchChange('');
  }, [onSearchChange]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) onSearchChange('');
    },
    [onSearchChange],
  );

  const handleSelect = useCallback(
    (option: TOption) => {
      onSelect(option);
      closeAndClear();
    },
    [closeAndClear, onSelect],
  );

  const handleUseText = useCallback(() => {
    if (!canUseText || !onUseText) return;
    onUseText(normalizedSearch);
    closeAndClear();
  }, [canUseText, closeAndClear, normalizedSearch, onUseText]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-11 w-full justify-between font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              icon
            )}
            <span className="truncate">{value || placeholder}</span>
          </div>
          <ChevronsUpDown className="text-muted-foreground ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: triggerWidth > 0 ? triggerWidth : 'auto' }}
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : options.length === 0 && !canUseText ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {emptyMessage}
            </div>
          ) : (
            <>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    option.value === selectedValue && 'bg-accent',
                  )}
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      option.value === selectedValue
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{option.label}</p>
                    {option.description ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}

              {canUseText ? (
                <button
                  type="button"
                  onClick={handleUseText}
                  className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors"
                >
                  <Plus className="size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {getTextLabel?.(normalizedSearch)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {textDescription}
                    </p>
                  </div>
                </button>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(ReviewCreatableSearchField);
