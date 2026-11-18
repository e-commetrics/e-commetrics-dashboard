"use client";

import { useId, useRef, useState } from "react";
import { activeMentionQuery, insertMention } from "../lib/mentions";
import type { Member } from "../lib/types";
import { Avatar } from "./shared";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Textarea o input con la lista de "@" del equipo. Con la lista abierta,
 * flechas mueven, Enter/Tab eligen y Escape cierra (Enter no envía el form).
 */
export function MentionField({
  value,
  onChange,
  members,
  multiline,
  placeholder,
  ariaLabel,
  rows = 3,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  members: Member[];
  multiline?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  rows?: number;
  style?: React.CSSProperties;
}) {
  const listId = useId();
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const team = members.filter((m) => m.role !== "client");
  const matches = mention ? team.filter((m) => fold(m.name).includes(fold(mention.query))).slice(0, 6) : [];
  const open = matches.length > 0;

  const sync = (text: string, caret: number) => {
    const next = activeMentionQuery(text, caret);
    setMention(next);
    if (next?.query !== mention?.query) setActive(0);
  };

  const pick = (member: Member) => {
    const el = ref.current;
    if (!el || !mention) return;
    const caret = el.selectionStart ?? value.length;
    // Si el cursor ya no esta en una mencion, no se reemplaza nada (evita borrar texto).
    const current = activeMentionQuery(value, caret);
    if (!current) return setMention(null);
    const next = insertMention(value, current.start, caret, member.name);
    onChange(next.text);
    setMention(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  };

  const common = {
    ref,
    className: "ec-field-input",
    value,
    placeholder,
    "aria-label": ariaLabel,
    role: "combobox" as const,
    "aria-expanded": open,
    "aria-controls": listId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": open ? `${listId}-${active}` : undefined,
    style,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(e.target.value);
      sync(e.target.value, e.target.selectionStart ?? e.target.value.length);
    },
    // onSelect cubre clic, flechas, Home/End: la mencion activa siempre es la del cursor.
    onSelect: (e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      sync(e.currentTarget.value, e.currentTarget.selectionStart ?? 0),
    onBlur: () => setTimeout(() => setMention(null), 120),
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setActive((i) => (i + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          pick(matches[Math.min(active, matches.length - 1)]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMention(null);
          return;
        }
      }
    },
  };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      {multiline ? <textarea rows={rows} {...common} /> : <input {...common} />}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Mencionar"
          style={{
            position: "absolute",
            zIndex: 30,
            left: 0,
            top: "calc(100% + 4px)",
            minWidth: 220,
            margin: 0,
            padding: 4,
            listStyle: "none",
            background: "var(--ec-surface-1)",
            border: "1px solid var(--ec-hairline-strong)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          }}
        >
          {matches.map((m, i) => (
            <li
              key={m.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                background: i === active ? "var(--ec-surface-2)" : "transparent",
              }}
            >
              <Avatar member={m} size={22} />
              <span style={{ fontWeight: 600 }}>{m.name}</span>
              {m.title ? <span style={{ color: "var(--ec-text-muted)", fontSize: 12 }}>{m.title}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
