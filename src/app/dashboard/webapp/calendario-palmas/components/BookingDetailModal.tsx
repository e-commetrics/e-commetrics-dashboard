"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, BedDouble, Mail, X, Ban, Pencil } from "lucide-react";
import { SourceBadge, DetailRow } from "./ui";
import { API_BASE_URL, ROOM_NAMES, ROOM_COLORS, DEFAULT_ROOM_COLOR, EXTRA_NAMES, EXTRA_PRICES } from "../constants";
import type { Booking } from "../types";
import { parseDateLocal } from "../utils";

export function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onEdit,
  onRefresh,
}: {
  booking: Booking;
  onClose: () => void;
  onCancel: (id: number) => void;
  onEdit: (booking: Booking) => void;
  onRefresh?: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [cancelling, setCancelling] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    modalRef.current?.scrollTo(0, 0);

  }, []);

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(booking.id);
    setCancelling(false);
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${booking.id}/send-reminder`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar recordatorio");
      }
      toast.success("Recordatorio enviado correctamente");
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar recordatorio";
      toast.error(msg);
    } finally {
      setSendingReminder(false);
    }
  };

  const checkInDate = new Date(booking.check_in);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  const canSendReminder = booking.status === "confirmed" && checkInDate >= today;

  const extrasTotal = booking.extras.reduce((s, e) => s + (EXTRA_PRICES[e] ?? 0), 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", padding: 16 }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="ec-project-card"
        style={{ borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--ec-border)" }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ec-text-dim)", fontFamily: "var(--font-jetbrains-mono, monospace)", marginBottom: 2 }}>
              #{booking.confirmation_number}
            </p>
            <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--ec-text)" }}>
              {booking.full_name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {booking.status === "confirmed" && (
              <>
                <button
                  onClick={() => onEdit(booking)}
                  className="ec-btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="ec-btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  {cancelling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Ban className="h-3.5 w-3.5" />
                  )}
                  Cancelar
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--ec-text-dim)" }}
              className="hover:bg-[var(--ec-surface-2)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {booking.status === "confirmed" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(16,185,129,0.12)", color: "var(--ec-success)" }}>
                <CheckCircle className="h-3 w-3" /> Confirmada
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: "rgba(239,68,68,0.12)", color: "var(--ec-danger)" }}>
                <XCircle className="h-3 w-3" /> Cancelada
              </span>
            )}
            {(() => { const rc = ROOM_COLORS[booking.room_id] ?? DEFAULT_ROOM_COLOR; return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, background: rc.bg, color: rc.color }}>
                <BedDouble className="h-3 w-3" />
                {ROOM_NAMES[booking.room_id] ?? booking.room_id}
              </span>
            ); })()}
            <SourceBadge source={booking.source} />
          </div>

          <div className="space-y-2">
            <DetailRow label="Email" value={booking.email} />
            <DetailRow label="Teléfono" value={booking.phone} />
            <DetailRow label="Cirujano" value={booking.certified_doctor} />
            {booking.special_requests && (
              <DetailRow label="Solicitudes" value={booking.special_requests} />
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 12, background: "var(--ec-surface-2)", borderRadius: 12 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "var(--ec-text-dim)", marginBottom: 2 }}>Check-in</p>
              <p style={{ fontWeight: 600, color: "var(--ec-text)", fontSize: 14 }}>
                {parseDateLocal(booking.check_in.slice(0, 10)).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <div style={{ textAlign: "center", borderLeft: "1px solid var(--ec-border)", borderRight: "1px solid var(--ec-border)" }}>
              <p style={{ fontSize: 11, color: "var(--ec-text-dim)", marginBottom: 2 }}>Noches</p>
              <p style={{ fontWeight: 600, color: "var(--ec-text)", fontSize: 14 }}>
                {booking.nights}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "var(--ec-text-dim)", marginBottom: 2 }}>Check-out</p>
              <p style={{ fontWeight: 600, color: "var(--ec-text)", fontSize: 14 }}>
                {parseDateLocal(booking.check_out.slice(0, 10)).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>

          {booking.extras.length > 0 && (
            <div>
              <p className="h-eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>Extras</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {booking.extras.map((e) => (
                  <div key={e} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--ec-surface-2)", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--ec-text-muted)" }}>{EXTRA_NAMES[e] ?? e}</span>
                    <span style={{ fontWeight: 500, color: "var(--ec-text)" }}>${EXTRA_PRICES[e] ?? 0}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--ec-text)" }}>
                  <span>Subtotal extras</span><span>${extrasTotal}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12 }}>
            <span style={{ fontWeight: 600, color: "var(--ec-warning)" }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ec-warning)" }}>${booking.total} USD</span>
          </div>

          {/* Reminder section */}
          <div style={{ padding: "12px 16px", background: "var(--ec-surface-2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail className="h-4 w-4" style={{ color: booking.reminder_sent_at ? "#10b981" : "var(--ec-text-dim)" }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ec-text)" }}>Recordatorio por correo</p>
                <p style={{ fontSize: 11, color: "var(--ec-text-dim)" }}>
                  {booking.reminder_sent_at
                    ? `Enviado ${new Date(booking.reminder_sent_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`
                    : canSendReminder ? "No enviado aún" : "No disponible"}
                </p>
              </div>
            </div>
            {canSendReminder && !booking.reminder_sent_at && (
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="ec-btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}
              >
                {sendingReminder ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {sendingReminder ? "Enviando..." : "Enviar ahora"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
