"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Settings2, ShieldCheck, Star } from "lucide-react";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import {
  DEFAULT_VAULT_SETTINGS,
  REQUIREMENT_SECTIONS,
  canSetStatus,
  getVaultSettings,
  listRequirements,
  requirementProgress,
  saveRequirement,
  saveVaultSettings,
  vaultSettingsError,
  type RequirementItem,
  type RequirementRow,
  type RequirementStatus,
  type VaultSettings,
} from "@/lib/requirements";

type Rows = Record<string, RequirementRow>;

const STATUS_META: Record<RequirementStatus, { badge: string; glyph: string; es: string; en: string }> = {
  pending: { badge: "ec-badge-neutral", glyph: "ec-glyph-idle", es: "Pendiente", en: "Pending" },
  sent: { badge: "ec-badge-warning", glyph: "ec-glyph-warn", es: "Enviado", en: "Sent" },
  verified: { badge: "ec-badge-success", glyph: "ec-glyph-ok", es: "Verificado", en: "Verified" },
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
 * la hoja "Requerimientos" con el estado de cada acceso. El cliente marca "Enviado";
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
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_VAULT_SETTINGS);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listRequirements(projectId)
      .then((r) => alive && setRows(r))
      .catch(() => alive && setLoadError(true));
    // Sin ajustes guardados (o si falla) se quedan los valores por defecto.
    getVaultSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId]);

  const progress = requirementProgress(rows ?? {});
  const statusOf = (key: string): RequirementStatus => rows?.[key]?.status ?? "pending";
  const adStatus = statusOf("meta_ad_account");
  const nextUp = REQUIREMENT_SECTIONS.filter((s) => !s.optional)
    .flatMap((s) => s.items)
    .filter((i) => statusOf(i.key) === "pending")
    .slice(0, 3);
  const verifiedPct = (progress.verified / progress.total) * 100;
  const sentPct = (progress.sent / progress.total) * 100;

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

            {adStatus !== "verified" ? (
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
            es={es}
            rows={rows}
            settings={settings}
            onRow={(r) => setRows((p) => ({ ...p, [r.key]: r }))}
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
  es,
  rows,
  settings,
  onRow,
}: {
  projectId: number;
  isTeam: boolean;
  es: boolean;
  rows: Rows;
  settings: VaultSettings;
  onRow: (row: RequirementRow) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const save = async (key: string, patch: Parameters<typeof saveRequirement>[2]) => {
    setBusy(key);
    setError("");
    try {
      onRow(await saveRequirement(projectId, key, patch));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <p className="ec-sheet-intro">
        {es
          ? "Marca cada acceso cuando ya lo hayas dado; el equipo de Ecommetrica lo verifica. No escribas contraseñas ni datos bancarios en esta hoja."
          : "Mark each item once you have granted it; the Ecommetrica team verifies it. Do not write passwords or bank details in this sheet."}
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
            <col style={{ width: "27%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "26%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{es ? "Requisito" : "Requirement"}</th>
              <th scope="col">{es ? "Información" : "Information"}</th>
              <th scope="col">{es ? "Estado" : "Status"}</th>
              <th scope="col">{es ? "Comentarios" : "Comments"}</th>
            </tr>
          </thead>
          {REQUIREMENT_SECTIONS.map((section) => (
            <tbody key={section.id}>
              <tr className="ec-sheet-section">
                <th colSpan={4} scope="colgroup">
                  {es ? section.es : section.en}
                  {section.note ? (
                    <small>
                      {es ? section.note.es : section.note.en}
                      {section.setting ? <b> {settings[section.setting]}</b> : null}
                    </small>
                  ) : null}
                </th>
              </tr>
              {section.items.map((item) => (
                <SheetRow
                  key={item.key}
                  item={item}
                  row={rows[item.key]}
                  es={es}
                  isTeam={isTeam}
                  busy={busy === item.key}
                  onSave={(patch) => save(item.key, patch)}
                />
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

function SheetRow({
  item,
  row,
  es,
  isTeam,
  busy,
  onSave,
}: {
  item: RequirementItem;
  row: RequirementRow | undefined;
  es: boolean;
  isTeam: boolean;
  busy: boolean;
  onSave: (patch: Parameters<typeof saveRequirement>[2]) => void;
}) {
  const status = row?.status ?? "pending";
  const locked = !canSetStatus(isTeam, status, "pending");
  const [info, setInfo] = useState(row?.info ?? "");
  const [comment, setComment] = useState(row?.comment ?? "");
  const label = es ? item.es : item.en;

  // Guarda al salir de la celda, solo si cambió (como una celda de Excel).
  const commit = (field: "info" | "comment", value: string) => {
    if (value.trim() !== ((field === "info" ? row?.info : row?.comment) ?? "")) onSave({ [field]: value });
  };

  return (
    <tr aria-busy={busy || undefined}>
      <th scope="row">
        {label}
        {item.priority ? (
          <span className="ec-sheet-priority">
            <Star size={11} aria-hidden /> {es ? "Prioritario" : "Priority"}
          </span>
        ) : null}
      </th>
      <td>
        {item.info ? (
          <input
            className="ec-sheet-cell"
            value={info}
            maxLength={255}
            placeholder={es ? item.info.es : item.info.en}
            aria-label={`${label}: ${es ? "información" : "information"}`}
            disabled={locked}
            autoComplete="off"
            onChange={(e) => setInfo(e.target.value)}
            onBlur={() => commit("info", info)}
          />
        ) : (
          <span className="ec-sheet-na">{es ? "Solo dar acceso" : "Access only"}</span>
        )}
      </td>
      <td>
        {isTeam ? (
          <select
            className="ec-sheet-cell"
            value={status}
            disabled={busy}
            aria-label={`${label}: ${es ? "estado" : "status"}`}
            onChange={(e) => onSave({ status: e.target.value as RequirementStatus })}
          >
            {(Object.keys(STATUS_META) as RequirementStatus[]).map((s) => (
              <option key={s} value={s}>
                {es ? STATUS_META[s].es : STATUS_META[s].en}
              </option>
            ))}
          </select>
        ) : locked ? (
          <StatusBadge status={status} es={es} />
        ) : (
          <label className="ec-sheet-check">
            <input
              type="checkbox"
              checked={status === "sent"}
              disabled={busy}
              onChange={(e) => onSave({ status: e.target.checked ? "sent" : "pending" })}
            />
            <StatusBadge status={status} es={es} />
          </label>
        )}
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
