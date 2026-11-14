// Results of a client's own apps (bookings, income, appointments), read from
// the same client backends the apps already use. Shown INSIDE the project:
// on the client's home and on the Workspace project of that client.
//
// One loader per client group id (see CLIENT_GROUPS in lib/apps.ts). A client
// without a loader simply has no results card.

export type ResultMetric = {
  key: string;
  es: string;
  en: string;
  /** Already formatted for display. */
  value: string;
  /** Same figure for the whole previous month, formatted. Shown as plain context: this month is still running. */
  prev?: string;
};

/** One figure per week, oldest first. Built from the same list the metrics come from. */
export type ResultSeries = { es: string; en: string; unitEs: string; unitEn: string; labels: string[]; values: number[] };

export type ClientResults = { metrics: ResultMetric[]; appSlug: string; series?: ResultSeries };

/** Counts per week for the last `weeks` weeks (Monday to Sunday), ending with the current week. */
function weekly(days: string[], weeks = 12, now = new Date()): { labels: string[]; values: number[] } {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6);
    const a = ymd(from), b = ymd(to);
    labels.push(from.toLocaleDateString("es-MX", { day: "numeric", month: "short" }));
    values.push(days.filter((d) => d >= a && d <= b).length);
  }
  return { labels, values };
}

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const ymd = (d: Date) => `${ym(d)}-${String(d.getDate()).padStart(2, "0")}`;
/** Local "YYYY-MM-DD" of whatever date string the backend sends. */
const day = (value: string | null | undefined): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : ymd(d);
};

async function getList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

type Months = { now: Date; month: string; prevMonth: string; today: string; in7: string };
function months(now = new Date()): Months {
  return {
    now,
    month: ym(now),
    prevMonth: ym(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    today: ymd(now),
    in7: ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
  };
}

const count = (n: number) => n.toLocaleString("es-MX");

type PalmasBooking = { total: number | string; status: string; created_at: string; check_in: string };
type PalmasMessage = { created_at: string };

async function palmas(): Promise<ClientResults> {
  const m = months();
  const [bookings, messages] = await Promise.all([
    getList<PalmasBooking>("https://palmasrecovery.com/api/bookings"),
    getList<PalmasMessage>("https://palmasrecovery.com/api/contact").catch(() => [] as PalmasMessage[]),
  ]);
  const live = bookings.filter((b) => !/cancel/i.test(b.status ?? ""));
  const inMonth = (list: PalmasBooking[], month: string) => list.filter((b) => day(b.created_at).startsWith(month));
  const sum = (list: PalmasBooking[]) => list.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
  const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const cur = inMonth(live, m.month);
  const prev = inMonth(live, m.prevMonth);
  const msgCur = messages.filter((x) => day(x.created_at).startsWith(m.month)).length;
  const msgPrev = messages.filter((x) => day(x.created_at).startsWith(m.prevMonth)).length;
  return {
    appSlug: "calendario-palmas",
    metrics: [
      { key: "bookings", es: "Reservas este mes", en: "Bookings this month", value: count(cur.length), prev: count(prev.length) },
      {
        key: "income",
        es: "Ingresos este mes",
        en: "Income this month",
        value: usd(sum(cur)),
        prev: usd(sum(prev)),
      },
      { key: "messages", es: "Mensajes este mes", en: "Messages this month", value: count(msgCur), prev: count(msgPrev) },
    ],
    series: { es: "Reservas por semana", en: "Bookings per week", unitEs: "reservas", unitEn: "bookings", ...weekly(live.map((b) => day(b.created_at))) },
  };
}

type Appointment = { fecha: string; fecha_creacion?: string };

function appointments(url: string, appSlug: string) {
  return async (): Promise<ClientResults> => {
    const m = months();
    const list = await getList<Appointment>(url);
    const on = (a: Appointment) => day(a.fecha);
    const cur = list.filter((a) => on(a).startsWith(m.month)).length;
    const prev = list.filter((a) => on(a).startsWith(m.prevMonth)).length;
    const next7 = list.filter((a) => on(a) >= m.today && on(a) <= m.in7).length;
    const booked = list.filter((a) => day(a.fecha_creacion).startsWith(m.month)).length;
    const bookedPrev = list.filter((a) => day(a.fecha_creacion).startsWith(m.prevMonth)).length;
    return {
      appSlug,
      metrics: [
        { key: "month", es: "Citas este mes", en: "Appointments this month", value: count(cur), prev: count(prev) },
        { key: "next7", es: "Próximos 7 días", en: "Next 7 days", value: count(next7) },
        { key: "booked", es: "Agendadas este mes", en: "Booked this month", value: count(booked), prev: count(bookedPrev) },
      ],
      series: { es: "Citas por semana", en: "Appointments per week", unitEs: "citas", unitEn: "appointments", ...weekly(list.map(on)) },
    };
  };
}

const LOADERS: Record<string, () => Promise<ClientResults>> = {
  palmas,
  reforma: appointments("https://reformadental.com/api/appointments", "calendar-reforma"),
  monge: appointments("https://mongeortopedia.com/api/appointments/", "calendar-monge"),
};

export const hasClientResults = (groupId: string) => groupId in LOADERS;

export function loadClientResults(groupId: string): Promise<ClientResults> {
  const loader = LOADERS[groupId];
  return loader ? loader() : Promise.reject(new Error("No results for this client"));
}
