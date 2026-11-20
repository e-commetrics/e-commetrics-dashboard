"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, ShieldCheck, Star } from "lucide-react";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import {
  GOOGLE_ACCESS_EMAIL,
  META_BUSINESS_ID,
  REQUIREMENT_SECTIONS,
  canSetStatus,
  listRequirements,
  requirementProgress,
  saveRequirement,
  type RequirementItem,
  type RequirementRow,
  type RequirementStatus,
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
export function RequirementsVault({ projectId, isTeam, lang }: { projectId: number; isTeam: boolean; lang: string }) {
  const es = lang === "es";
  const [rows, setRows] = useState<Rows | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listRequirements(projectId)
      .then((r) => alive && setRows(r))
      .catch(() => alive && setLoadError(true));
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
        <span>Smart&amp;Safe</span>
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

            <dl className="ec-vault-ids">
              <div>
                <dt>{es ? "Partner en Meta (Business ID)" : "Meta partner (Business ID)"}</dt>
                <dd><CopyValue value={META_BUSINESS_ID} copiedLabel={es ? "ID copiado" : "ID copied"} /></dd>
              </div>
              <div>
                <dt>{es ? "Acceso de Google" : "Google access"}</dt>
                <dd><CopyValue value={GOOGLE_ACCESS_EMAIL} copiedLabel={es ? "Correo copiado" : "Email copied"} /></dd>
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
          <RequirementsSheet projectId={projectId} isTeam={isTeam} es={es} rows={rows} onRow={(r) => setRows((p) => ({ ...p, [r.key]: r }))} />
        </Modal>
      ) : null}
    </section>
  );
}

function RequirementsSheet({
  projectId,
  isTeam,
  es,
  rows,
  onRow,
}: {
  projectId: number;
  isTeam: boolean;
  es: boolean;
  rows: Rows;
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
                  {section.note ? <small>{es ? section.note.es : section.note.en}</small> : null}
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
        ) : null}
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
