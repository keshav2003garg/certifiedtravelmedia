/**
 * Single source of truth for storage buckets used across all apps.
 *
 * The bucket registry is intentionally framework-free so it can be safely
 * imported from both the API (server) and frontend (browser) without
 * leaking any Supabase server-side credentials.
 *
 * Adding a bucket here makes it available to both backend signed-URL
 * issuance and frontend client-side validation/uploads.
 */

export interface BucketConfig {
  /** Bucket name as it exists in Supabase storage. */
  readonly name: string;
  /** Whether the bucket serves public URLs. */
  readonly public: boolean;
  /** Maximum allowed file size in bytes. */
  readonly maxFileSizeBytes: number;
  /** Allowed MIME types (lowercase). */
  readonly allowedMimeTypes: readonly string[];
  /** Allowed file extensions (lowercase, no leading dot). */
  readonly allowedExtensions: readonly string[];
  /** Optional cache-control header to apply to uploads. */
  readonly cacheControl?: string;
  /** Default signed URL TTL in seconds for downloads. */
  readonly signedDownloadExpiresIn?: number;
  /** Description used in operator tooling. */
  readonly description: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

const DOCUMENT_EXTENSIONS = ['pdf', 'csv', 'xlsx', 'xls'] as const;

export const STORAGE_BUCKETS = {
  brochureCovers: {
    name: 'brochure-covers',
    public: true,
    maxFileSizeBytes: 50 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    cacheControl: '3600',
    description: 'Brochure image assets shown in admin and charts apps',
  },
  inventory: {
    name: 'inventory',
    public: true,
    maxFileSizeBytes: 50 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    cacheControl: '86400',
    description: 'Inventory images',
  },
  reports: {
    name: 'reports',
    public: true,
    maxFileSizeBytes: 1024 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    allowedExtensions: DOCUMENT_EXTENSIONS,
    signedDownloadExpiresIn: 300,
    description: 'Generated PDFs and spreadsheets for download only',
  },
} as const satisfies Record<string, BucketConfig>;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;
export type StorageBucketName =
  (typeof STORAGE_BUCKETS)[StorageBucketKey]['name'];

export const STORAGE_BUCKETS_BY_NAME: Readonly<
  Record<StorageBucketName, BucketConfig>
> = Object.fromEntries(
  Object.values(STORAGE_BUCKETS).map((bucket) => [bucket.name, bucket]),
) as unknown as Readonly<Record<StorageBucketName, BucketConfig>>;

export const ALLOWED_BUCKET_NAMES = Object.values(STORAGE_BUCKETS).map(
  (bucket) => bucket.name,
) as unknown as readonly [StorageBucketName, ...StorageBucketName[]];

export function isAllowedBucket(value: string): value is StorageBucketName {
  return value in STORAGE_BUCKETS_BY_NAME;
}

export function getBucketConfig(name: StorageBucketName): BucketConfig {
  const config = STORAGE_BUCKETS_BY_NAME[name];

  if (!config) {
    throw new Error(`Unknown storage bucket: ${name}`);
  }

  return config;
}
