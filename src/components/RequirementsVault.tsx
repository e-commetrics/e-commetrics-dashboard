"use client";

import { useEffect, useState } from "react";
import { Check, Copy, GripVertical, Loader2, Plus, RotateCcw, Settings2, ShieldCheck, Star, Trash2 } from "lucide-react";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import {
  DEFAULT_INFO,
  DEFAULT_INFO2,
  DEFAULT_VAULT_SETTINGS,
  addCustomRequirement,
  deleteCustomRequirement,
  getVaultSettings,
  listRequirements,
  moveCustomRequirement,
  requiredKeys,
  requirementProgress,
  saveRequirement,
  saveVaultSettings,
  vaultSettingsError,
  withCustom,
  type CustomRequirement,
  type RequirementItem,
  type RequirementSection,
  type RequirementRow,
  type RequirementStatus,
  type VaultSettings,
} from "@/lib/requirements";

type Rows = Record<string, RequirementRow>;

const STATUS_META: Record<RequirementStatus, { badge: string; glyph: string; es: string; en: string }> = {
  pending: { badge: "ec-badge-neutral", glyph: "ec-glyph-idle", es: "Pendiente", en: "Pending" },
  sent: { badge: "ec-badge-warning", glyph: "ec-glyph-warn", es: "Enviado", en: "Sent" },
  verified: { badge: "ec-badge-success", glyph: "ec-glyph-ok", es: "Verificado", en: "Verified" },
  skipped: { badge: "ec-badge-neutral", glyph: "ec-glyph-idle", es: "Quitado", en: "Removed" },
};

function StatusBadge({ status, es }: { status: RequirementStatus; es: boolean }) {
  const m = STATUS_META[status];
  return (
    <span className={`ec-badge ${m.badge}`}>
      <span className={`ec-glyph ${m.glyph}`} aria-hidden /> {es ? m.es : m.en}
    </span>
  );
}

function CopyValue({ value, copiedLabel }: { value: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }, () => {});
  return (
    <button type="button" className="ec-vault-copy" onClick={copy}>
      <span className="ec-num">{value}</span>
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span className="sr-only" aria-live="polite">{copied ? copiedLabel : ""}</span>
    </button>
  );
}

/**
 * Tarjeta de resguardo en la portada del cliente: resumen arriba a la derecha y, al abrirla,
 * la hoja "Requerimientos" con el estado de cada acceso. Al llenar información pasa a "Enviado";
 * el equipo verifica. Nunca guarda contraseñas.
 */
export function RequirementsVault({
  projectId,
  isTeam,
  isAdmin,
  lang,
}: {
  projectId: number;
  isTeam: boolean;
  isAdmin: boolean;
  lang: string;
}) {
  const es = lang === "es";
  const [rows, setRows] = useState<Rows | null>(null);
  const [custom, setCustom] = useState<CustomRequirement[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_VAULT_SETTINGS);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listRequirements(projectId)
      .then((r) => {
        if (!alive) return;
        setRows(r.rows);
        setCustom(r.custom);
      })
      .catch(() => alive && setLoadError(true));
    // Sin ajustes guardados (o si falla) se quedan los valores por defecto.
    getVaultSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId]);

  const sections = withCustom(custom);
  const progress = requirementProgress(rows ?? {}, requiredKeys(sections));
  const statusOf = (key: string): RequirementStatus => rows?.[key]?.status ?? "pending";
  const adStatus = statusOf("meta_ad_account");
  const nextUp = sections.filter((s) => !s.optional)
    .flatMap((s) => s.items)
    .filter((i) => statusOf(i.key) === "pending")
    .slice(0, 3);
  const verifiedPct = progress.total ? (progress.verified / progress.total) * 100 : 0;
  const sentPct = progress.total ? (progress.sent / progress.total) * 100 : 0;

  return (
    <section className="ec-hcard ec-vault" aria-labelledby="ec-vault-title">
      <header>
        <h2 id="ec-vault-title">
          <ShieldCheck size={15} aria-hidden /> {es ? "Tarjeta de resguardo" : "Safekeeping card"}
        </h2>
        {isAdmin ? (
          <button type="button" className="ec-vault-config" onClick={() => setConfigOpen(true)}>
            <Settings2 size={14} aria-hidden /> {es ? "Configurar" : "Settings"}
          </button>
        ) : (
          <span>Smart&amp;Safe</span>
        )}
      </header>

      <div className="ec-vault-body">
        {loadError ? (
          <p className="ec-vault-muted">
            {es ? "No se pudo cargar el avance de accesos. Recarga la página." : "Could not load the access progress. Reload the page."}
          </p>
        ) : !rows ? (
          <p className="ec-vault-muted">
            <Loader2 size={14} className="animate-spin" /> {es ? "Cargando…" : "Loading…"}
          </p>
        ) : (
          <>
            <div>
              <div className="ec-vault-count">
                <b className="ec-num">{progress.verified}</b>
                <span>
                  {es ? `de ${progress.total} accesos verificados` : `of ${progress.total} access items verified`}
                  {progress.sent ? (es ? `, ${progress.sent} en revisión` : `, ${progress.sent} in review`) : ""}
                </span>
              </div>
              <div
                className="ec-vault-bar"
                role="img"
                aria-label={es ? `${progress.verified} verificados y ${progress.sent} enviados de ${progress.total}` : `${progress.verified} verified and ${progress.sent} sent of ${progress.total}`}
              >
                <i style={{ width: `${verifiedPct}%` }} />
                <i className="is-sent" style={{ width: `${sentPct}%` }} />
              </div>
            </div>

            {settings.clientNote ? <p className="ec-vault-note">{settings.clientNote}</p> : null}

            <dl className="ec-vault-ids">
              <div>
                <dt>{es ? "Agréganos como Partner en Meta con este Business ID" : "Add us as a Meta partner with this Business ID"}</dt>
                <dd><CopyValue value={settings.metaBusinessId} copiedLabel={es ? "ID copiado" : "ID copied"} /></dd>
              </div>
              <div>
                <dt>{es ? "Agrega este correo como usuario en Google" : "Add this email as a user in Google"}</dt>
                <dd><CopyValue value={settings.googleEmail} copiedLabel={es ? "Correo copiado" : "Email copied"} /></dd>
              </div>
            </dl>

            {adStatus !== "verified" && adStatus !== "skipped" ? (
              <p className="ec-vault-priority">
                <Star size={13} aria-hidden />
                {es ? "Prioritario: compartir la cuenta publicitaria de Meta." : "Priority: share the Meta ad account."}
              </p>
            ) : null}

            {nextUp.length ? (
              <div>
                <div className="ec-vault-sub">{es ? "Siguientes pendientes" : "Next pending"}</div>
                <ul className="ec-vault-next">
                  {nextUp.map((i) => (
                    <li key={i.key}>{es ? i.es : i.en}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        <button type="button" className="ec-btn-primary" onClick={() => setOpen(true)} disabled={!rows}>
          {es ? "Abrir hoja de requerimientos" : "Open requirements sheet"}
        </button>
      </div>

      {rows ? (
        <Modal open={open} onOpenChange={setOpen} title={es ? "Requerimientos" : "Requirements"} width={1080}>
          <RequirementsSheet
            projectId={projectId}
            isTeam={isTeam}
            isAdmin={isAdmin}
            es={es}
            rows={rows}
            sections={sections}
            settings={settings}
            onRow={(r) => setRows((p) => ({ ...p, [r.key]: r }))}
            onCustom={setCustom}
          />
        </Modal>
      ) : null}

      {/* Se monta solo abierto: cada apertura parte de lo guardado. */}
      {isAdmin && configOpen ? (
        <VaultSettingsModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          es={es}
          current={settings}
          onSaved={setSettings}
        />
      ) : null}
    </section>
  );
}

/** Admin: datos globales que ven todos los clientes en su tarjeta y en la hoja. */
function VaultSettingsModal({
  open,
  onClose,
  es,
  current,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  es: boolean;
  current: VaultSettings;
  onSaved: (s: VaultSettings) => void;
}) {
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const invalid = vaultSettingsError(draft);

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    setError("");
    try {
      onSaved(await saveVaultSettings(draft));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof VaultSettings) => ({
    value: draft[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [name]: e.target.value })),
    "aria-invalid": invalid === name || undefined,
    "aria-describedby": `vault-${name}-hint`,
    id: `vault-${name}`,
    className: "ec-field-input",
  });

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={es ? "Configurar tarjeta de resguardo" : "Safekeeping card settings"}
      width={520}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={onClose}>
            {es ? "Cancelar" : "Cancel"}
          </button>
          <button type="button" className="ec-btn-primary" onClick={save} disabled={saving || !!invalid}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {es ? "Guardar ajustes" : "Save settings"}
          </button>
        </>
      }
    >
      <div className="ec-vault-form">
        <p className="ec-vault-muted">
          {es
            ? "Estos datos se muestran a todos los clientes en su tarjeta y en la hoja de requerimientos."
            : "Every client sees these details on their card and requirements sheet."}
        </p>
        <div>
          <label className="ec-field-label" htmlFor="vault-metaBusinessId">
            {es ? "Business portfolio ID de Meta" : "Meta business portfolio ID"}
          </label>
          <input {...field("metaBusinessId")} inputMode="numeric" autoComplete="off" />
          <small id="vault-metaBusinessId-hint" className={invalid === "metaBusinessId" ? "is-error" : undefined}>
            {es ? "Solo números, de 5 a 30 dígitos." : "Digits only, 5 to 30."}
          </small>
        </div>
        <div>
          <label className="ec-field-label" htmlFor="vault-googleEmail">
            {es ? "Correo para accesos de Google" : "Email for Google access"}
          </label>
          <input {...field("googleEmail")} type="email" autoComplete="off" />
          <small id="vault-googleEmail-hint" className={invalid === "googleEmail" ? "is-error" : undefined}>
            {es ? "El cliente lo agrega como usuario en Business, Analytics, Search Console, Ads y Merchant Center." : "The client adds it as a user in Business, Analytics, Search Console, Ads and Merchant Center."}
          </small>
        </div>
        <div>
          <label className="ec-field-label" htmlFor="vault-clientNote">
            {es ? "Mensaje para el cliente (opcional)" : "Message for the client (optional)"}
          </label>
          <textarea {...field("clientNote")} rows={3} maxLength={300} />
          <small id="vault-clientNote-hint" className={invalid === "clientNote" ? "is-error" : undefined}>
            {es ? `Aparece arriba de la tarjeta. ${draft.clientNote.length}/300` : `Shown at the top of the card. ${draft.clientNote.length}/300`}
          </small>
        </div>
        {error ? (
          <div role="alert" className="ec-sheet-error">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function RequirementsSheet({
  projectId,
  isTeam,
  isAdmin,
  es,
  rows,
  sections,
  settings,
  onRow,
  onCustom,
}: {
  projectId: number;
  isTeam: boolean;
  isAdmin: boolean;
  es: boolean;
  rows: Rows;
  sections: RequirementSection[];
  settings: VaultSettings;
  onRow: (row: RequirementRow) => void;
  onCustom: (update: (c: CustomRequirement[]) => CustomRequirement[]) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<RequirementItem | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropSection, setDropSection] = useState<string | null>(null);
  const isSkipped = (key: string) => rows[key]?.status === "skipped";
  const skipped = sections.flatMap((s) => s.items).filter((i) => isSkipped(i.key));

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const save = (key: string, patch: Parameters<typeof saveRequirement>[2]) =>
    run(key, async () => onRow(await saveRequirement(projectId, key, patch)));

  const add = (section: string, label: string) =>
    run(`add:${section}`, async () => {
      const item = await addCustomRequirement(projectId, section, label);
      onCustom((c) => [...c, item]);
    });

  const move = (key: string, section: string, before: string | null) =>
    run(key, async () => {
      const list = await moveCustomRequirement(projectId, key, section, before);
      onCustom(() => list);
    });

  // Suelta sobre una fila propia: queda antes de ella; sobre cualquier otra parte de la sección: al final.
  const drop = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDropSection(null);
    const key = dragKey ?? e.dataTransfer.getData("text/plain");
    setDragKey(null);
    if (!key) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>("tr[data-custom]")?.dataset.custom ?? null;
    if (target === key) return;
    void move(key, section, target);
  };

  const remove = (key: string) =>
    run(key, async () => {
      await deleteCustomRequirement(projectId, key);
      onCustom((c) => c.filter((i) => i.key !== key));
      setToDelete(null);
    });

  return (
    <div>
      <p className="ec-sheet-intro">
        {es
          ? "Llena la información de cada requisito y pasará a Enviado; el equipo de Ecommetrica lo verifica. No escribas contraseñas en esta hoja."
          : "Fill in each requirement and it moves to Sent; the Ecommetrica team verifies it. Do not write passwords in this sheet."}
      </p>
      {settings.clientNote ? <p className="ec-vault-note">{settings.clientNote}</p> : null}
      {error ? (
        <div role="alert" className="ec-sheet-error">
          {error}
        </div>
      ) : null}

      <div className="ec-sheet-scroll">
        <table className="ec-sheet">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{es ? "Requisito" : "Requirement"}</th>
              <th scope="colgroup" colSpan={2}>{es ? "Información" : "Information"}</th>
              <th scope="col">{es ? "Estado" : "Status"}</th>
              <th scope="col">{es ? "Comentarios" : "Comments"}</th>
            </tr>
          </thead>
          {sections.map((section) => {
            const items = section.items.filter((i) => !isSkipped(i.key));
            // "Otros" solo aparece cuando tiene algo (o mientras se arrastra, para poder soltar ahí).
            if (section.id === "other" && !items.length && !dragKey) return null;
            return (
            <tbody
              key={section.id}
              className={dropSection === section.id ? "is-drop" : undefined}
              onDragOver={dragKey ? (e) => {
                e.preventDefault();
                if (dropSection !== section.id) setDropSection(section.id);
              } : undefined}
              onDrop={dragKey ? (e) => drop(e, section.id) : undefined}
            >
              <tr className="ec-sheet-section">
                <th colSpan={5} scope="colgroup">
                  {es ? section.es : section.en}
                  {section.note ? (
                    <small>
                      {es ? section.note.es : section.note.en}
                      {section.setting ? <b> {settings[section.setting]}</b> : null}
                    </small>
                  ) : null}
                </th>
              </tr>
              {items.map((item) => (
                <SheetRow
                  key={item.key}
                  item={item}
                  row={rows[item.key]}
                  es={es}
                  isTeam={isTeam}
                  busy={busy === item.key}
                  onSave={(patch) => save(item.key, patch)}
                  // Admin: el propio se borra (con confirmación); el de plantilla se quita y se puede restaurar.
                  onDelete={isAdmin ? () => (item.custom ? setToDelete(item) : save(item.key, { status: "skipped" })) : undefined}
                  drag={
                    item.custom
                      ? {
                          sections: sections.map((s) => ({ id: s.id, label: es ? s.es : s.en })),
                          current: section.id,
                          onStart: () => setDragKey(item.key),
                          onEnd: () => {
                            setDragKey(null);
                            setDropSection(null);
                          },
                          onMoveTo: (to) => move(item.key, to, null),
                        }
                      : undefined
                  }
                />
              ))}
            </tbody>
            );
          })}
          <tbody>
            <AddRow es={es} busy={busy === "add:other"} onAdd={(label) => add("other", label)} />
          </tbody>
        </table>
      </div>

      {isAdmin && skipped.length ? (
        <details className="ec-sheet-skipped">
          <summary>
            {es ? `${skipped.length} quitados · restaurar` : `${skipped.length} removed · restore`}
          </summary>
          <ul>
            {skipped.map((item) => (
              <li key={item.key}>
                <span>{es ? item.es : item.en}</span>
                <button
                  type="button"
                  className="ec-sheet-action"
                  disabled={busy === item.key}
                  onClick={() => save(item.key, { status: "pending" })}
                >
                  <RotateCcw size={12} aria-hidden /> {es ? "Restaurar" : "Restore"}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Modal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={es ? "Borrar requisito" : "Delete requirement"}
        width={440}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setToDelete(null)}>
              {es ? "Cancelar" : "Cancel"}
            </button>
            <button type="button" className="ec-btn-primary" disabled={!!busy} onClick={() => toDelete && remove(toDelete.key)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {es ? "Borrar" : "Delete"}
            </button>
          </>
        }
      >
        <p className="ec-vault-muted">
          {es
            ? `Se borra "${toDelete?.es}" y la información que tenga. No se puede deshacer.`
            : `"${toDelete?.en}" and its information will be deleted. This cannot be undone.`}
        </p>
      </Modal>
    </div>
  );
}

/** Última fila de la hoja: agrega un requisito propio a "Otros"; de ahí se arrastra a su sección. */
function AddRow({ es, busy, onAdd }: { es: boolean; busy: boolean; onAdd: (label: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await onAdd(label.trim());
    setLabel("");
    setOpen(false);
  };

  return (
    <tr className="ec-sheet-add">
      <td colSpan={5}>
        {open ? (
          <form onSubmit={submit}>
            <input
              className="ec-sheet-cell"
              value={label}
              maxLength={120}
              autoFocus
              placeholder={es ? "Nombre del requisito" : "Requirement name"}
              aria-label={es ? "Nombre del requisito nuevo" : "New requirement name"}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
            <button type="submit" className="ec-sheet-action" disabled={busy || !label.trim()}>
              {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
              {es ? "Agregar" : "Add"}
            </button>
            <button type="button" className="ec-sheet-action" onClick={() => setOpen(false)}>
              {es ? "Cancelar" : "Cancel"}
            </button>
          </form>
        ) : (
          <button type="button" className="ec-sheet-action" onClick={() => setOpen(true)}>
            <Plus size={13} aria-hidden /> {es ? "Agregar requisito" : "Add requirement"}
          </button>
        )}
      </td>
    </tr>
  );
}

function SheetRow({
  item,
  row,
  es,
  isTeam,
  busy,
  onSave,
  onDelete,
  drag,
}: {
  item: RequirementItem;
  row: RequirementRow | undefined;
  es: boolean;
  isTeam: boolean;
  busy: boolean;
  onSave: (patch: Parameters<typeof saveRequirement>[2]) => void;
  onDelete?: () => void;
  /** Solo requisitos propios: se arrastran entre secciones; el select es la alternativa con teclado. */
  drag?: {
    sections: { id: string; label: string }[];
    current: string;
    onStart: () => void;
    onEnd: () => void;
    onMoveTo: (section: string) => void;
  };
}) {
  const status = row?.status ?? "pending";
  // Un acceso verificado queda fijo para el cliente; solo puede comentar.
  const locked = !isTeam && status === "verified";
  const [info, setInfo] = useState(row?.info ?? "");
  const [info2, setInfo2] = useState(row?.info2 ?? "");
  const [comment, setComment] = useState(row?.comment ?? "");
  const label = es ? item.es : item.en;
  const next: RequirementStatus | null = status === "sent" ? "verified" : status === "verified" ? "sent" : null;

  // Guarda al salir de la celda, solo si cambió (como una celda de Excel).
  const commit = (field: "info" | "info2" | "comment", value: string) => {
    if (value.trim() !== (row?.[field] ?? "")) onSave({ [field]: value });
  };

  const infoCell = (field: "info" | "info2", value: string, set: (v: string) => void, ph: { es: string; en: string }) => (
    <td>
      <input
        className="ec-sheet-cell"
        value={value}
        maxLength={255}
        placeholder={es ? ph.es : ph.en}
        aria-label={`${label}: ${es ? "información" : "information"} ${field === "info" ? 1 : 2}`}
        disabled={locked}
        autoComplete="off"
        onChange={(e) => set(e.target.value)}
        onBlur={() => commit(field, value)}
      />
    </td>
  );

  return (
    <tr
      aria-busy={busy || undefined}
      data-custom={drag ? item.key : undefined}
      draggable={drag ? true : undefined}
      onDragStart={drag ? (e) => {
        e.dataTransfer.setData("text/plain", item.key);
        e.dataTransfer.effectAllowed = "move";
        drag.onStart();
      } : undefined}
      onDragEnd={drag?.onEnd}
    >
      <th scope="row">
        <span className="ec-sheet-label">
          {drag ? <GripVertical size={13} aria-hidden className="ec-sheet-grip" /> : null}
          <span style={{ flex: 1 }}>
            {label}
            {item.priority ? (
              <span className="ec-sheet-priority">
                <Star size={11} aria-hidden /> {es ? "Prioritario" : "Priority"}
              </span>
            ) : null}
          </span>
          {drag ? (
            <select
              className="ec-sheet-move"
              value={drag.current}
              disabled={busy}
              aria-label={`${es ? "Mover" : "Move"} ${label} ${es ? "a la sección" : "to section"}`}
              title={es ? "Mover a otra sección" : "Move to another section"}
              onChange={(e) => drag.onMoveTo(e.target.value)}
            >
              {drag.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="ec-sheet-icon"
              disabled={busy}
              onClick={onDelete}
              aria-label={`${item.custom ? (es ? "Borrar" : "Delete") : es ? "Quitar" : "Remove"} ${label}`}
              title={item.custom ? (es ? "Borrar" : "Delete") : es ? "Quitar (no se usará)" : "Remove (not used)"}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          ) : null}
        </span>
      </th>
      {infoCell("info", info, setInfo, item.info ?? DEFAULT_INFO)}
      {infoCell("info2", info2, setInfo2, item.info2 ?? DEFAULT_INFO2)}
      <td>
        <div className="ec-sheet-status">
          <StatusBadge status={status} es={es} />
          {isTeam && next ? (
            <button type="button" className="ec-sheet-action" disabled={busy} onClick={() => onSave({ status: next })}>
              {next === "verified" ? (es ? "Verificar" : "Verify") : es ? "Quitar verificación" : "Unverify"}
            </button>
          ) : null}
        </div>
      </td>
      <td>
        <input
          className="ec-sheet-cell"
          value={comment}
          maxLength={500}
          aria-label={`${label}: ${es ? "comentarios" : "comments"}`}
          autoComplete="off"
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => commit("comment", comment)}
        />
        {row?.updatedBy ? (
          <small className="ec-sheet-who">
            {row.updatedBy}
            {row.updatedAt ? `, ${new Date(row.updatedAt).toLocaleDateString(es ? "es-MX" : "en-US")}` : ""}
          </small>
        ) : null}
      </td>
    </tr>
  );
}
