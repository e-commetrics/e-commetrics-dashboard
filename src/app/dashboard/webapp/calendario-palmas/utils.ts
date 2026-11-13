import { ROOM_NAMES, EXTRA_NAMES } from "./constants";
import type { Booking } from "./types";

export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Used for availability checks — excludes cancelled
export function bookingOccupiesDayLocal(booking: Booking, day: Date): boolean {
  if (booking.status === "cancelled") return false;
  const checkIn = parseDateLocal(booking.check_in.slice(0, 10));
  const checkOut = parseDateLocal(booking.check_out.slice(0, 10));
  return day >= checkIn && day < checkOut;
}

// Used for calendar display — includes cancelled
export function bookingOnDayLocal(booking: Booking, day: Date): boolean {
  const checkIn = parseDateLocal(booking.check_in.slice(0, 10));
  const checkOut = parseDateLocal(booking.check_out.slice(0, 10));
  return day >= checkIn && day < checkOut;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
  return days;
}

export function dateToInputStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── SourceBadge ───────────────────────────────────────────────────────────────

export function toICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

export function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateICS(bookings: Booking[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palmas Recovery//Calendario//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Palmas Recovery – Reservas",
    "X-WR-TIMEZONE:America/Tijuana",
  ];

  for (const b of bookings) {
    const checkIn = toICSDate(b.check_in.slice(0, 10));
    const checkOut = toICSDate(b.check_out.slice(0, 10));
    const room = ROOM_NAMES[b.room_id] ?? b.room_id;
    const status = b.status === "confirmed" ? "CONFIRMED" : "CANCELLED";
    const extrasStr = b.extras.length > 0 ? b.extras.map((e) => EXTRA_NAMES[e] ?? e).join(", ") : "Ninguno";
    const desc = [
      `Confirmación: #${b.confirmation_number}`,
      `Email: ${b.email}`,
      `Teléfono: ${b.phone}`,
      `Cirujano: ${b.certified_doctor}`,
      `Noches: ${b.nights}`,
      `Total: $${b.total} USD`,
      `Extras: ${extrasStr}`,
      b.special_requests ? `Solicitudes: ${b.special_requests}` : null,
    ].filter(Boolean).join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:palmas-booking-${b.id}@palmasrecovery.com`,
      `SUMMARY:${escapeICS(`${room} – ${b.full_name}`)}`,
      `DTSTART;VALUE=DATE:${checkIn}`,
      `DTEND;VALUE=DATE:${checkOut}`,
      `DESCRIPTION:${desc}`,
      `STATUS:${status}`,
      `CATEGORIES:${escapeICS(room)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── SubscriptionButton ────────────────────────────────────────────────────────
