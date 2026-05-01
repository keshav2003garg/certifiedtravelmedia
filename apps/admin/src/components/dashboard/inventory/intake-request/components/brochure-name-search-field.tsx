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
  Tags,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { normalizeBrochureName } from './utils';

import type { BrochureOption } from './types';

interface BrochureNameSearchFieldProps {
  value: string;
  selectedBrochureId: string;
  options: BrochureOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (option: BrochureOption) => void;
  onCreate: (name: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

function BrochureNameSearchField({
  value,
  selectedBrochureId,
  options,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  isLoading,
  disabled,
}: BrochureNameSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const normalizedSearch = useMemo(
    () => normalizeBrochureName(search),
    [search],
  );
  const hasExactOption = useMemo(() => {
    if (!normalizedSearch) return false;
    const normalized = normalizedSearch.toLowerCase();
    return options.some(
      (option) =>
        normalizeBrochureName(option.label).toLowerCase() === normalized,
    );
  }, [normalizedSearch, options]);
  const canCreate = normalizedSearch.length > 0 && !hasExactOption;

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
    (option: BrochureOption) => {
      onSelect(option);
      closeAndClear();
    },
    [closeAndClear, onSelect],
  );

  const handleCreate = useCallback(() => {
    if (!canCreate) return;
    onCreate(normalizedSearch);
    closeAndClear();
  }, [canCreate, closeAndClear, normalizedSearch, onCreate]);

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
              <Tags className="size-4 shrink-0" />
            )}
            <span className="truncate">
              {value || 'Select or enter brochure'}
            </span>
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
              placeholder="Search brochures or type a new name"
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
          ) : options.length === 0 && !canCreate ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              No brochures found
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
                    option.value === selectedBrochureId && 'bg-accent',
                  )}
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      option.value === selectedBrochureId
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

              {canCreate ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors"
                >
                  <Plus className="size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      Use &quot;{normalizedSearch}&quot; as new brochure
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      Saves this request with a typed brochure name
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

export default memo(BrochureNameSearchField);
