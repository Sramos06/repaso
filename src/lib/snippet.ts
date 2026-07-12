// Plain-text preview window around the first (case-insensitive) match of `term`.
// Returns PLAIN text — content_text is search-only and may contain tag-shaped
// characters, so the caller must highlight via React nodes, never as raw HTML.
export function makeSnippet(text: string, term: string, radius = 64): string {
  if (!text) return "";
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i === -1) {
    const head = text.slice(0, radius * 2).trim();
    return head + (text.length > radius * 2 ? "…" : "");
  }
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + term.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}
