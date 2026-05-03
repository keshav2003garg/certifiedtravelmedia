export function normalizeReviewText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeReviewKey(value: string | null | undefined) {
  return normalizeReviewText(value ?? '').toLowerCase();
}

export function reviewTextMatches(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return normalizeReviewKey(left) === normalizeReviewKey(right);
}
