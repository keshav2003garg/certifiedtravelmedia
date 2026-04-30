import { createClient } from '@supabase/supabase-js';

import {
  getBucketConfig,
  STORAGE_BUCKETS_BY_NAME,
  type StorageBucketName,
} from './buckets';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BuildObjectPathInput } from './types';

export interface StorageServiceOptions {
  url: string;
  serviceKey: string;
  /** Default download URL TTL in seconds when a bucket has no override. */
  defaultDownloadExpiresIn?: number;
}

export interface UploadFileInput {
  bucket: StorageBucketName;
  path: string;
  body: Uint8Array | Blob | ArrayBuffer;
  contentType: string;
  upsert?: boolean;
  cacheControl?: string;
}

export interface CreateSignedUploadInput {
  bucket: StorageBucketName;
  path: string;
  /** Optional MIME type used purely for the response payload. */
  contentType?: string;
}

export interface CreateSignedDownloadInput {
  bucket: StorageBucketName;
  path: string;
  expiresIn?: number;
}

export interface DeleteObjectInput {
  bucket: StorageBucketName;
  path: string;
}

const DEFAULT_DOWNLOAD_EXPIRES_IN = 300;

function slugifyFilename(filename: string): string {
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

export default class StorageService {
  readonly client: SupabaseClient;
  private readonly defaultDownloadExpiresIn: number;

  constructor(options: StorageServiceOptions) {
    this.client = createClient(options.url, options.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.defaultDownloadExpiresIn =
      options.defaultDownloadExpiresIn ?? DEFAULT_DOWNLOAD_EXPIRES_IN;
  }

  getBucketConfig(name: StorageBucketName) {
    return getBucketConfig(name);
  }

  /**
   * Builds a deterministic object path of the form
   * `<prefix>/<ownerId>/<timestamp>-<slugified-filename>`.
   */
  buildObjectPath({ prefix, ownerId, filename }: BuildObjectPathInput): string {
    const safePrefix = prefix.replace(/^\/+|\/+$/g, '');
    const safeOwner = ownerId.replace(/[^A-Za-z0-9._-]/g, '');
    const timestamp = Date.now();
    return `${safePrefix}/${safeOwner}/${timestamp}-${slugifyFilename(filename)}`;
  }

  getPublicUrl(bucket: StorageBucketName, path: string): string | null {
    const config = STORAGE_BUCKETS_BY_NAME[bucket];
    if (!config.public) return null;

    const {
      data: { publicUrl },
    } = this.client.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  async uploadFile(input: UploadFileInput) {
    const config = STORAGE_BUCKETS_BY_NAME[input.bucket];

    const { error } = await this.client.storage
      .from(input.bucket)
      .upload(input.path, input.body, {
        contentType: input.contentType,
        upsert: input.upsert ?? false,
        cacheControl: input.cacheControl ?? config.cacheControl,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return { publicUrl: this.getPublicUrl(input.bucket, input.path) };
  }

  async deleteObject(input: DeleteObjectInput) {
    const { error } = await this.client.storage
      .from(input.bucket)
      .remove([input.path]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }

    return { bucket: input.bucket, path: input.path };
  }

  async createSignedUploadUrl(input: CreateSignedUploadInput) {
    const config = STORAGE_BUCKETS_BY_NAME[input.bucket];

    const { data, error } = await this.client.storage
      .from(input.bucket)
      .createSignedUploadUrl(input.path, { upsert: false });

    if (error || !data) {
      throw new Error(
        `Failed to create signed upload URL: ${error?.message ?? 'unknown error'}`,
      );
    }

    return {
      bucket: input.bucket,
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: this.getPublicUrl(input.bucket, data.path),
      maxFileSizeBytes: config.maxFileSizeBytes,
      allowedMimeTypes: config.allowedMimeTypes,
    };
  }

  async createSignedDownloadUrl(input: CreateSignedDownloadInput) {
    const config = STORAGE_BUCKETS_BY_NAME[input.bucket];
    const expiresIn =
      input.expiresIn ??
      config.signedDownloadExpiresIn ??
      this.defaultDownloadExpiresIn;

    const { data, error } = await this.client.storage
      .from(input.bucket)
      .createSignedUrl(input.path, expiresIn);

    if (error || !data) {
      throw new Error(
        `Failed to create signed download URL: ${error?.message ?? 'unknown error'}`,
      );
    }

    return {
      bucket: input.bucket,
      path: input.path,
      signedUrl: data.signedUrl,
      expiresIn,
    };
  }
}

export type { BucketConfig, StorageBucketName } from './buckets';
export { STORAGE_BUCKETS, STORAGE_BUCKETS_BY_NAME } from './buckets';
export type {
  DeleteObjectResult,
  SignedDownloadResult,
  SignedUploadResult,
} from './types';
