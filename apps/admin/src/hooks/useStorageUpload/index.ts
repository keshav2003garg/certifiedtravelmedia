import { useCallback, useMemo, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import {
  getBucketConfig,
  type StorageBucketName,
} from '@services/storage/buckets';
import { checkStoragePath } from '@services/storage/validation';

import { api } from '@/lib/api/instances';

import type {
  CreateSignedDownloadUrlRequest,
  CreateSignedUploadUrlRequest,
  DeleteStorageObjectRequest,
  UploadFileOptions,
  UploadFileResult,
  UploadStorageError,
} from './types';

const UPLOADS_ENDPOINT = '/admin/uploads';

function slugifyFilename(filename: string) {
  const withoutAccents = filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  const dotIndex = withoutAccents.lastIndexOf('.');
  const base =
    dotIndex > 0 ? withoutAccents.slice(0, dotIndex) : withoutAccents;
  const ext = dotIndex > 0 ? withoutAccents.slice(dotIndex + 1) : '';

  const cleanBase =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file';
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');

  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

function defaultBuildPath(file: File, ownerId?: string, prefix?: string) {
  const slug = slugifyFilename(file.name);
  const segments = [
    prefix,
    ownerId ?? 'shared',
    `${Date.now()}-${slug}`,
  ].filter(
    (segment): segment is string =>
      typeof segment === 'string' && segment.length > 0,
  );
  return segments.join('/');
}

function ensureValidFile(
  bucket: StorageBucketName,
  file: File,
): UploadStorageError | null {
  const config = getBucketConfig(bucket);

  if (file.size > config.maxFileSizeBytes) {
    const maxMb = (config.maxFileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      code: 'FILE_TOO_LARGE',
      message: `File exceeds the ${maxMb} MB limit for this bucket`,
    };
  }

  if (
    file.type.length === 0 ||
    !config.allowedMimeTypes.includes(file.type.toLowerCase())
  ) {
    return {
      code: 'INVALID_TYPE',
      message: `File type must be one of: ${config.allowedMimeTypes.join(', ')}`,
    };
  }

  return null;
}

interface UseStorageUploadOptions extends UploadFileOptions {
  bucket: StorageBucketName;
}

export function useStorageUpload({
  bucket,
  buildPath,
  ownerId,
  prefix,
}: UseStorageUploadOptions) {
  const [error, setError] = useState<UploadStorageError | null>(null);
  const config = useMemo(() => getBucketConfig(bucket), [bucket]);

  const uploadMutation = useMutation<UploadFileResult, Error, File>({
    mutationFn: async (file) => {
      setError(null);

      const validationError = ensureValidFile(bucket, file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError.message);
      }

      const path = buildPath
        ? buildPath(file)
        : defaultBuildPath(file, ownerId, prefix);

      const pathError = checkStoragePath(path);
      if (pathError) {
        const next: UploadStorageError = {
          code: 'INVALID_PATH',
          message: pathError,
        };
        setError(next);
        throw new Error(pathError);
      }

      let signed: CreateSignedUploadUrlRequest['response']['data']['upload'];
      try {
        const response = await api<CreateSignedUploadUrlRequest['response']>(
          `${UPLOADS_ENDPOINT}/signed-upload-url`,
          {
            method: 'POST',
            body: {
              bucket,
              path,
              contentType: file.type,
              size: file.size,
            },
          },
        );
        signed = response.data.upload;
      } catch (cause) {
        const next: UploadStorageError = {
          code: 'SIGNED_URL_FAILED',
          message:
            cause instanceof Error
              ? cause.message
              : 'Failed to create signed upload URL',
        };
        setError(next);
        throw new Error(next.message, { cause });
      }

      try {
        const uploadResponse = await fetch(signed.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'x-upsert': 'false',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Storage rejected upload (${uploadResponse.status} ${uploadResponse.statusText})`,
          );
        }
      } catch (cause) {
        const next: UploadStorageError = {
          code: 'UPLOAD_FAILED',
          message:
            cause instanceof Error ? cause.message : 'Failed to upload file',
        };
        setError(next);
        throw new Error(next.message, { cause });
      }

      return {
        bucket: signed.bucket,
        path: signed.path,
        publicUrl: signed.publicUrl,
        contentType: file.type,
        size: file.size,
      };
    },
  });

  const deleteMutation = useMutation<
    DeleteStorageObjectRequest['response']['data']['object'],
    Error,
    string
  >({
    mutationFn: async (path) => {
      const response = await api<DeleteStorageObjectRequest['response']>(
        `${UPLOADS_ENDPOINT}/delete`,
        {
          method: 'POST',
          body: { bucket, path },
        },
      );
      return response.data.object;
    },
  });

  const createSignedDownloadUrl = useCallback(
    async (path: string, expiresIn?: number) => {
      const response = await api<CreateSignedDownloadUrlRequest['response']>(
        `${UPLOADS_ENDPOINT}/signed-download-url`,
        {
          method: 'POST',
          body: { bucket, path, expiresIn },
        },
      );
      return response.data.download;
    },
    [bucket],
  );

  const reset = useCallback(() => {
    setError(null);
    uploadMutation.reset();
    deleteMutation.reset();
  }, [uploadMutation, deleteMutation]);

  return {
    config,
    upload: uploadMutation.mutateAsync,
    deleteObject: deleteMutation.mutateAsync,
    createSignedDownloadUrl,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error,
    reset,
  };
}
