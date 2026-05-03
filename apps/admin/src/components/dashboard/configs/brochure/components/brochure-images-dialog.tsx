import { memo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
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
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { AlertCircle, FileImage, Loader2, Plus } from '@repo/ui/lib/icons';

import ImageUploadField from '@/components/common/image-upload-field';

import { useBrochures } from '@/hooks/useBrochures';
import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import { brochureImageFormSchema, defaultBrochureImageValues } from '../schema';
import BrochureImageCard from './brochure-image-card';

import type { Brochure } from '@/hooks/useBrochures/types';
import type { BrochureImageFormData as FormData } from '../schema';

interface BrochureImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brochure: Brochure | null;
}

function BrochureImagesLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-md border p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <Skeleton className="h-48 w-full rounded-md lg:h-40 lg:w-52" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrochureImagesDialog({
  open,
  onOpenChange,
  brochure,
}: BrochureImagesDialogProps) {
  const { brochureQueryOptions, createImageMutation } = useBrochures();
  const brochureId = brochure?.id ?? '';
  const queryOptions = brochureQueryOptions(brochureId);
  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    ...queryOptions,
    enabled: open && brochureId.length > 0,
  });

  const detail = data?.brochure;
  const form = useForm<FormData>({
    resolver: zodResolver(brochureImageFormSchema),
    defaultValues: defaultBrochureImageValues,
  });

  useResetFormOnActivation(
    open,
    form.reset,
    defaultBrochureImageValues,
    brochureId,
  );

  function onSubmit(values: FormData) {
    if (!brochureId) return;

    createImageMutation.mutate(
      {
        brochureId,
        body: {
          imageUrl: values.imageUrl,
          sortOrder: values.sortOrder,
          packSizes: [],
        },
      },
      { onSuccess: () => form.reset(defaultBrochureImageValues) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Images and pack sizes</DialogTitle>
          <DialogDescription>
            {brochure
              ? `Manage image assets and units-per-box options for ${brochure.name}.`
              : 'Manage brochure image assets and units-per-box options.'}
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Brochure images could not be loaded.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-muted/30 space-y-4 rounded-md border p-4"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_160px_auto] lg:items-start">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        bucket="brochure-covers"
                        prefix="brochures"
                        ownerId={brochureId || undefined}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={createImageMutation.isPending}
                        invalid={Boolean(fieldState.error)}
                        helperText="Drop a new brochure image to upload it directly to storage."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <NumericInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        min={0}
                        integerOnly
                        placeholder="Auto"
                        disabled={createImageMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="lg:mt-8"
                disabled={createImageMutation.isPending || !brochureId}
              >
                {createImageMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add image
              </Button>
            </div>
          </form>
        </Form>

        {isLoading ? (
          <BrochureImagesLoading />
        ) : detail && detail.images.length > 0 ? (
          <div className="space-y-4">
            {detail.images.map((image) => (
              <BrochureImageCard
                key={image.id}
                brochureId={detail.id}
                image={image}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
            <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-md">
              <FileImage className="size-5" />
            </div>
            <h3 className="font-semibold tracking-normal">No images yet</h3>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Add an image URL above, then attach the pack sizes available for
              that image.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BrochureImagesDialog);
