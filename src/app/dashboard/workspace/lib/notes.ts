/**
 * Normaliza lo que la persona escribe como link: agrega https:// si falta y
 * rechaza cualquier esquema que no sea http(s) (javascript:, data:, etc.).
 * Mismo criterio que noteUrl en backend-actual.js.
 */
export function normalizeUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text || text.length > 1000 || /\s/.test(text)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** "https://www.figma.com/file/x" -> "figma.com" */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
