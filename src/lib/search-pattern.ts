// Escape LIKE/ILIKE wildcards so user input matches literally. Backslash is the
// default escape char in Postgres LIKE.
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}
