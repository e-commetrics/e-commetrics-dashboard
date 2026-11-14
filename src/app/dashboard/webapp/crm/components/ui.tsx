"use client";

// Piezas de interfaz compartidas por las pantallas del CRM.
//
// Se vive aqui y no en src/components/ui porque son especificas de esta webapp:
// el dashboard no tiene dialog, switch ni textarea, y anadir wrappers shadcn
// globales por una pantalla seria ensuciar la base de todos los dias.
//
// El Select si se reusa del dashboard: ya envuelve Radix con los
// onValueChange correctos y con el onChange de NextUI no se tropeza nadie mas.

import { useId } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X, AlertTriangle, Inbox } from "lucide-react";
// Workspace tambien usa estas piezas: sin este import, fuera del CRM el Modal sale sin estilos.
import "../crm.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Encabezado de pantalla ──────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="ec-page-header">
      <div>
        <div className="h-eyebrow" style={{ marginBottom: 6 }}>
          {eyebrow}
        </div>
        <h1 className="ec-page-title">{title}</h1>
        {subtitle ? <p className="ec-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** Panel con titulo. `hint` explica para que sirve cuando el titulo no alcanza. */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="crm-panel">
      <h2 className="crm-panel-title font-serif">{title}</h2>
      {hint ? <p className="crm-panel-hint">{hint}</p> : null}
      {children}
    </section>
  );
}

// ─── Estados de carga, error y vacio ─────────────────────────────────────────
// El CRM original no tenia ninguno de los tres: un fetch fallido dejaba la
// pantalla vacia sin decir nada. Estos tres son la diferencia entre "se rompio"
// y "aqui no hay nada".

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "48px 24px",
        color: "var(--ec-text-muted)",
        fontSize: 14,
        justifyContent: "center",
      }}
    >
      <Loader2 size={16} className="animate-spin" style={{ color: "var(--ec-brand)" }} />
      {label}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 18px",
        borderRadius: 12,
        background: "var(--ec-danger-soft)",
        border: "1px solid var(--ec-danger)",
        color: "var(--ec-text)",
      }}
    >
      <AlertTriangle size={17} style={{ color: "var(--ec-danger)", flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Could not load this data</div>
        <div style={{ fontSize: 13, color: "var(--ec-text-muted)", wordBreak: "break-word" }}>{message}</div>
      </div>
      {onRetry ? (
        <button type="button" className="ec-btn-secondary crm-btn-sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", color: "var(--ec-text-muted)" }}>
      {icon ?? <Inbox size={34} style={{ margin: "0 auto 14px", opacity: 0.35 }} />}
      <p style={{ fontSize: 14, color: "var(--ec-text)" }}>{title}</p>
      {hint ? (
        <p style={{ fontSize: 13, marginTop: 6, maxWidth: "46ch", marginInline: "auto" }}>{hint}</p>
      ) : null}
    </div>
  );
}

/** Aviso en linea para el resultado de una accion (sincronizar, importar, testear). */
export function InlineResult({
  tone,
  children,
}: {
  tone: "ok" | "error" | "muted";
  children: React.ReactNode;
}) {
  const color =
    tone === "ok" ? "var(--ec-success)" : tone === "error" ? "var(--ec-danger)" : "var(--ec-text-muted)";
  return (
    <p className="crm-result" style={{ color }}>
      {children}
    </p>
  );
}

// ─── Campos de formulario ────────────────────────────────────────────────────

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  // Con varias plantillas en pantalla se repite "Subject": el id no puede salir de la etiqueta.
  const id = useId();
  return (
    <div>
      <label className="ec-field-label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        className="ec-field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const id = useId();
  const area = (
    <textarea
      id={id}
      aria-label={label ? undefined : placeholder}
      className="ec-field-input"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      style={mono ? { fontFamily: "var(--font-montserrat), monospace", fontSize: 13 } : undefined}
    />
  );

  if (!label) return area;
  return (
    <div>
      <label className="ec-field-label" htmlFor={id}>
        {label}
      </label>
      {area}
    </div>
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Select sobre el wrapper de Radix del dashboard. Todo el CRM pasa por aqui, de
 * forma que si Radix se rompe por una version solo hay un archivo que arreglar.
 *
 * `value` vacio significa "sin elegir": con "" Radix muestra el placeholder.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Choose…",
  disabled,
  width,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  width?: number | string;
  /** Sin etiqueta visible, para filas donde el contexto ya la da. Sigue en aria-label. */
  hideLabel?: boolean;
}) {
  return (
    <div style={{ width, flexShrink: 0 }}>
      {hideLabel ? null : <span className="ec-field-label">{label}</span>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          aria-label={label}
          className="ec-field-input"
          style={{ width: "100%", cursor: disabled ? "not-allowed" : "pointer" }}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {/* z-[60]: el Modal usa z-index 50/51 y el SelectContent base 50; sin esto la
            lista se abre detras del modal (Template en "Send message" sale vacio). */}
        <SelectContent className="z-[60]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Interruptor sin dependencias: un boton con role="switch". */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 40,
        height: 22,
        borderRadius: 999,
        border: "1px solid var(--ec-hairline-strong)",
        background: checked ? "var(--ec-brand)" : "var(--ec-surface-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 150ms",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 150ms",
        }}
      />
    </button>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="crm-modal-overlay" />
        <Dialog.Content
          className="crm-app crm-modal"
          aria-describedby={undefined}
          style={{ width: `min(${width}px, calc(100vw - 24px))` }}
        >
          <div className="crm-modal-head">
            <Dialog.Title className="crm-modal-title font-serif">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="crm-icon-btn">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="crm-modal-body">{children}</div>
          {footer ? <div className="crm-modal-foot">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Tarjeta de dato ─────────────────────────────────────────────────────────

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const color =
    tone === "danger"
      ? "var(--ec-danger)"
      : tone === "success"
        ? "var(--ec-success)"
        : tone === "warning"
          ? "var(--ec-warning)"
          : "var(--ec-text)";

  return (
    <div className={cn("ec-stat-tile", tone === "danger" && "is-danger")}>
      <div className="ec-stat-tile-label">{label}</div>
      <div className="ec-stat-tile-num" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {tone === "default" ? null : <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} aria-hidden />}
        {value}
      </div>
    </div>
  );
}

/** Badge con los tonos del sistema de diseno. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  return (
    <span
      className={cn(
        "ec-badge",
        tone === "neutral" && "ec-badge-neutral",
        tone === "success" && "ec-badge-success",
        tone === "warning" && "ec-badge-warning",
        tone === "danger" && "ec-badge-danger",
        tone === "brand" && "ec-badge-brand"
      )}
    >
      {children}
    </span>
  );
}
