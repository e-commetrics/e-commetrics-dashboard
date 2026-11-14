"use client";

import React, { useState } from "react";
import { Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SourceBadge } from "./ui";
import { ROOM_NAMES, ROOM_COLORS, DEFAULT_ROOM_COLOR } from "../constants";
import type { Booking } from "../types";
import { parseDateLocal, bookingOccupiesDayLocal, bookingOnDayLocal, getDaysInMonth, dateToInputStr } from "../utils";

export function CalendarView({
  bookings,
  onCreateForDay,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
}: {
  bookings: Booking[];
  onCreateForDay: (dateStr: string, roomId?: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>(""); // "" = all rooms

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    onPrevMonth();
    setSelectedDay(null);
  };
  const nextMonth = () => {
    onNextMonth();
    setSelectedDay(null);
  };

  // Confirmed rooms on a day (for availability coloring)
  const confirmedRoomsOnDay = (day: Date): string[] =>
    bookings.filter((b) => bookingOccupiesDayLocal(b, day)).map((b) => b.room_id);

  // Cancelled rooms on a day (for gray dots)
  const cancelledRoomsOnDay = (day: Date): string[] =>
    bookings
      .filter((b) => b.status === "cancelled" && bookingOnDayLocal(b, day))
      .map((b) => b.room_id);

  // Is a specific room booked (confirmed only — for availability)
  const isRoomBooked = (roomId: string, day: Date): boolean =>
    bookings.some((b) => b.room_id === roomId && bookingOccupiesDayLocal(b, day));

  // Are ALL rooms booked (confirmed only)
  const isFullyBooked = (day: Date): boolean =>
    Object.keys(ROOM_NAMES).every((rid) => isRoomBooked(rid, day));

  // All bookings (confirmed + cancelled) for the side panel
  const bookingsForSelected = selectedDay
    ? bookings.filter((b) => bookingOnDayLocal(b, selectedDay))
    : [];

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const isSelected = (d: Date) =>
    selectedDay !== null &&
    d.getDate() === selectedDay.getDate() &&
    d.getMonth() === selectedDay.getMonth() &&
    d.getFullYear() === selectedDay.getFullYear();

  // Day cell inline style based on filter
  const dayCellStyle = (day: Date, selected: boolean, todayMark: boolean): React.CSSProperties => {
    const base: React.CSSProperties = { position: "relative", borderRadius: 8, padding: 4, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "background 140ms", width: "100%", border: "none", cursor: "pointer" };
    if (selected) return { ...base, background: "rgba(245,158,11,0.15)", outline: `2px solid #f59e0b` };
    if (roomFilter) {
      const booked = isRoomBooked(roomFilter, day);
      if (booked) return { ...base, background: todayMark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.07)" };
      return { ...base, background: todayMark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.05)" };
    }
    const fully = isFullyBooked(day);
    if (fully) return { ...base, background: "rgba(239,68,68,0.06)" };
    return { ...base, background: "transparent" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* calendar grid */}
      <div className="lg:col-span-2 ec-project-card" style={{ padding: "16px 20px", borderRadius: 14 }}>
        {/* month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            onClick={prevMonth}
            style={{ padding: "6px 8px", borderRadius: 8, background: "var(--ec-surface-2)", border: "1px solid var(--ec-border)", color: "var(--ec-text)", cursor: "pointer", display: "flex" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: "var(--ec-text)", textTransform: "capitalize" }}>{monthName}</h3>
          <button
            onClick={nextMonth}
            style={{ padding: "6px 8px", borderRadius: 8, background: "var(--ec-surface-2)", border: "1px solid var(--ec-border)", color: "var(--ec-text)", cursor: "pointer", display: "flex" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* room filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--ec-hairline)" }}>
          <button onClick={() => setRoomFilter("")} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 140ms", background: roomFilter === "" ? "var(--ec-brand)" : "var(--ec-surface-2)", color: roomFilter === "" ? "white" : "var(--ec-text-muted)", border: "1px solid var(--ec-border)" }}>Todas</button>
          {Object.entries(ROOM_NAMES).map(([id, name]) => {
            const rc = ROOM_COLORS[id] ?? DEFAULT_ROOM_COLOR;
            const active = roomFilter === id;
            return <button key={id} onClick={() => setRoomFilter(roomFilter === id ? "" : id)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 140ms", background: active ? rc.bg : "var(--ec-surface-2)", color: active ? rc.color : "var(--ec-text-muted)", border: `1px solid ${active ? rc.color : "var(--ec-border)"}` }}>{name}</button>;
          })}
        </div>

        {/* availability legend when filter active */}
        {roomFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, fontSize: 12, color: "var(--ec-text-dim)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "inline-block" }} />Ocupado</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "inline-block" }} />Disponible</div>
          </div>
        )}

        {/* weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--ec-text-dim)", padding: "4px 0", fontFamily: "JetBrains Mono, monospace" }}>{d}</div>
          ))}
        </div>

        {/* day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const confirmedRooms = confirmedRoomsOnDay(day);
            const cancelledRooms = cancelledRoomsOnDay(day);
            const selected = isSelected(day);
            const todayMark = isToday(day);
            const bookedByFilter = roomFilter ? isRoomBooked(roomFilter, day) : false;
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(selected ? null : day)} style={dayCellStyle(day, selected, todayMark)}>
                <span style={{ fontSize: 12, fontWeight: 500, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: todayMark ? "#f59e0b" : "transparent", color: todayMark ? "white" : "var(--ec-text)" }}>{day.getDate()}</span>
                {!roomFilter && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                    {[...new Set(confirmedRooms)].map((roomId) => <span key={roomId} style={{ width: 6, height: 6, borderRadius: "50%", background: (ROOM_COLORS[roomId] ?? DEFAULT_ROOM_COLOR).dot, display: "inline-block" }} title={ROOM_NAMES[roomId] ?? roomId} />)}
                    {[...new Set(cancelledRooms)].map((roomId) => <span key={`c-${roomId}`} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ec-text-dim)", display: "inline-block", opacity: 0.4 }} title={`${ROOM_NAMES[roomId] ?? roomId} (cancelada)`} />)}
                  </div>
                )}
                {roomFilter && <span style={{ fontSize: 9, marginTop: 2, color: bookedByFilter ? "#ef4444" : "#10b981" }}>{bookedByFilter ? "✕" : "✓"}</span>}
              </button>
            );
          })}
        </div>

        {/* legend */}
        {!roomFilter && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--ec-hairline)", display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(ROOM_NAMES).map(([id, name]) => {
              const rc = ROOM_COLORS[id] ?? DEFAULT_ROOM_COLOR;
              return <div key={id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ec-text-dim)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: rc.dot, display: "inline-block" }} />{name}</div>;
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ec-text-dim)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ec-text-dim)", opacity: 0.4, display: "inline-block" }} />Cancelada</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ec-text-dim)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(239,68,68,0.3)", display: "inline-block" }} />Todo ocupado</div>
          </div>
        )}
      </div>

      {/* side panel */}
      <div className="ec-project-card" style={{ padding: "16px 18px", borderRadius: 14 }}>
        {selectedDay ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ec-text)", textTransform: "capitalize" }}>
                {selectedDay.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              {selectedDay >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                <button onClick={() => onCreateForDay(dateToInputStr(selectedDay), roomFilter || undefined)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "#f59e0b", color: "white", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", flexShrink: 0 }}>
                  <Plus size={12} />Nueva
                </button>
              )}
            </div>

            {roomFilter && (
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: isRoomBooked(roomFilter, selectedDay) ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${isRoomBooked(roomFilter, selectedDay) ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, color: isRoomBooked(roomFilter, selectedDay) ? "#ef4444" : "#10b981" }}>
                {isRoomBooked(roomFilter, selectedDay) ? <><XCircle size={13} style={{ flexShrink: 0 }} />{ROOM_NAMES[roomFilter]} — Ocupado</> : <><CheckCircle size={13} style={{ flexShrink: 0 }} />{ROOM_NAMES[roomFilter]} — Disponible</>}
              </div>
            )}

            {bookingsForSelected.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ec-text-dim)" }}>Sin reservas este día.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bookingsForSelected.map((b) => {
                  const isCancelled = b.status === "cancelled";
                  const rc = ROOM_COLORS[b.room_id] ?? DEFAULT_ROOM_COLOR;
                  return (
                    <div key={b.id} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--ec-border)", background: isCancelled ? "var(--ec-surface-1)" : rc.bg, opacity: isCancelled ? 0.7 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: isCancelled ? "var(--ec-text-dim)" : rc.color }}>{ROOM_NAMES[b.room_id] ?? b.room_id}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {isCancelled && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(239,68,68,0.1)", color: "var(--ec-danger)" }}><XCircle size={10} />Cancelada</span>}
                          <SourceBadge source={b.source} />
                        </div>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ec-text)", textDecoration: isCancelled ? "line-through" : "none" }}>{b.full_name}</p>
                      <p style={{ fontSize: 12, color: "var(--ec-text-dim)" }}>
                        {parseDateLocal(b.check_in.slice(0, 10)).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} → {parseDateLocal(b.check_out.slice(0, 10)).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} · {b.nights}n
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, textAlign: "center", gap: 8 }}>
            <Calendar size={32} style={{ color: "var(--ec-text-dim)" }} />
            <p style={{ fontSize: 13, color: "var(--ec-text-dim)" }}>Selecciona un día para ver las reservas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatCard / EmptyState ─────────────────────────────────────────────────────
