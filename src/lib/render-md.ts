// Tiny markdown subset for margin notes: headings, lists, bold/italic/code,
// paragraphs. Everything is HTML-escaped FIRST, so the output is safe to
// inject — pasted tags render as visible text, never as markup.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderMarkdown(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join("<br>"))}</p>`); para = []; }
  };
  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };
  for (const line of lines) {
    const h = /^#{1,3}\s+(.*)$/.exec(line);
    if (h) { flushPara(); closeList(); out.push(`<h3>${inline(h[1])}</h3>`); continue; }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (!line.trim()) { flushPara(); closeList(); continue; }
    para.push(line);
  }
  flushPara(); closeList();
  return out.join("");
}
