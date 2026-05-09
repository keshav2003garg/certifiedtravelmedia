import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
import { Button } from '@repo/ui/components/base/button';
import {
  AlertCircle,
  Camera,
  Loader2,
  Trash2,
  Upload,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { useStorageUpload } from '@/hooks/useStorageUpload';

import type { StorageBucketName } from '@services/storage/buckets';

interface ImageUploadFieldProps {
  bucket: StorageBucketName;
  /** Owner identifier used to scope the default storage path. */
  ownerId?: string;
  /** Logical prefix folder for the default storage path. */
  prefix?: string;
  /** Current public URL value. */
  value: string;
  /** Called with the new public URL after a successful upload. */
  onChange: (url: string) => void;
  /** Called when the field is cleared. */
  onClear?: () => void;
  /** Optional help text displayed below the buttons. */
  helperText?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Marks the field invalid. */
  invalid?: boolean;
  /** Unused — kept for API compatibility. */
  className?: string;
}

function ImageUploadField({
  bucket,
  ownerId,
  prefix,
  value,
  onChange,
  onClear,
  helperText,
  disabled,
  invalid,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const cameraInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value);

  const [isDragging, setIsDragging] = useState(false);
  const { config, upload, isUploading, error, reset } = useStorageUpload({
    bucket,
    ownerId,
    prefix,
  });

  const acceptAttribute = config.allowedMimeTypes.join(',');

  useEffect(() => {
    const valueChanged = previousValueRef.current !== value;
    previousValueRef.current = value;

    if (value && valueChanged) reset();
  }, [reset, value]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      try {
        const result = await upload(file);
        if (result.publicUrl) {
          onChange(result.publicUrl);
        }
      } catch {
        /* error already exposed via hook state */
      }
    },
    [onChange, upload],
  );

  const onPick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      void handleFile(file);
      event.target.value = '';
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;
      const file = event.dataTransfer.files?.[0];
      void handleFile(file);
    },
    [disabled, handleFile, isUploading],
  );

  const handleClear = useCallback(() => {
    if (disabled || isUploading) return;
    onChange('');
    onClear?.();
    reset();
    if (inputRef.current) inputRef.current.value = '';
  }, [disabled, isUploading, onChange, onClear, reset]);

  return (
    <div className="space-y-2">
      {/* Image preview — shown only when a value is selected */}
      {value ? (
        <div
          className={cn(
            'bg-muted relative overflow-hidden rounded-md border',
            invalid && 'border-destructive',
          )}
        >
          <img
            src={value}
            alt=""
            className="h-56 w-full object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Upload className="size-4" />
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleClear}
              disabled={disabled || isUploading}
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      {/* Two-button row (always visible when no value; hidden while uploading) */}
      {!value ? (
        isUploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Uploading…</span>
          </div>
        ) : (
          <div
            className={cn(
              'grid grid-cols-2 gap-3',
              (disabled || isUploading) && 'pointer-events-none opacity-60',
            )}
            onDragOver={(event) => {
              event.preventDefault();
              if (disabled || isUploading) return;
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-12 w-full gap-2',
                isDragging && 'border-primary',
                invalid && 'border-destructive',
              )}
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Camera className="size-5" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-12 w-full gap-2',
                isDragging && 'border-primary',
                invalid && 'border-destructive',
              )}
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Upload className="size-5" />
              Upload
            </Button>
          </div>
        )
      ) : null}

      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={acceptAttribute}
        className="sr-only"
        onChange={onPick}
        disabled={disabled || isUploading}
      />
      <input
        ref={cameraInputRef}
        id={cameraInputId}
        type="file"
        accept={acceptAttribute}
        capture="environment"
        className="sr-only"
        onChange={onPick}
        disabled={disabled || isUploading}
      />

      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="size-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export default memo(ImageUploadField);
