// Title for pasted HTML: the <title> tag wins, then the first <h1> (inner
// tags stripped), then a plain default. Mirrors validateUpload's precedence
// so pasted and file-based reviewers name themselves the same way.
export function pasteTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (t) return t.slice(0, 200);
  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h) {
    const text = h.replace(/<[^>]*>/g, "").trim();
    if (text) return text.slice(0, 200);
  }
  return "Pasted reviewer";
}
