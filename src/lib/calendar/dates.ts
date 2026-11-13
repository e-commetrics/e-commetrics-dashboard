/**
 * Date helpers shared by the clinic calendars (Monge, Reforma).
 *
 * Dates travel as "YYYY-MM-DD" strings and hours as "HH:MM". Everything is
 * built in local time on purpose: `new Date("2026-01-05")` is parsed as UTC and
 * shifts a day in Mexico/US time zones.
 */

export type CalendarLang = "es" | "en";

export const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Local date as "YYYY-MM-DD". */
export function isoYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" + "HH:MM" → local Date. */
export function parseLocalDateTime(dateStr: string, hourStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = hourStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/** 0 = Sunday … 6 = Saturday. */
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/** Long date, e.g. "lunes, 5 de enero de 2026". Built at noon to dodge DST edges. */
export function formatDateForDisplay(dateStr: string, lang: CalendarLang): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
