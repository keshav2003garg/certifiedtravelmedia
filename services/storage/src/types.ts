import type { StorageBucketName } from './buckets';

export interface SignedUploadResult {
  /** The bucket the upload targets. */
  bucket: StorageBucketName;
  /** Final object path inside the bucket. */
  path: string;
  /** URL the client must PUT the file to. */
  signedUrl: string;
  /**
   * Token returned by Supabase. Useful when uploading via the
   * `uploadToSignedUrl` helper from `@supabase/supabase-js`.
   */
  token: string;
  /** Public URL once the upload completes (for public buckets only). */
  publicUrl: string | null;
  /** Maximum file size enforced by the bucket. */
  maxFileSizeBytes: number;
  /** Allowed MIME types for the bucket. */
  allowedMimeTypes: readonly string[];
}

export interface SignedDownloadResult {
  bucket: StorageBucketName;
  path: string;
  signedUrl: string;
  expiresIn: number;
}

export interface DeleteObjectResult {
  bucket: StorageBucketName;
  path: string;
}

export interface BuildObjectPathInput {
  /** Logical prefix folder, e.g. `brochures` or `customers`. */
  prefix: string;
  /** Owner identifier, typically a UUID or slug. */
  ownerId: string;
  /** Original filename. Will be slugified. */
  filename: string;
}
