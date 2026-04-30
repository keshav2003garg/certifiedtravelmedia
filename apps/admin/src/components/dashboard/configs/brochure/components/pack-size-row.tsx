import { memo, useEffect, useState } from 'react';

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
  FormMessage,
} from '@repo/ui/components/base/form';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Check, Loader2, Pencil, Trash2, X } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { useBrochures } from '@/hooks/useBrochures';

import { packSizeFormSchema } from '../schema';

import type { BrochureImagePackSize } from '@/hooks/useBrochures/types';
import type { PackSizeFormData } from '../schema';

interface PackSizeRowProps {
  brochureId: string;
  imageId: string;
  packSize: BrochureImagePackSize;
}

function formatUnits(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function PackSizeRow({ brochureId, imageId, packSize }: PackSizeRowProps) {
  const { updateImagePackSizeMutation, deleteImagePackSizeMutation } =
    useBrochures();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isInventoryLinked = packSize.inventoryItemCount > 0;
  const isPending =
    updateImagePackSizeMutation.isPending ||
    deleteImagePackSizeMutation.isPending;

  const form = useForm<PackSizeFormData>({
    resolver: zodResolver(packSizeFormSchema),
    defaultValues: { unitsPerBox: packSize.unitsPerBox },
  });

  useEffect(() => {
    if (isEditing) {
      form.reset({ unitsPerBox: packSize.unitsPerBox });
    }
  }, [form, isEditing, packSize.unitsPerBox]);

  function handleUpdate(data: PackSizeFormData) {
    if (data.unitsPerBox === packSize.unitsPerBox) {
      setIsEditing(false);
      return;
    }

    updateImagePackSizeMutation.mutate(
      {
        brochureId,
        imageId,
        packSizeId: packSize.id,
        body: data,
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleDelete() {
    deleteImagePackSizeMutation.mutate(
      {
        brochureId,
        imageId,
        packSizeId: packSize.id,
      },
      { onSuccess: () => setDeleteOpen(false) },
    );
  }

  if (isEditing) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleUpdate)}
          className="flex items-start gap-2 rounded-md border p-2"
        >
          <FormField
            control={form.control}
            name="unitsPerBox"
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1">
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
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            {updateImagePackSizeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(false)}
            disabled={isPending}
          >
            <X className="size-4" />
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {formatUnits(packSize.unitsPerBox)} units per box
        </p>
        <p className="text-muted-foreground text-xs">
          {packSize.inventoryItemCount} inventory items
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isInventoryLinked ? (
          <Badge variant="secondary" className="rounded-md">
            In use
          </Badge>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          disabled={isPending || isInventoryLinked}
          aria-label="Edit pack size"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending || isInventoryLinked}
          aria-label="Delete pack size"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pack size?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {formatUnits(packSize.unitsPerBox)} units per box
              from the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteImagePackSizeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteImagePackSizeMutation.isPending}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}
            >
              {deleteImagePackSizeMutation.isPending ? (
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

export default memo(PackSizeRow);
