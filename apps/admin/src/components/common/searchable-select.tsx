import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import { Check, ChevronsUpDown, Loader2, Search } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  onSearchChange?: (value: string) => void;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  isLoading = false,
  disabled = false,
  className,
  icon,
  onSearchChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOptionCache, setSelectedOptionCache] =
    useState<SearchableSelectOption | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  const clearSearch = useCallback(() => {
    setSearch('');
    onSearchChange?.('');
  }, [onSearchChange]);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedOption = useMemo(
    () =>
      options.find((option) => option.value === value) ??
      (selectedOptionCache?.value === value ? selectedOptionCache : undefined),
    [options, selectedOptionCache, value],
  );

  const filteredOptions = useMemo(() => {
    // When server-side search is active, options are already filtered — show all as-is
    if (onSearchChange) {
      return options;
    }
    if (!search.trim()) {
      return options.slice(0, 10); // Show first 10 when no search
    }
    const searchLower = search.toLowerCase();
    return options
      .filter(
        (option) =>
          option.label.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower),
      )
      .slice(0, 20); // Max 20 results
  }, [options, search, onSearchChange]);

  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      setSelectedOptionCache(option);
      onChange(option.value);
      setOpen(false);
      clearSearch();
    },
    [clearSearch, onChange],
  );

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
            'h-11 w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
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
            <div className="flex items-center justify-center py-6">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  option.value === value && 'bg-accent',
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    option.value === value ? 'opacity-100' : 'opacity-0',
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
            ))
          )}
        </div>

        {!onSearchChange && !search && options.length > 10 && (
          <div className="text-muted-foreground border-t px-3 py-2 text-center text-xs">
            Showing 10 of {options.length} • Type to search
          </div>
        )}
        {onSearchChange && !search && (
          <div className="text-muted-foreground border-t px-3 py-2 text-center text-xs">
            Type to search
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default memo(SearchableSelect);
