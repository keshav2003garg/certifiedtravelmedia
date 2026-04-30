import type { StorageBucketName } from '@services/storage/buckets';
import type {
  DeleteObjectResult,
  SignedDownloadResult,
  SignedUploadResult,
} from '@services/storage/types';
import type { ApiData } from '@/lib/api/types';

export type CreateSignedUploadUrlRequest = ApiData<
  {
    bucket: StorageBucketName;
    path: string;
    contentType: string;
    size: number;
  },
  { upload: SignedUploadResult }
>;

export type CreateSignedDownloadUrlRequest = ApiData<
  {
    bucket: StorageBucketName;
    path: string;
    expiresIn?: number;
  },
  { download: SignedDownloadResult }
>;

export type DeleteStorageObjectRequest = ApiData<
  {
    bucket: StorageBucketName;
    path: string;
  },
  { object: DeleteObjectResult }
>;

export interface UploadFileOptions {
  /** Override path generation. Defaults to `<ownerId>/<timestamp>-<slug>`. */
  buildPath?: (file: File) => string;
  /** Owner identifier used in the default path. */
  ownerId?: string;
  /** Optional logical prefix folder for the default path. */
  prefix?: string;
}

export interface UploadFileResult {
  bucket: StorageBucketName;
  path: string;
  publicUrl: string | null;
  contentType: string;
  size: number;
}

export interface UploadStorageError {
  code:
    | 'FILE_TOO_LARGE'
    | 'INVALID_TYPE'
    | 'INVALID_PATH'
    | 'SIGNED_URL_FAILED'
    | 'UPLOAD_FAILED';
  message: string;
}
