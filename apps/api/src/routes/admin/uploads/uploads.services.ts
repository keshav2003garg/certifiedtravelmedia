import HttpError from '@repo/server-utils/errors/http-error';

import { storageService } from '@/services/storage';

import type {
  CreateSignedDownloadUrlInput,
  CreateSignedUploadUrlInput,
  DeleteObjectInput,
} from './uploads.types';

function rethrowAsInternal(message: string, error: unknown) {
  throw new HttpError(
    500,
    error instanceof Error ? error.message : message,
    'INTERNAL_SERVER',
  );
}

class UploadsService {
  async createSignedUploadUrl(values: CreateSignedUploadUrlInput) {
    try {
      return await storageService.createSignedUploadUrl({
        bucket: values.bucket,
        path: values.path,
        contentType: values.contentType,
      });
    } catch (error) {
      rethrowAsInternal('Failed to create signed upload URL', error);
    }
  }

  async createSignedDownloadUrl(values: CreateSignedDownloadUrlInput) {
    try {
      return await storageService.createSignedDownloadUrl({
        bucket: values.bucket,
        path: values.path,
        expiresIn: values.expiresIn,
      });
    } catch (error) {
      rethrowAsInternal('Failed to create signed download URL', error);
    }
  }

  async deleteObject(values: DeleteObjectInput) {
    try {
      return await storageService.deleteObject({
        bucket: values.bucket,
        path: values.path,
      });
    } catch (error) {
      rethrowAsInternal('Failed to delete storage object', error);
    }
  }
}

export const uploadsService = new UploadsService();
