"use client";

import React from "react";
import { ChevronUp, ChevronDown, Globe, Monitor } from "lucide-react";

export function SourceBadge({ source }: { source?: string }) {
  const isManual = source === "dashboard";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: isManual ? "rgba(168,85,247,0.12)" : "rgba(14,165,233,0.12)", color: isManual ? "#a855f7" : "#0ea5e9" }}>
      {isManual ? <Monitor size={11} /> : <Globe size={11} />}
      {isManual ? "Manual" : "Sitio web"}
    </span>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────

export function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  readOnly,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  min?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="ec-field-label" style={{ marginBottom: 4, display: "block" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        min={min}
        className="ec-field-input"
        style={readOnly ? { cursor: "default", opacity: 0.7 } : undefined}
      />
    </div>
  );
}

// ── BookingFormModal ──────────────────────────────────────────────────────────

export function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
      <span style={{ color: "var(--ec-text-muted)", minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--ec-text)", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

// ── CalendarView ──────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  iconStyle,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconStyle: React.CSSProperties;
  label: string;
  value: string | number;
}) {
  return (
    <div className="ec-project-card" style={{ padding: "14px 18px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ padding: 8, borderRadius: 8, flexShrink: 0, ...iconStyle }}>{icon}</div>
      <div>
        <p className="h-eyebrow" style={{ fontSize: 10, marginBottom: 2 }}>{label}</p>
        <p className="font-serif" style={{ fontSize: 26, color: "var(--ec-text)" }}>{value}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ padding: 16, background: "var(--ec-surface-2)", borderRadius: "50%", width: 64, height: 64, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--ec-text)", marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--ec-text-dim)" }}>{desc}</p>
    </div>
  );
}

// ── SortHeader ────────────────────────────────────────────────────────────────

export function SortHeader({
  label, field, sortField, sortDir, onSort,
}: {
  label: string; field: string; sortField: string; sortDir: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        textAlign: "left", padding: "10px 16px",
        fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: active ? "var(--ec-text)" : "var(--ec-text-dim)",
        cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <ChevronUp size={9} style={{ opacity: active && sortDir === "asc" ? 1 : 0.25, marginBottom: -1 }} />
          <ChevronDown size={9} style={{ opacity: active && sortDir === "desc" ? 1 : 0.25 }} />
        </div>
      </div>
    </th>
  );
}

// ── ICS export ───────────────────────────────────────────────────────────────
