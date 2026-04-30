import type { z } from '@repo/utils/zod';
import type {
  deleteObjectRequestSchema,
  signedDownloadRequestSchema,
  signedUploadRequestSchema,
} from '@services/storage/validation';

export type CreateSignedUploadUrlInput = z.infer<
  typeof signedUploadRequestSchema
>;

export type CreateSignedDownloadUrlInput = z.infer<
  typeof signedDownloadRequestSchema
>;

export type DeleteObjectInput = z.infer<typeof deleteObjectRequestSchema>;
