export function buildPaginationResponse(
  page: number,
  pageSize: number,
  total: number,
) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    limit: pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
