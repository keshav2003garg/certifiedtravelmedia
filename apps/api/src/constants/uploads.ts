/**
 * Convenience re-export of the storage bucket registry as API constants.
 *
 * The actual definitions live in `@services/storage/buckets` so the same
 * registry is used across server and client. Importing from here keeps
 * API-specific code grouped under `apps/api/src/constants`.
 */

export type {
  BucketConfig,
  StorageBucketKey,
  StorageBucketName,
} from '@services/storage/buckets';
export {
  ALLOWED_BUCKET_NAMES,
  getBucketConfig,
  isAllowedBucket,
  STORAGE_BUCKETS,
  STORAGE_BUCKETS_BY_NAME,
} from '@services/storage/buckets';
