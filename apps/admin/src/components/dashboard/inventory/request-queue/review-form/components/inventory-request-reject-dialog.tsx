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
import { Textarea } from '@repo/ui/components/base/textarea';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';
import { z } from '@repo/utils/zod';

import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

const formSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, 'Rejection reason is required')
    .max(500, 'Rejection reason must be 500 characters or less'),
});

type FormData = z.infer<typeof formSchema>;

interface InventoryRequestRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (rejectionReason: string) => void;
}

function InventoryRequestRejectDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: InventoryRequestRejectDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { rejectionReason: '' },
  });

  useResetFormOnActivation(open, form.reset, { rejectionReason: '' });

  function handleSubmit(values: FormData) {
    onSubmit(values.rejectionReason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject unconfirmed brochure</DialogTitle>
          <DialogDescription>
            Add the reason this brochure is being rejected.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Explain why this brochure is being rejected"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Reject brochure
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(InventoryRequestRejectDialog);
