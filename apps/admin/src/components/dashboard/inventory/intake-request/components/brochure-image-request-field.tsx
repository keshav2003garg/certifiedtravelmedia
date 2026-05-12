import { memo, useMemo } from 'react';

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { Check, Image as ImageIcon } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import ImageUploadField from '@/components/common/image-upload-field';

import type { BrochureImage } from '@/hooks/useInventoryBrochures/types';

interface BrochureImageRequestFieldProps {
  ownerId: string;
  brochureId: string;
  images: BrochureImage[];
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
}

function BrochureImageRequestField({
  ownerId,
  brochureId,
  images,
  isLoading,
  value,
  onChange,
  disabled,
  invalid,
}: BrochureImageRequestFieldProps) {
  const savedImageUrls = useMemo(
    () =>
      new Set(
        images.flatMap((image) => (image.imageUrl ? [image.imageUrl] : [])),
      ),
    [images],
  );
  const uploadValue = value && !savedImageUrls.has(value) ? value : '';
  const hasSelectedBrochure = brochureId.length > 0;
  const hasSavedImages = hasSelectedBrochure && !isLoading && images.length > 0;

  return (
    <FormItem>
      <FormLabel>Brochure image</FormLabel>
      <FormControl>
        <div className="space-y-3">
          {hasSelectedBrochure ? (
            isLoading ? (
              <div className="space-y-2 rounded-lg border p-3">
                <Skeleton className="h-4 w-40" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-36 w-full rounded-md" />
                  <Skeleton className="h-36 w-full rounded-md" />
                </div>
              </div>
            ) : images.length === 0 ? null : (
              <>
                {/* Saved images — selectable grid */}
                <div
                  className={cn(
                    'space-y-2 rounded-lg border p-3',
                    invalid && 'border-destructive',
                  )}
                >
                  <p className="text-sm font-medium">
                    Map from existing images
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {images.map((image) => {
                      const imageUrl = image.imageUrl ?? '';
                      const isActive =
                        imageUrl.length > 0 && value === imageUrl;

                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => onChange(isActive ? '' : imageUrl)}
                          disabled={disabled || imageUrl.length === 0}
                          className={cn(
                            'group bg-card flex flex-col overflow-hidden rounded-md border text-left transition-all',
                            isActive
                              ? 'border-primary ring-primary/30 ring-2'
                              : 'border-border hover:border-primary/60',
                            imageUrl.length === 0 &&
                              'cursor-not-allowed opacity-70',
                          )}
                        >
                          <div className="bg-muted flex h-44 w-full items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className="size-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-muted-foreground flex size-full items-center justify-center">
                                <ImageIcon className="size-8" />
                              </div>
                            )}
                          </div>
                          {/* Selection indicator banner */}
                          <div
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {isActive ? (
                              <>
                                <Check className="size-3" />
                                Selected
                              </>
                            ) : (
                              'Tap to select'
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* "or" divider */}
                <div className="flex items-center gap-3">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    or
                  </span>
                  <div className="bg-border h-px flex-1" />
                </div>
              </>
            )
          ) : null}

          {/* Upload / camera section */}
          {hasSavedImages ? (
            <p className="text-sm font-medium">Take a new photo or upload</p>
          ) : null}
          <ImageUploadField
            bucket="inventory"
            prefix={
              brochureId
                ? `inventory-requests/${brochureId}`
                : 'inventory-requests'
            }
            ownerId={ownerId}
            value={uploadValue}
            onChange={onChange}
            disabled={disabled}
            invalid={invalid}
            className="h-56"
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default memo(BrochureImageRequestField);
