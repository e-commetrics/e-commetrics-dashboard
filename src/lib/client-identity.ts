// Client identity: the client's logo plus ONE colour taken from that logo.
//
// Colour rank in the dashboard (Brand Board, 2026-11):
//   1. E-commetrics brand runs the interface (navigation, buttons, progress).
//   2. Client identity marks what belongs to a client: a logo tile, a dot or a rail.
//   3. The distinction set (--ec-d1..d6) only tells things apart when there is no logo.
//
// A raw logo colour is often too pale or too bright to read (Reforma's lime is
// 1.9:1 on white), so we keep its hue and pick a lightness that works on each
// theme. The colour is never used for text.

import type { CSSProperties } from "react";

export type ClientIdentity = {
  /** Public path of the logo, or null when the client has none yet. */
  logo: string | null;
  /** Readable step of the client colour on light surfaces. */
  light: string;
  /** Readable step of the client colour on dark surfaces. */
  dark: string;
  initials: string;
};

// ─── OKLCH helpers (hue-preserving lightness change) ─────────────────────────

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (ch) => ch + ch) : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toOklch([r8, g8, b8]: [number, number, number]) {
  const r = toLinear(r8), g = toLinear(g8), b = toLinear(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
}

function fromOklch(L: number, C: number, h: number): string {
  const A = C * Math.cos(h), B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Same hue, two lightness steps: one that shows on white, one that shows on the
 * dark surface. Greys stay grey. Returns null for anything that is not a hex colour.
 */
export function readableSteps(hex: string): { light: string; dark: string } | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const { C, h } = toOklch(rgb);
  if (C < 0.03) return { light: "#65617F", dark: "#9793B4" };
  return { light: fromOklch(0.5, clamp(C, 0.11, 0.17), h), dark: fromOklch(0.72, clamp(C, 0.1, 0.15), h) };
}

// ─── Known clients and fallbacks ─────────────────────────────────────────────

/** Clients whose logo file is in /public. `base` is the most saturated colour found in that logo. */
const KNOWN: { match: RegExp; logo: string; base: string }[] = [
  { match: /reforma/i, logo: "/reforma logo.png", base: "#9CCC0C" },
  { match: /bites/i, logo: "/bites logo.png", base: "#E42484" },
  { match: /\bsyl\b/i, logo: "/SYL logo.jpeg", base: "#FC540C" },
];

/** Distinction set, light and dark steps (same values as --ec-d1..d6 in globals.css). */
const DISTINCT: [string, string][] = [
  ["#2A78D6", "#3987E5"],
  ["#1BAF7A", "#199E70"],
  ["#6250D6", "#9085E9"],
  ["#EB6834", "#D95926"],
  ["#EDA100", "#C98500"],
  ["#C2185B", "#E0559A"],
];

export function initialsOf(name: string): string {
  const words = name.replace(/[·|/-].*$/, "").trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : [words[0]?.slice(0, 2) ?? "?"];
  return letters.join("").toUpperCase();
}

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Identity for a client or one of its projects.
 * Order: known logo → the colour stored for the client/project (made readable) → a stable pick from the distinction set.
 * `logoUrl` is for a logo uploaded through the client form, once the backend stores one.
 */
export function clientIdentity(
  name: string,
  opts: { color?: string | null; logoUrl?: string | null; logoColor?: string | null } = {},
): ClientIdentity {
  const initials = initialsOf(name);
  const known = KNOWN.find((k) => k.match.test(name));
  if (known) {
    const steps = readableSteps(known.base) as { light: string; dark: string };
    return { logo: known.logo, ...steps, initials };
  }
  const fromLogo = opts.logoColor ? readableSteps(opts.logoColor) : null;
  if (opts.logoUrl && fromLogo) return { logo: opts.logoUrl, ...fromLogo, initials };
  const stored = opts.color ? readableSteps(opts.color) : null;
  if (stored) return { logo: opts.logoUrl ?? null, ...stored, initials };
  const [light, dark] = DISTINCT[hash(name.split(/[·|]/)[0].trim().toLowerCase()) % DISTINCT.length];
  return { logo: opts.logoUrl ?? null, light, dark, initials };
}

/** Inline custom properties read by `.ec-client` (see globals.css): `var(--client)` then follows the theme. */
export function identityVars(identity: ClientIdentity): CSSProperties {
  return { "--cl": identity.light, "--cd": identity.dark } as CSSProperties;
}

/**
 * Reads the most saturated colour of an image in the browser (for a logo the
 * team uploads). Returns null when the image cannot be read (CORS) or is grey.
 */
export async function logoColor(src: string): Promise<string | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("load"));
      img.src = src;
    });
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map<string, { weight: number; rgb: [number, number, number] }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const rgb: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
      const { C } = toOklch(rgb);
      if (C < 0.06) continue;
      const key = rgb.map((v) => v >> 5).join("-");
      const hit = buckets.get(key);
      if (hit) hit.weight += C;
      else buckets.set(key, { weight: C, rgb });
    }
    let best: { weight: number; rgb: [number, number, number] } | null = null;
    for (const b of buckets.values()) if (!best || b.weight > best.weight) best = b;
    return best ? `#${best.rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}` : null;
  } catch {
    return null;
  }
}
