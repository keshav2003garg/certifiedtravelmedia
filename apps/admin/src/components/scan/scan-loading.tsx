import { memo } from 'react';

import { Loader2 } from '@repo/ui/lib/icons';

export const ScanLoading = memo(function ScanLoading() {
  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
    </div>
  );
});
