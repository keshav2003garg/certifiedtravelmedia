import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/base/alert-dialog';
import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
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
import {
  Boxes,
  Check,
  FileImage,
  Image,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import ImageUploadField from '@/components/common/image-upload-field';

import { useBrochures } from '@/hooks/useBrochures';

import {
  brochureImageFormSchema,
  defaultPackSizeValues,
  packSizeFormSchema,
} from '../schema';
import PackSizeRow from './pack-size-row';

import type { BrochureImage } from '@/hooks/useBrochures/types';
import type { BrochureImageFormData, PackSizeFormData } from '../schema';

interface BrochureImageCardProps {
  brochureId: string;
  image: BrochureImage;
}

function BrochureImageCard({ brochureId, image }: BrochureImageCardProps) {
  const {
    updateImageMutation,
    deleteImageMutation,
    createImagePackSizeMutation,
  } = useBrochures();
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isInventoryLinked = useMemo(
    () => image.packSizes.some((packSize) => packSize.inventoryItemCount > 0),
    [image.packSizes],
  );
  const isImagePending =
    updateImageMutation.isPending || deleteImageMutation.isPending;

  const imageForm = useForm<BrochureImageFormData>({
    resolver: zodResolver(brochureImageFormSchema),
    defaultValues: {
      imageUrl: image.imageUrl ?? '',
      sortOrder: image.sortOrder,
    },
  });
  const packSizeForm = useForm<PackSizeFormData>({
    resolver: zodResolver(packSizeFormSchema),
    defaultValues: defaultPackSizeValues,
  });

  useEffect(() => {
    if (isEditingImage) {
      imageForm.reset({
        imageUrl: image.imageUrl ?? '',
        sortOrder: image.sortOrder,
      });
    }
  }, [image.imageUrl, image.sortOrder, imageForm, isEditingImage]);

  function handleUpdateImage(data: BrochureImageFormData) {
    const body: Partial<BrochureImageFormData> = {};
    const sortOrder = data.sortOrder ?? 0;

    if (data.imageUrl !== image.imageUrl) {
      body.imageUrl = data.imageUrl;
    }

    if (sortOrder !== image.sortOrder) {
      body.sortOrder = sortOrder;
    }

    if (Object.keys(body).length === 0) {
      setIsEditingImage(false);
      return;
    }

    updateImageMutation.mutate(
      {
        brochureId,
        imageId: image.id,
        body,
      },
      { onSuccess: () => setIsEditingImage(false) },
    );
  }

  function handleCreatePackSize(data: PackSizeFormData) {
    createImagePackSizeMutation.mutate(
      {
        brochureId,
        imageId: image.id,
        body: data,
      },
      { onSuccess: () => packSizeForm.reset(defaultPackSizeValues) },
    );
  }

  const handleDeleteImage = useCallback(() => {
    deleteImageMutation.mutate(
      { brochureId, imageId: image.id },
      { onSuccess: () => setDeleteOpen(false) },
    );
  }, [brochureId, image.id, deleteImageMutation]);

  return (
    <div className="overflow-hidden rounded-md border p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="bg-muted text-muted-foreground flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border lg:h-40 lg:w-52">
          {image.imageUrl ? (
            <img
              src={image.imageUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <FileImage className="size-8" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-full min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 rounded-md">
                  <Image className="size-3" />
                  Sort {image.sortOrder}
                </Badge>
                <Badge variant="outline" className="gap-1.5 rounded-md">
                  <Boxes className="size-3" />
                  {image.packSizes.length} pack sizes
                </Badge>
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingImage(true)}
                disabled={isImagePending}
                aria-label="Edit image"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                disabled={isImagePending || isInventoryLinked}
                aria-label="Delete image"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {isEditingImage ? (
            <Form {...imageForm}>
              <form
                onSubmit={imageForm.handleSubmit(handleUpdateImage)}
                className="space-y-4 rounded-md border p-3"
              >
                <FormField
                  control={imageForm.control}
                  name="imageUrl"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <ImageUploadField
                          bucket="brochure-covers"
                          prefix="brochures"
                          ownerId={brochureId}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isImagePending}
                          invalid={Boolean(fieldState.error)}
                          helperText="Replace the brochure image. Inventory-linked images can still be re-uploaded."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={imageForm.control}
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
                          placeholder="0"
                          disabled={isImagePending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingImage(false)}
                    disabled={isImagePending}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isImagePending}>
                    {updateImageMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Save image
                  </Button>
                </div>
              </form>
            </Form>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-normal">
                Pack sizes
              </h3>
            </div>
            {image.packSizes.length > 0 ? (
              <div className="space-y-2">
                {image.packSizes.map((packSize) => (
                  <PackSizeRow
                    key={packSize.id}
                    brochureId={brochureId}
                    imageId={image.id}
                    packSize={packSize}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                No pack sizes yet.
              </p>
            )}
          </div>

          <Form {...packSizeForm}>
            <form
              onSubmit={packSizeForm.handleSubmit(handleCreatePackSize)}
              className="bg-muted/30 flex items-start gap-2 rounded-md border p-3"
            >
              <FormField
                control={packSizeForm.control}
                name="unitsPerBox"
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1">
                    <FormLabel>Add pack size</FormLabel>
                    <FormControl>
                      <NumericInput
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        min={0.01}
                        step={0.01}
                        placeholder="Units per box"
                        disabled={createImagePackSizeMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-8"
                disabled={createImagePackSizeMutation.isPending}
              >
                {createImagePackSizeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the image and its pack sizes if none are linked
              to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteImageMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              disabled={deleteImageMutation.isPending}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}
            >
              {deleteImageMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default memo(BrochureImageCard);
