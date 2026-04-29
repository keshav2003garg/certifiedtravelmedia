import { useCallback, useState } from 'react';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export interface ImageUploadError {
  message: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED';
}

export interface ImageUploadConfig {
  bucket: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  cacheControl?: string;
  upsert?: boolean;
  buildFilePath: (file: File) => string;
}

interface SupabaseStorageClient {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options?: { cacheControl?: string; upsert?: boolean },
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export function useImageUpload(
  client: SupabaseStorageClient,
  config: ImageUploadConfig,
) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ImageUploadError | null>(null);

  const maxSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = config.allowedTypes ?? DEFAULT_ALLOWED_TYPES;

  const reset = useCallback(() => {
    setIsUploading(false);
    setError(null);
  }, []);

  const validateFile = useCallback(
    (file: File): ImageUploadError | null => {
      if (file.size > maxSize) {
        return {
          message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
          code: 'FILE_TOO_LARGE',
        };
      }

      if (!allowedTypes.includes(file.type)) {
        const labels = allowedTypes
          .map((t) => t.split('/')[1]?.toUpperCase())
          .join(', ');
        return {
          message: `Invalid file type. Allowed: ${labels}`,
          code: 'INVALID_TYPE',
        };
      }

      return null;
    },
    [maxSize, allowedTypes],
  );

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError.message);
      }

      setIsUploading(true);
      setError(null);

      try {
        const filePath = config.buildFilePath(file);

        const { error: uploadError } = await client.storage
          .from(config.bucket)
          .upload(filePath, file, {
            cacheControl: config.cacheControl ?? '3600',
            upsert: config.upsert ?? true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: urlData } = client.storage
          .from(config.bucket)
          .getPublicUrl(filePath);

        setIsUploading(false);
        return { url: urlData.publicUrl, path: filePath };
      } catch (err) {
        setIsUploading(false);
        const uploadError = {
          message: err instanceof Error ? err.message : 'Upload failed',
          code: 'UPLOAD_FAILED',
        } satisfies ImageUploadError;
        setError(uploadError);
        throw new Error(uploadError.message, { cause: err });
      }
    },
    [validateFile, client, config],
  );

  return { upload, isUploading, error, reset };
}
