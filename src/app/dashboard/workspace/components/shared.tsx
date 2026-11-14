"use client";

// Piezas pequenas del espacio de trabajo. Las genericas (Modal, Loading,
// campos...) se reusan del CRM: ../../webapp/crm/components/ui. Si un tercer
// modulo las necesita, conviene moverlas a src/components.

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Flag, Plus, Tag, UserPlus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "../lib/hooks";
import { PRIORITY_META, TASK_STATUS_META, useT } from "../lib/i18n";
import type { Member, Priority, TaskStatus } from "../lib/types";

const AVATAR_COLORS = ["var(--ec-d1)", "var(--ec-d2)", "var(--ec-d3)", "var(--ec-d4)", "var(--ec-d5)", "var(--ec-d6)"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ member, size = 26 }: { member: Member | undefined; size?: number }) {
  if (!member) return null;
  const color = colorFor(member.id);
  return (
    <span
      title={member.title ? `${member.name} · ${member.title}` : member.name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(8, Math.round(size * 0.34)),
        boxSizing: "content-box",
        letterSpacing: 0,
        fontWeight: 700,
        background: `color-mix(in srgb, ${color} 14%, var(--ec-surface-2))`,
        color: "var(--ec-text-muted)",
        border: "2px solid var(--ec-surface-1)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials(member.name)
      )}
    </span>
  );
}

export function AvatarStack({ ids, max = 4, size = 24 }: { ids: string[]; max?: number; size?: number }) {
  const { memberById } = useWorkspace();
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i === 0 ? 0 : -7 }}>
          <Avatar member={memberById(id)} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span style={{ marginLeft: 4, fontSize: 11, color: "var(--ec-text-muted)" }}>+{rest}</span>
      ) : null}
    </span>
  );
}

export function StatusDot({ status }: { status: TaskStatus }) {
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 3,
        background: TASK_STATUS_META[status].color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function StatusPill({ status }: { status: TaskStatus }) {
  const { lang } = useT();
  const meta = TASK_STATUS_META[status];
  return (
    <span className={`ec-badge ${meta.badge}`}>
      <span className={`ec-glyph ${meta.glyph}`} aria-hidden />
      {meta[lang]}
    </span>
  );
}

export function PriorityFlag({ priority, showLabel }: { priority: Priority; showLabel?: boolean }) {
  const { lang } = useT();
  const meta = PRIORITY_META[priority];
  return (
    <span
      title={meta[lang]}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ec-text-muted)", fontSize: 12 }}
    >
      <Flag size={13} color={meta.color} fill={priority === "low" || priority === "normal" ? "none" : meta.color} />
      {showLabel ? meta[lang] : null}
    </span>
  );
}

export function DueDate({ date, done }: { date: string | null; done?: boolean }) {
  const { lang } = useT();
  if (!date) return null;
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  const overdue = !done && diff < 0;
  const soon = !done && diff >= 0 && diff <= 2;
  const base =
    diff === 0
      ? lang === "es" ? "Hoy" : "Today"
      : diff === 1
        ? lang === "es" ? "Mañana" : "Tomorrow"
        : d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short" });
  // An overdue date says so in words: colour alone is not the signal.
  const label = overdue ? `${base} · ${lang === "es" ? "vencida" : "overdue"}` : base;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        color: overdue ? "var(--ec-danger)" : soon ? "var(--ec-warning)" : "var(--ec-text-muted)",
        fontWeight: overdue ? 600 : 400,
      }}
    >
      <Calendar size={12} />
      {label}
    </span>
  );
}

export function ProgressBar({ done, total, color = "var(--ec-brand-fill)" }: { done: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="ec-progress" aria-label={`${pct}%`}>
      <div className="ec-progress-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Selector multiple de personas. `pool` limita a quien se puede elegir. */
export function MemberPicker({
  value,
  onChange,
  pool,
  label,
  compact,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  pool: Member[];
  label?: string;
  compact?: boolean;
}) {
  const { t } = useT();
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={compact ? undefined : "ec-field-input"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            textAlign: "left",
            minHeight: compact ? undefined : 42,
            background: compact ? "none" : undefined,
            border: compact ? "none" : undefined,
            padding: compact ? 0 : undefined,
          }}
        >
          {value.length > 0 ? (
            <AvatarStack ids={value} max={compact ? 3 : 6} />
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ec-text-muted)", fontSize: 13 }}>
              <UserPlus size={14} />
              {label ?? t("Asignar", "Assign")}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[70]" style={{ minWidth: 240, maxHeight: 320, overflowY: "auto" }}>
        <DropdownMenuLabel>{label ?? t("Personas", "People")}</DropdownMenuLabel>
        {pool.map((m) => (
          <DropdownMenuCheckboxItem
            key={m.id}
            checked={value.includes(m.id)}
            onCheckedChange={() => toggle(m.id)}
            onSelect={(e) => e.preventDefault()}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar member={m} size={22} />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13 }}>{m.name}</span>
                {m.title ? <span style={{ fontSize: 11, color: "var(--ec-text-muted)" }}>{m.title}</span> : null}
              </span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Casilla redonda para completar una (sub)tarea con un clic. */
export function CompleteToggle({
  done,
  onToggle,
  size = 18,
}: {
  done: boolean;
  onToggle: () => void;
  size?: number;
}) {
  const { t } = useT();
  return (
    <button
      type="button"
      aria-label={done ? t("Marcar pendiente", "Mark as not done") : t("Marcar hecha", "Mark as done")}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1.5px solid ${done ? "#22c55e" : "var(--ec-hairline-strong)"}`,
        background: done ? "#22c55e" : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {done ? <Check size={size - 6} color="#fff" strokeWidth={3} /> : null}
    </button>
  );
}

export function employeesOf(members: Member[]) {
  return members.filter((m) => m.role !== "client");
}
export function clientsOf(members: Member[]) {
  return members.filter((m) => m.role === "client");
}

// ─── Etiquetas ───────────────────────────────────────────────────────────────

const LABEL_COLORS = ["var(--ec-d1)", "var(--ec-d2)", "var(--ec-d3)", "var(--ec-d4)", "var(--ec-d5)", "var(--ec-d6)"];

/** Color estable por nombre: la misma etiqueta se ve igual en todas partes. */
export function labelColor(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}

export function LabelChip({ name, onRemove, small }: { name: string; onRemove?: () => void; small?: boolean }) {
  // Chip neutro con un punto de color: la etiqueta se reconoce sin competir con los estados.
  const color = "var(--ec-text-muted)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "1px 7px" : "2px 9px",
        borderRadius: 99,
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        lineHeight: 1.5,
        color,
        background: "var(--ec-surface-2)",
        border: "1px solid var(--ec-hairline-strong)",
        whiteSpace: "nowrap",
        maxWidth: 160,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: labelColor(name), flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Quitar ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color, lineHeight: 0 }}
        >
          <X size={11} />
        </button>
      ) : null}
    </span>
  );
}

export function LabelList({ labels, small }: { labels: string[]; small?: boolean }) {
  if (!labels?.length) return null;
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
      {labels.map((l) => (
        <LabelChip key={l} name={l} small={small} />
      ))}
    </span>
  );
}

/**
 * Selector de etiquetas: marca las existentes o escribe una nueva y pulsa Enter.
 * Es un panel propio (no un DropdownMenu) para que el campo de texto funcione
 * dentro del modal de la tarea.
 */
export function LabelPicker({ value, onChange, suggestions }: { value: string[]; onChange: (next: string[]) => void; suggestions: string[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const all = Array.from(new Set([...suggestions, ...value])).sort((a, b) => a.localeCompare(b));
  const q = query.trim();
  const shown = all.filter((l) => l.toLowerCase().includes(q.toLowerCase()));
  const match = all.find((l) => l.toLowerCase() === q.toLowerCase());
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((x) => x !== name) : [...value, name]);
  const submit = () => {
    if (!q) return;
    if (match) {
      if (!value.includes(match)) onChange([...value, match]);
    } else onChange([...value, q.slice(0, 60)]);
    setQuery("");
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div className="ec-field-input" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minHeight: 42 }}>
        {value.map((l) => (
          <LabelChip key={l} name={l} onRemove={() => toggle(l)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "none", padding: "2px 4px", cursor: "pointer", color: "var(--ec-text-muted)", fontSize: 13 }}
        >
          <Tag size={13} />
          {value.length ? t("Editar", "Edit") : t("Agregar etiqueta", "Add label")}
        </button>
      </div>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 80,
            width: 280,
            maxHeight: 320,
            overflowY: "auto",
            background: "var(--ec-surface-1)",
            border: "1px solid var(--ec-hairline-strong)",
            borderRadius: 10,
            boxShadow: "var(--ec-shadow-lg)",
            padding: 6,
          }}
        >
          <input
            autoFocus
            className="ec-field-input"
            style={{ padding: "6px 10px", fontSize: 13, marginBottom: 4 }}
            placeholder={t("Buscar o crear…", "Search or create…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                setQuery("");
              }
            }}
          />
          {shown.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggle(l)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", border: "none", borderRadius: 6, background: "none", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ width: 14, display: "inline-flex", color: "var(--ec-brand)" }}>{value.includes(l) ? <Check size={14} /> : null}</span>
              <LabelChip name={l} small />
            </button>
          ))}
          {q && !match ? (
            <button
              type="button"
              onClick={submit}
              style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "7px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "var(--ec-brand)", textAlign: "left" }}
            >
              <Plus size={13} /> {t("Crear", "Create")} “{q}”
            </button>
          ) : null}
          {!shown.length && !q ? (
            <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ec-text-muted)" }}>{t("Escribe para crear la primera etiqueta.", "Type to create the first label.")}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
