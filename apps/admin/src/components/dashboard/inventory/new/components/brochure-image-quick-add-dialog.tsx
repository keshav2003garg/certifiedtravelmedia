import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';
import { z } from '@repo/utils/zod';

import ImageUploadField from '@/components/common/image-upload-field';

import { useBrochures } from '@/hooks/useBrochures';
import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import type { BrochureDetail } from '@/hooks/useBrochures/types';

const formSchema = z.object({
  imageUrl: z.url('Image URL is required').max(500),
  unitsPerBox: z
    .number()
    .positive('Units per box must be greater than 0')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: 'Units per box can have at most two decimal places',
    }),
});

type FormData = z.infer<typeof formSchema>;

interface BrochureImageQuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brochureId: string;
  ownerId: string;
  onCreated?: (params: {
    brochure: BrochureDetail;
    imageId: string;
    packSizeId: string;
  }) => void;
}

function BrochureImageQuickAddDialog({
  open,
  onOpenChange,
  brochureId,
  ownerId,
  onCreated,
}: BrochureImageQuickAddDialogProps) {
  const { createImageMutation } = useBrochures();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { imageUrl: '', unitsPerBox: 0 },
  });

  useResetFormOnActivation(open, form.reset, { imageUrl: '', unitsPerBox: 0 });

  function handleSubmit(values: FormData) {
    createImageMutation.mutate(
      {
        brochureId,
        body: {
          imageUrl: values.imageUrl,
          packSizes: [{ unitsPerBox: values.unitsPerBox }],
        },
      },
      {
        onSuccess: (response) => {
          const brochure = response.brochure;
          // The new image is the most recently added; find it by URL match.
          const newImage = brochure.images.find(
            (img) => img.imageUrl === values.imageUrl,
          );
          const newPackSize = newImage?.packSizes.find(
            (ps) => Number(ps.unitsPerBox) === values.unitsPerBox,
          );

          if (newImage && newPackSize) {
            onCreated?.({
              brochure,
              imageId: newImage.id,
              packSizeId: newPackSize.id,
            });
          }

          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add brochure image</DialogTitle>
          <DialogDescription>
            Upload a new image for this brochure and assign its pack size.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUploadField
                      bucket="inventory"
                      prefix={`brochures/${brochureId}`}
                      ownerId={ownerId}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={Boolean(fieldState.error)}
                      disabled={createImageMutation.isPending}
                      className="h-56"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitsPerBox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units per box</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      min={0.01}
                      step={0.01}
                      decimals={2}
                      placeholder="225"
                      disabled={createImageMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createImageMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createImageMutation.isPending}>
                {createImageMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Add image
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BrochureImageQuickAddDialog);
