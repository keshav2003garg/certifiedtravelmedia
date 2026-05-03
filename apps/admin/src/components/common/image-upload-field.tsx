import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
import { Button } from '@repo/ui/components/base/button';
import {
  AlertCircle,
  FileImage,
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
  /** Optional help text displayed below the dropzone. */
  helperText?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Marks the field invalid. */
  invalid?: boolean;
  /** Aspect ratio classes for the preview thumbnail. */
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
  className,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value);

  const [isDragging, setIsDragging] = useState(false);
  const { config, upload, isUploading, error, reset } = useStorageUpload({
    bucket,
    ownerId,
    prefix,
  });

  const acceptAttribute = config.allowedMimeTypes.join(',');
  const maxMb = (config.maxFileSizeBytes / (1024 * 1024)).toFixed(1);
  const allowedLabel = config.allowedExtensions
    .map((ext) => ext.toUpperCase())
    .join(', ');

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

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;
      const file = event.dataTransfer.files?.[0];
      void handleFile(file);
    },
    [disabled, handleFile, isUploading],
  );

  const onPick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      void handleFile(file);
      event.target.value = '';
    },
    [handleFile],
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
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled || isUploading) return;
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'group bg-muted/30 relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          invalid && 'border-destructive',
          (disabled || isUploading) && 'pointer-events-none opacity-70',
          className,
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.preventDefault();
                  inputRef.current?.click();
                }}
                disabled={disabled || isUploading}
              >
                <Upload className="size-4" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  handleClear();
                }}
                disabled={disabled || isUploading}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 text-center text-sm">
            {isUploading ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <FileImage className="size-6" />
                <span className="font-medium">
                  Drop an image or click to browse
                </span>
                <span className="text-xs">
                  {allowedLabel} · up to {maxMb} MB
                </span>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={acceptAttribute}
          className="sr-only"
          onChange={onPick}
          disabled={disabled || isUploading}
        />
      </label>

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
