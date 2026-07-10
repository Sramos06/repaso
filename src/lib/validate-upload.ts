export const MAX_BYTES = 5 * 1024 * 1024;

export type UploadCheck = { ok: true; title: string } | { ok: false; reason: string };

export function validateUpload(filename: string, sizeBytes: number, content: string): UploadCheck {
  if (!/\.html?$/i.test(filename)) return { ok: false, reason: "Only .html or .htm files are allowed." };
  if (sizeBytes > MAX_BYTES) return { ok: false, reason: "File is over the 5 MB limit." };
  if (!content.trim()) return { ok: false, reason: "File is empty." };
  const m = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const fromTitle = m?.[1]?.trim();
  const fromName = filename.replace(/\.html?$/i, "").trim();
  const title = (fromTitle || fromName).slice(0, 200);
  return { ok: true, title };
}
