// Decode the HTML entities that show up in text pulled out of a raw file —
// mainly a reviewer's <title>. A well-formed file escapes & < > " ' as
// entities, so without this the stored title reads "Modeling &amp; Simulation"
// verbatim. One regex pass so nested cases decode exactly once: "&amp;lt;"
// becomes the literal text "&lt;", never "<".
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    // Numeric entity: &#123; (decimal) or &#x1F4D8; (hex).
    if (body[0] === "#") {
      const cp =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      // Guard against out-of-range code points that would throw.
      if (Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff) {
        try {
          return String.fromCodePoint(cp);
        } catch {
          return whole;
        }
      }
      return whole;
    }
    // Named entity: only the handful worth decoding for a title. Unknown names
    // (e.g. &copy;) are left untouched rather than guessed at.
    return NAMED[body.toLowerCase()] ?? whole;
  });
}
