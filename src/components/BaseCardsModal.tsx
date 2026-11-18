"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import { addBaseCards, listMissingBaseCards, type BaseCard } from "@/lib/clients";

/**
 * Admin: muestra las cards base que le faltan a una pagina de cliente y agrega
 * las que queden marcadas. Solo inserta; no toca el contenido existente.
 */
export function BaseCardsModal({
  open,
  onClose,
  pageId,
  lang,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  pageId: number;
  lang: string;
  onAdded: () => void;
}) {
  const es = lang === "es";
  const [missing, setMissing] = useState<BaseCard[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listMissingBaseCards(pageId)
      .then((cards) => {
        if (!alive) return;
        setMissing(cards);
        setPicked(new Set(cards.map((c) => c.index)));
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Error"));
    return () => {
      alive = false;
    };
  }, [open, pageId]);

  // Se limpia al cerrar para que la siguiente apertura empiece en "Revisando…".
  const close = () => {
    setMissing(null);
    setError("");
    onClose();
  };

  const toggle = (index: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      await addBaseCards(pageId, Array.from(picked));
      onAdded();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && close()}
      title={es ? "Agregar cards base" : "Add base cards"}
      width={560}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={close}>
            {es ? "Cancelar" : "Cancel"}
          </button>
          {missing && missing.length > 0 ? (
            <button type="button" className="ec-btn-primary" onClick={confirm} disabled={saving || picked.size === 0}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {es ? `Agregar ${picked.size}` : `Add ${picked.size}`}
            </button>
          ) : null}
        </>
      }
    >
      {error ? (
        <div role="alert" style={{ fontSize: 13, color: "var(--ec-danger)", marginBottom: 10 }}>
          {error}
        </div>
      ) : null}
      {!missing && !error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ec-text-muted)" }}>
          <Loader2 size={14} className="animate-spin" /> {es ? "Revisando…" : "Checking…"}
        </div>
      ) : null}
      {missing && missing.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--ec-text-muted)" }}>
          {es ? "Este cliente ya tiene todas las cards base." : "This client already has every base card."}
        </div>
      ) : null}
      {missing && missing.length > 0 ? (
        <>
          <p style={{ fontSize: 12.5, color: "var(--ec-text-muted)", margin: "0 0 10px" }}>
            {es
              ? "Estas cards base no aparecen en esta página. Desmarca las que ya tenga con otro texto."
              : "These base cards are not on this page. Untick any it already has under other wording."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {missing.map((c) => (
              <label key={c.index} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={picked.has(c.index)} onChange={() => toggle(c.index)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ fontWeight: 600, color: "var(--ec-text)" }}>{c.content_1}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--ec-text-dim)" }}>{c.type}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}
    </Modal>
  );
}
