import { z } from '@repo/utils/zod';

import {
  ALLOWED_BUCKET_NAMES,
  type BucketConfig,
  STORAGE_BUCKETS_BY_NAME,
  type StorageBucketName,
} from './buckets';

const STORAGE_PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/._=-]*$/;

/**
 * Pure helper used by both server validators and client-side checks.
 * Returns `null` when the path is valid, otherwise an error message.
 */
export function checkStoragePath(path: string) {
  if (path.length === 0) return 'Path is required';
  if (path.length > 500) return 'Path must be 500 characters or less';
  if (path.startsWith('/')) return 'Path must be relative';
  if (path.endsWith('/')) return 'Path must include a file name';
  if (path.includes('\\')) return 'Path must use forward slashes';
  if (path.includes('?') || path.includes('#')) {
    return 'Path must not include query strings or fragments';
  }
  if (!STORAGE_PATH_PATTERN.test(path)) {
    return 'Path contains unsupported characters';
  }
  const segments = path.split('/');
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    return 'Path contains invalid segments';
  }
  return null;
}

export function getPathExtension(path: string): string | undefined {
  const filename = path.split('/').at(-1) ?? '';
  const dotIndex = filename.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === filename.length - 1) {
    return undefined;
  }

  return filename.slice(dotIndex + 1).toLowerCase();
}

export const storageBucketSchema = z.enum(ALLOWED_BUCKET_NAMES, {
  message: 'Invalid storage bucket',
});

export const storagePathSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const error = checkStoragePath(value);
    if (error) {
      ctx.addIssue({ code: 'custom', message: error });
    }
  });

function refineExtension(
  ctx: z.RefinementCtx,
  path: string,
  config: BucketConfig,
) {
  const extension = getPathExtension(path);
  if (!extension || !config.allowedExtensions.includes(extension)) {
    ctx.addIssue({
      code: 'custom',
      path: ['path'],
      message: `Path must end with one of: ${config.allowedExtensions.join(', ')}`,
    });
  }
}

/** Validates `{ bucket, path }` and enforces the bucket's allowed extensions. */
export const storageObjectSchema = z
  .object({
    bucket: storageBucketSchema,
    path: storagePathSchema,
  })
  .superRefine((value, ctx) => {
    refineExtension(ctx, value.path, STORAGE_BUCKETS_BY_NAME[value.bucket]);
  });

/**
 * Validates upload metadata (path + content-type + size) against the
 * bucket configuration. Use on both the API and the client.
 */
export const signedUploadRequestSchema = z
  .object({
    bucket: storageBucketSchema,
    path: storagePathSchema,
    contentType: z
      .string()
      .trim()
      .min(1, 'Content type is required')
      .max(255, 'Content type must be 255 characters or less')
      .toLowerCase(),
    size: z
      .number()
      .int('File size must be a whole number of bytes')
      .nonnegative('File size must not be negative'),
  })
  .superRefine((value, ctx) => {
    const config = STORAGE_BUCKETS_BY_NAME[value.bucket];
    refineExtension(ctx, value.path, config);

    if (!config.allowedMimeTypes.includes(value.contentType)) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentType'],
        message: `Content type must be one of: ${config.allowedMimeTypes.join(', ')}`,
      });
    }

    if (value.size > config.maxFileSizeBytes) {
      const maxMb = (config.maxFileSizeBytes / (1024 * 1024)).toFixed(1);
      ctx.addIssue({
        code: 'custom',
        path: ['size'],
        message: `File size exceeds the ${maxMb} MB limit for this bucket`,
      });
    }
  });

export const signedDownloadRequestSchema = z.object({
  bucket: storageBucketSchema,
  path: storagePathSchema,
  expiresIn: z
    .number()
    .int('Expires in must be a whole number of seconds')
    .min(30, 'Expires in must be at least 30 seconds')
    .max(60 * 60 * 24, 'Expires in cannot exceed 24 hours')
    .optional(),
});

export const deleteObjectRequestSchema = storageObjectSchema;

export type SignedUploadRequest = z.infer<typeof signedUploadRequestSchema>;
export type SignedDownloadRequest = z.infer<typeof signedDownloadRequestSchema>;
export type DeleteObjectRequest = z.infer<typeof deleteObjectRequestSchema>;
export type StorageObject = z.infer<typeof storageObjectSchema>;
export type { StorageBucketName };
