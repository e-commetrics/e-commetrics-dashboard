"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, X } from "lucide-react";
import { FormField } from "./ui";
import { API_BASE_URL, ROOM_NAMES, ROOM_COLORS, DEFAULT_ROOM_COLOR, ROOM_PRICES, EXTRA_NAMES, EXTRA_PRICES } from "../constants";
import type { Booking, FormData } from "../types";
import { parseDateLocal, dateToInputStr } from "../utils";

export function BookingFormModal({
  booking,
  defaultDate,
  defaultRoom,
  onClose,
  onSuccess,
}: {
  booking: Booking | null;
  defaultDate?: string;
  defaultRoom?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEdit = booking !== null;

  useEffect(() => {
    modalRef.current?.scrollTo(0, 0);

  }, []);

  const [form, setForm] = useState<FormData>(() => {
    if (booking) {
      return {
        roomId: booking.room_id,
        fullName: booking.full_name,
        email: booking.email,
        phone: booking.phone,
        certifiedDoctor: booking.certified_doctor,
        checkIn: booking.check_in.slice(0, 10),
        checkOut: booking.check_out.slice(0, 10),
        guests: String(booking.guests),
        pricePerNight: String(booking.price_per_night),
        extras: Array.isArray(booking.extras) ? booking.extras : [],
        specialRequests: booking.special_requests ?? "",
        total: String(booking.total),
        manualTotal: false,
      };
    }
    return {
      roomId: defaultRoom ?? "",
      fullName: "",
      email: "",
      phone: "",
      certifiedDoctor: "",
      checkIn: defaultDate ?? "",
      checkOut: "",
      guests: "1",
      pricePerNight: "",
      extras: [],
      specialRequests: "",
      total: "",
      manualTotal: false,
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  interface PromoApplied {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    applies_to: "all" | "room" | "extra" | "targets";
    target_ids: string[] | null;
    targets?: { type: "room" | "extra"; id: string; discount: number }[] | null;
  }

  const [promoApplied, setPromoApplied] = useState<PromoApplied | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const todayStr = useMemo(() => dateToInputStr(new Date()), []);

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff =
      parseDateLocal(form.checkOut).getTime() -
      parseDateLocal(form.checkIn).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }, [form.checkIn, form.checkOut]);

  const baseTotal = useMemo(() => {
    const extTotal = form.extras.reduce((s, e) => s + (EXTRA_PRICES[e] ?? 0), 0);
    return nights * Number(form.pricePerNight || 0) + extTotal;
  }, [nights, form.pricePerNight, form.extras]);

  const discountAmount = useMemo(() => {
    if (!promoApplied) return 0;

    // Targets mode: sum individual discounts per item
    if (promoApplied.applies_to === "targets" && promoApplied.targets) {
      let total = 0;
      const roomCost = nights * Number(form.pricePerNight || 0);
      for (const t of promoApplied.targets) {
        if (t.type === "room") {
          total += Math.round(roomCost * t.discount / 100);
        } else if (t.type === "extra" && form.extras.includes(t.id)) {
          total += Math.round((EXTRA_PRICES[t.id] ?? 0) * t.discount / 100);
        }
      }
      return total;
    }

    let applicableBase = baseTotal;

    if (promoApplied.applies_to === "room") {
      const roomCost = nights * Number(form.pricePerNight || 0);
      applicableBase = roomCost;
    } else if (promoApplied.applies_to === "extra") {
      const targetedExtrasTotal = form.extras
        .filter((id) => promoApplied.target_ids?.includes(id))
        .reduce((s, id) => s + (EXTRA_PRICES[id] ?? 0), 0);
      applicableBase = targetedExtrasTotal;
    }

    if (promoApplied.discount_type === "percentage") {
      return Math.round(applicableBase * promoApplied.discount_value / 100);
    }
    return Math.min(promoApplied.discount_value, applicableBase);
  }, [promoApplied, baseTotal, form.extras, form.pricePerNight, nights]);

  const autoTotal = useMemo(() => baseTotal - discountAmount, [baseTotal, discountAmount]);

  useEffect(() => {
    if (!form.manualTotal) {
      setForm((f) => ({ ...f, total: String(autoTotal) }));
    }
  }, [autoTotal, form.manualTotal]);


  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(`${API_BASE_URL}/promo-codes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.reason ?? "Código inválido");
        return;
      }
      setPromoApplied({
        code: promoCode.trim().toUpperCase(),
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        applies_to: data.applies_to || "all",
        target_ids: data.target_ids || null,
        targets: data.targets || null,
      });
      setPromoCode("");
      setPromoError("");
      setForm((f) => ({ ...f, manualTotal: false }));
    } catch {
      setPromoError("Error al validar el código");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setForm((f) => ({ ...f, manualTotal: false }));
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleExtra = (id: string) =>
    setForm((f) => ({
      ...f,
      extras: f.extras.includes(id)
        ? f.extras.filter((e) => e !== id)
        : [...f.extras, id],
      manualTotal: false,
    }));

  const extrasTotal = form.extras.reduce((s, e) => s + (EXTRA_PRICES[e] ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.roomId ||
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.certifiedDoctor ||
      !form.checkIn ||
      !form.checkOut
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    if (nights <= 0) {
      toast.error("La fecha de salida debe ser posterior a la de entrada");
      return;
    }
    if (!isEdit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parseDateLocal(form.checkIn) < today) {
        toast.error("No puedes crear una reserva con fecha anterior a hoy");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch(`${API_BASE_URL}/api/bookings/${booking!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: form.roomId,
            check_in: form.checkIn,
            check_out: form.checkOut,
            nights,
            guests: Number(form.guests),
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            certified_doctor: form.certifiedDoctor,
            special_requests: form.specialRequests || null,
            extras: form.extras,
            total: Number(form.total),
            price_per_night: Number(form.pricePerNight),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Error al editar");
        }
        toast.success("Reserva actualizada");
      } else {
        const res = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: form.roomId,
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            nights,
            guests: Number(form.guests),
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            certifiedDoctor: form.certifiedDoctor,
            specialRequests: form.specialRequests || null,
            extras: form.extras,
            total: Number(form.total),
            pricePerNight: Number(form.pricePerNight),
            source: "dashboard",
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Error al crear");
        }
        toast.success("Reserva creada exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", padding: 16 }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="ec-project-card"
        style={{ borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--ec-border)", position: "sticky", top: 0, background: "var(--ec-surface-1)", zIndex: 10, borderRadius: "16px 16px 0 0" }}>
          <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--ec-text)" }}>
            {isEdit ? "Editar Reserva" : "Nueva Reserva"}
          </h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--ec-text-dim)" }}
            className="hover:bg-[var(--ec-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Room */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Habitación *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(ROOM_NAMES).map(([id, name]) => {
                const rc = ROOM_COLORS[id] ?? DEFAULT_ROOM_COLOR;
                const isSelected = form.roomId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setField("roomId", id); if (!isEdit) setForm((f) => ({ ...f, roomId: id, pricePerNight: String(ROOM_PRICES[id] ?? ""), manualTotal: false })); }}
                    style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${isSelected ? rc.color : "var(--ec-border)"}`, background: isSelected ? rc.bg : "transparent", color: isSelected ? rc.color : "var(--ec-text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 140ms", textAlign: "center" }}
                  >{name}</button>
                );
              })}
            </div>
          </div>

          {/* Guest info */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Datos del huésped</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="Nombre completo *"
                value={form.fullName}
                onChange={(v) => setField("fullName", v)}
                placeholder="Jane Doe"
              />
              <FormField
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => setField("email", v)}
                placeholder="jane@email.com"
              />
              <FormField
                label="Teléfono *"
                value={form.phone}
                onChange={(v) => setField("phone", v)}
                placeholder="+1 (619) 000-0000"
              />
              <FormField
                label="Cirujano certificado *"
                value={form.certifiedDoctor}
                onChange={(v) => setField("certifiedDoctor", v)}
                placeholder="Dr. García"
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Fechas *</label>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Check-in"
                type="date"
                value={form.checkIn}
                onChange={(v) => setField("checkIn", v)}
                min={!isEdit ? todayStr : undefined}
              />
              <FormField
                label="Check-out"
                type="date"
                value={form.checkOut}
                onChange={(v) => setField("checkOut", v)}
                min={form.checkIn || (!isEdit ? todayStr : undefined)}
              />
              <FormField
                label="Noches (auto)"
                value={nights > 0 ? String(nights) : ""}
                readOnly
                placeholder="—"
              />
            </div>

          </div>

          {/* Pricing */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Precios</label>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Huéspedes" type="number" min="1" value={form.guests} onChange={(v) => setField("guests", v)} />
              <FormField label="Precio / noche ($)" type="number" min="0" value={form.pricePerNight} onChange={(v) => { setField("pricePerNight", v); setField("manualTotal", false); }} placeholder="0" />
              <div>
                <label className="ec-field-label" style={{ marginBottom: 4, display: "block" }}>
                  Total ($) {!form.manualTotal && <span style={{ fontWeight: 400, opacity: 0.6 }}>(auto)</span>}
                </label>
                <input type="number" min="0" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value, manualTotal: true }))} className="ec-field-input" />
              </div>
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Extras</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(EXTRA_NAMES).map(([id, name]) => {
                const checked = form.extras.includes(id);
                return (
                  <label key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: `1px solid ${checked ? "rgba(245,158,11,0.4)" : "var(--ec-border)"}`, background: checked ? "rgba(245,158,11,0.07)" : "transparent", cursor: "pointer", transition: "all 140ms" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleExtra(id)} style={{ width: 16, height: 16, accentColor: "#f59e0b", cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--ec-text)", flex: 1, lineHeight: 1.3 }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ec-text-dim)", flexShrink: 0 }}>${EXTRA_PRICES[id]}</span>
                  </label>
                );
              })}
            </div>
            {form.extras.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--ec-text-dim)", marginTop: 6 }}>Subtotal extras: <strong style={{ color: "var(--ec-text)" }}>${extrasTotal}</strong></p>
            )}
          </div>

          {/* Promo code */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 8, display: "block" }}>Código promocional</label>
            {promoApplied ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: "#10b981" }}>{promoApplied.code}</span>
                  <span style={{ color: "#10b981" }}>— {promoApplied.discount_type === "percentage" ? `${promoApplied.discount_value}% de descuento` : `$${promoApplied.discount_value} de descuento`}</span>
                </div>
                <button type="button" onClick={removePromo} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#10b981", display: "flex" }}><X size={14} /></button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())} placeholder="CÓDIGO" className="ec-field-input" style={{ flex: 1, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }} />
                <button type="button" onClick={applyPromo} disabled={!promoCode.trim() || promoLoading} className="ec-btn-secondary" style={{ padding: "8px 16px", opacity: !promoCode.trim() || promoLoading ? 0.5 : 1 }}>
                  {promoLoading && <Loader2 size={13} className="animate-spin" />}
                  Aplicar
                </button>
              </div>
            )}
            {promoError && (
              <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                <XCircle size={12} style={{ flexShrink: 0 }} /> {promoError}
              </p>
            )}
            {promoApplied && discountAmount > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-hairline)", display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ec-text-muted)" }}><span>Subtotal</span><span>${baseTotal}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}><span>Descuento ({promoApplied.discount_type === "percentage" ? `${promoApplied.discount_value}%` : `$${promoApplied.discount_value}`})</span><span>-${discountAmount}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--ec-text)", paddingTop: 4, borderTop: "1px solid var(--ec-hairline)" }}><span>Total con descuento</span><span>${autoTotal}</span></div>
              </div>
            )}
          </div>

          {/* Special requests */}
          <div>
            <label className="ec-field-label" style={{ marginBottom: 4, display: "block" }}>Solicitudes especiales</label>
            <textarea value={form.specialRequests} onChange={(e) => setField("specialRequests", e.target.value)} rows={2} placeholder="Requerimientos especiales..." className="ec-field-input" style={{ resize: "none" }} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--ec-hairline)" }}>
            <button type="button" onClick={onClose} className="ec-btn-secondary" style={{ padding: "8px 16px" }}>Cancelar</button>
            <button type="submit" disabled={submitting} className="ec-btn-primary" style={{ padding: "8px 20px", opacity: submitting ? 0.7 : 1 }}>
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── BookingDetailModal ────────────────────────────────────────────────────────
