import { env } from '@repo/env/server';

import StorageService from '@services/storage';

export const storageService = new StorageService({
  url: env.SUPABASE_URL,
  serviceKey: env.SUPABASE_SERVICE_KEY,
});

export type {
  BucketConfig,
  StorageBucketKey,
  StorageBucketName,
} from '@services/storage/buckets';
export {
  ALLOWED_BUCKET_NAMES,
  isAllowedBucket,
  STORAGE_BUCKETS,
  STORAGE_BUCKETS_BY_NAME,
} from '@services/storage/buckets';
