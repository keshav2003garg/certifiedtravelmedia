import { memo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { AlertCircle } from '@repo/ui/lib/icons';

interface ScanErrorCardProps {
  message?: string;
}

export const ScanErrorCard = memo(function ScanErrorCard({
  message,
}: ScanErrorCardProps) {
  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="items-center text-center">
          <AlertCircle className="text-destructive size-12" />
          <CardTitle className="text-xl tracking-normal">
            Item not found
          </CardTitle>
          <CardDescription>
            {message ?? 'This QR code is invalid or the item no longer exists.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">
            Please ask a manager to print a fresh inventory QR label.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
