// Title for a duplicated reviewer. The DB/UI title cap is 200 chars, so the
// source title is trimmed to make room for the suffix when needed.
const SUFFIX = " (copy)";

export function copyTitle(title: string): string {
  return title.slice(0, 200 - SUFFIX.length) + SUFFIX;
}
