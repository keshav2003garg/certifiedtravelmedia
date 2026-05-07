import { memo, useMemo } from 'react';

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { Image as ImageIcon } from '@repo/ui/lib/icons';
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

  return (
    <FormItem>
      <FormLabel>Brochure image</FormLabel>
      <FormControl>
        <div className="space-y-3">
          {hasSelectedBrochure ? (
            isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-md border border-dashed p-5 text-center">
                <ImageIcon className="text-muted-foreground mx-auto size-8" />
                <p className="text-foreground mt-2 text-sm font-medium">
                  No saved images
                </p>
                <p className="text-muted-foreground text-sm">
                  Upload a new image for this request.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image) => {
                  const imageUrl = image.imageUrl ?? '';
                  const isActive = imageUrl.length > 0 && value === imageUrl;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => onChange(isActive ? '' : imageUrl)}
                      disabled={disabled || imageUrl.length === 0}
                      className={cn(
                        'group bg-card relative flex flex-col overflow-hidden rounded-md border text-left transition-colors',
                        isActive
                          ? 'border-primary ring-primary/30 ring-2'
                          : 'border-border hover:border-primary/60',
                        imageUrl.length === 0 &&
                          'cursor-not-allowed opacity-70',
                      )}
                    >
                      <div className="bg-muted relative aspect-4/3 w-full overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-muted-foreground flex size-full items-center justify-center">
                            <ImageIcon className="size-8" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
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
            helperText={
              hasSelectedBrochure
                ? 'Upload a new image if none of the saved brochure images match.'
                : 'Attach the cover image used for manager review.'
            }
            className="h-56"
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default memo(BrochureImageRequestField);
