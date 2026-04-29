import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import { Check, ChevronsUpDown, Search, X } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

function cacheOption(
  cachedOptions: MultiSelectOption[],
  option: MultiSelectOption,
) {
  const existingIndex = cachedOptions.findIndex(
    (cachedOption) => cachedOption.value === option.value,
  );

  if (existingIndex === -1) {
    return [...cachedOptions, option];
  }

  const nextCachedOptions = [...cachedOptions];
  nextCachedOptions[existingIndex] = option;
  return nextCachedOptions;
}

interface SearchableMultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  onSearchChange?: (search: string) => void;
  triggerIcon?: React.ReactNode;
}

function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  disabled = false,
  isLoading = false,
  className,
  onSearchChange,
  triggerIcon,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOptionCache, setSelectedOptionCache] = useState<
    MultiSelectOption[]
  >([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  const clearSearch = useCallback(() => {
    setSearch('');
    onSearchChange?.('');
  }, [onSearchChange]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);

      if (!isOpen) {
        clearSearch();
      }
    },
    [clearSearch],
  );

  const handleSearchChange = useCallback(
    (nextSearch: string) => {
      setSearch(nextSearch);
      onSearchChange?.(nextSearch);
    },
    [onSearchChange],
  );

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedOptions = useMemo(() => {
    const optionsByValue = new Map<string, MultiSelectOption>();

    for (const option of selectedOptionCache) {
      optionsByValue.set(option.value, option);
    }

    for (const option of options) {
      optionsByValue.set(option.value, option);
    }

    return value.flatMap((optionValue) => {
      const option = optionsByValue.get(optionValue);
      return option ? [option] : [];
    });
  }, [options, selectedOptionCache, value]);

  const filteredOptions = useMemo(() => {
    if (onSearchChange) return options;
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower),
    );
  }, [options, search, onSearchChange]);

  const handleToggle = useCallback(
    (option: MultiSelectOption) => {
      setSelectedOptionCache((cachedOptions) =>
        cacheOption(cachedOptions, option),
      );

      const optionValue = option.value;
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (optionValue: string) => {
      onChange(value.filter((v) => v !== optionValue));
    },
    [value, onChange],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-auto min-h-11 w-full justify-between font-normal',
            !value.length && 'text-muted-foreground',
            className,
          )}
        >
          {triggerIcon}
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  {opt.label}
                  <button
                    type="button"
                    className="hover:text-foreground ml-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(opt.value);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: triggerWidth > 0 ? triggerWidth : 'auto' }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="max-h-50 overflow-y-auto overscroll-contain p-1">
          {isLoading ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option)}
                  className={cn(
                    'hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    isSelected && 'bg-accent',
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-muted-foreground truncate text-xs">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(SearchableMultiSelect);
