import type { Member, Priority } from "./types";

// Atajos al escribir una tarea, estilo Todoist. Función pura (ver quickadd.test.ts):
//   p1..p4            prioridad (urgente, alta, normal, baja)
//   hoy, mañana, lunes…domingo, 25/11, 25/11/2026, 25 nov   fecha límite
//   @label            label (reusa la que ya existe aunque cambien mayúsculas)
//   +nombre           asigna a la persona del equipo cuyo nombre empieza así
// Lo que no se reconoce se queda en el título.
// shortcut: no hay forma de escribir "hoy" o "p1" literal en el título; si hace falta, agregar un escape (p. ej. \hoy).

export type QuickParse = {
  title: string;
  priority?: Priority;
  dueDate?: string;
  labels: string[];
  assigneeIds: string[];
};

const PRIORITIES: Record<string, Priority> = { p1: "urgent", p2: "high", p3: "normal", p4: "low" };

// 0 = domingo, como Date.getDay().
const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  // Sin abreviaturas: "mar", "sun", "sat" son palabras comunes en un título.
};

const MONTHS: Record<string, number> = {
  ene: 1, enero: 1, jan: 1, january: 1,
  feb: 2, febrero: 2, february: 2,
  mar: 3, marzo: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6, june: 6,
  jul: 7, julio: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9, september: 9,
  oct: 10, octubre: 10, october: 10,
  nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
};

/** Sin acentos y en minúsculas, para comparar ("Miércoles" = "miercoles", "mañana" = "manana"). */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Día y mes (y año opcional) válidos; sin año, la próxima vez que llegue esa fecha (hoy incluido). */
function dayMonth(today: Date, day: number, month: number, year?: number): string | undefined {
  const build = (y: number) => {
    const d = new Date(y, month - 1, day);
    return d.getMonth() === month - 1 && d.getDate() === day ? d : null;
  };
  if (year !== undefined) {
    const d = build(year < 100 ? 2000 + year : year);
    return d ? ymd(d) : undefined;
  }
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisYear = build(today.getFullYear());
  if (thisYear && thisYear >= start) return ymd(thisYear);
  const next = build(today.getFullYear() + 1);
  return next ? ymd(next) : undefined;
}

/** Fecha de una sola palabra, o undefined. */
function singleDate(word: string, today: Date): string | undefined {
  const w = fold(word);
  if (w === "hoy" || w === "today") return ymd(today);
  if (w === "manana" || w === "tomorrow") return ymd(addDays(today, 1));
  if (w in WEEKDAYS) return ymd(addDays(today, (WEEKDAYS[w] - today.getDay() + 7) % 7));
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(w);
  if (m) return dayMonth(today, Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : undefined);
  return undefined;
}

export function parseQuickAdd(
  text: string,
  ctx: { today: Date; labels: string[]; members: Pick<Member, "id" | "name">[] }
): QuickParse {
  const words = text.split(/\s+/).filter(Boolean);
  const keep: string[] = [];
  const out: QuickParse = { title: "", labels: [], assigneeIds: [] };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const w = fold(word);

    if (w in PRIORITIES) {
      out.priority = PRIORITIES[w];
      continue;
    }

    // "25 nov": número seguido de un mes.
    const next = words[i + 1] ? fold(words[i + 1]) : "";
    if (/^\d{1,2}$/.test(w) && next in MONTHS) {
      const date = dayMonth(ctx.today, Number(w), MONTHS[next]);
      if (date) {
        out.dueDate = date;
        i++;
        continue;
      }
    }

    const date = singleDate(word, ctx.today);
    if (date) {
      out.dueDate = date;
      continue;
    }

    if (word.length > 1 && word.startsWith("@")) {
      const raw = word.slice(1, 61);
      const existing = ctx.labels.find((l) => fold(l) === fold(raw));
      const label = existing ?? raw;
      if (!out.labels.some((l) => fold(l) === fold(label))) out.labels.push(label);
      continue;
    }

    if (word.length > 1 && word.startsWith("+")) {
      const q = fold(word.slice(1));
      const matches = ctx.members.filter((m) => fold(m.name).startsWith(q));
      // Solo si es una sola persona; si no, el texto se queda en el título.
      if (matches.length === 1) {
        if (!out.assigneeIds.includes(matches[0].id)) out.assigneeIds.push(matches[0].id);
        continue;
      }
    }

    keep.push(word);
  }

  out.title = keep.join(" ");
  return out;
}

/** Palabra que se está escribiendo justo antes del cursor si empieza con @ o +, para sugerir. */
export function activeShortcut(text: string, caret: number): { start: number; sigil: "@" | "+"; query: string } | null {
  const m = /(^|\s)([@+])(\S*)$/.exec(text.slice(0, caret));
  if (!m) return null;
  return { start: m.index + m[1].length, sigil: m[2] as "@" | "+", query: m[3] };
}
