// Save text to the user's device as a file download (browser-only).
export function downloadText(filename: string, text: string, type = "text/html"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Turn a reviewer title into a safe .html filename.
export function htmlFilename(title: string): string {
  const base = title.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 100).trim() || "reviewer";
  return `${base}.html`;
}
