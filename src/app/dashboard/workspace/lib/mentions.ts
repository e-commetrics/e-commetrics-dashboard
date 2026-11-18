import type { Member } from "./types";

// Menciones del muro: el texto se guarda plano ("Revisa @Ana María") y los ids
// van aparte en `mentionIds`. Estas funciones son puras (ver mentions.test.ts).

/** Mención que se está escribiendo justo antes del cursor: "@" al inicio o tras un espacio. */
export function activeMentionQuery(text: string, caret: number): { start: number; query: string } | null {
  const match = /(^|\s)@([^\s@]*)$/.exec(text.slice(0, caret));
  if (!match) return null;
  return { start: match.index + match[1].length, query: match[2] };
}

/** Reemplaza "@query" (de `start` al cursor) por "@Nombre ". */
export function insertMention(text: string, start: number, caret: number, name: string): { text: string; caret: number } {
  const token = `@${name} `;
  return { text: text.slice(0, start) + token + text.slice(caret), caret: start + token.length };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Parte el texto en tramos, marcando "@Nombre" de los nombres dados. El nombre más largo gana. */
export function splitMentions(text: string, names: string[]): { text: string; mention: boolean }[] {
  const sorted = Array.from(new Set(names.filter(Boolean))).sort((a, b) => b.length - a.length);
  if (!sorted.length) return [{ text, mention: false }];
  // "@" no pegado a una letra/numero antes ("correo@Ana") y el nombre no seguido de otra letra/numero ("@Anabel").
  const re = new RegExp(`(?<![\\p{L}\\p{N}])@(?:${sorted.map(escapeRegex).join("|")})(?![\\p{L}\\p{N}])`, "gu");
  const parts: { text: string; mention: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), mention: false });
    parts.push({ text: m[0], mention: true });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mention: false });
  return parts;
}

/** Ids (sin repetir, en orden de aparición) de los miembros cuyo "@Nombre" está en el texto. */
export function mentionIdsIn(text: string, members: Pick<Member, "id" | "name">[]): string[] {
  const byName = new Map(members.map((m) => [`@${m.name}`, m.id]));
  const ids = splitMentions(text, members.map((m) => m.name))
    .filter((p) => p.mention)
    .map((p) => byName.get(p.text))
    .filter((id): id is string => !!id);
  return Array.from(new Set(ids));
}
