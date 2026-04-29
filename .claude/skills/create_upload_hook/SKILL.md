---
name: create_upload_hook
description: Create standardized upload components using Supabase storage and `@repo/utils`.
---

# Create Upload Hook (Supabase)

This skill guides you through implementing file upload functionality using the shared `useImageUpload` hook and Supabase Storage.

**Location:** `apps/<app>/src/components/<Feature>/<Component>.tsx`
**Dependency:** `@repo/utils/hooks/useImageUpload`

## 1. Dependencies

Ensure you import the following:

```typescript
import { useMemo, useCallback } from 'react';
import { useImageUpload } from '@repo/utils/hooks/useImageUpload';
import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/constants/storage'; // Define buckets centrally
```

## 2. Component Implementation

Follow these rules:

1.  **Configuration:** Define `uploadConfig` using `useMemo`.
    - **Attributes:** `bucket` (from `STORAGE_BUCKETS`), `maxFileSize` (optional), `allowedTypes` (optional).
    - **File Path:** Define a `buildFilePath` function (e.g., `${id}-${Date.now()}.${ext}`).
2.  **Hook Usage:** initialize hooks.
    - `const { upload, isUploading, error, reset } = useImageUpload(supabase, uploadConfig);`
3.  **Handlers:**
    - Create `handleFileSelect` (for `<input type="file" />`).
    - Upload file: `await upload(file)` which returns `{ url, path }`.
    - Callback: `onUploadComplete(result)` with the uploaded data.
4.  **UI States:** Handle `isUploading`, `error`, and success states (e.g. show preview).

### Example Implementation

```typescript
// apps/<app>/src/components/MyUploader.tsx

interface UploaderProps {
  itemId: string;
  onUploadComplete: (url: string) => void;
}

export function MyUploader({ itemId, onUploadComplete }: UploaderProps) {

  // 1. Config
  const uploadConfig = useMemo(
    () => ({
      bucket: 'my-bucket', // Use constant in real code
      buildFilePath: (file: File) => {
        const ext = file.name.split('.').pop();
        return `${itemId}-${Date.now()}.${ext}`;
      },
      allowedTypes: ['image/png', 'image/jpeg'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
    }),
    [itemId],
  );

  // 2. Hook
  const { upload, isUploading, error } = useImageUpload(supabase, uploadConfig);

  // 3. Handler
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const { url } = await upload(file);
        onUploadComplete(url);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [upload, onUploadComplete],
  );

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <p>Uploading...</p>}
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
```
