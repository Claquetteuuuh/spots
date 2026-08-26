/**
 * Result of slicing an "N+1" query result down to a page, cursor-pagination
 * style: fetch `limit + 1` rows ordered consistently, and if more than
 * `limit` came back, there is a next page starting after the last kept row.
 */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Turn an over-fetched (`limit + 1`) list of rows into a page of at most
 * `limit` items plus the cursor to request the next page, if any.
 */
export function paginate<T extends { id: string }>(
  rows: T[],
  limit: number
): Paginated<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? last.id : null;
  return { items, nextCursor };
}
