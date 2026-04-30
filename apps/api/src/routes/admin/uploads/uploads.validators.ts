import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';

import {
  deleteObjectRequestSchema,
  signedDownloadRequestSchema,
  signedUploadRequestSchema,
} from '@services/storage/validation';

import type { TypedContext } from '@repo/server-utils/types/app.types';

export const createSignedUploadUrlValidator = createValidatorSchema({
  json: signedUploadRequestSchema,
});
export type CreateSignedUploadUrlContext = TypedContext<
  typeof createSignedUploadUrlValidator
>;

export const createSignedDownloadUrlValidator = createValidatorSchema({
  json: signedDownloadRequestSchema,
});
export type CreateSignedDownloadUrlContext = TypedContext<
  typeof createSignedDownloadUrlValidator
>;

export const deleteObjectValidator = createValidatorSchema({
  json: deleteObjectRequestSchema,
});
export type DeleteObjectContext = TypedContext<typeof deleteObjectValidator>;
