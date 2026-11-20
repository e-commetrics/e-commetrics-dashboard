"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, FileText, Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { ErrorNotice, Loading, Modal, PageHeader } from "../../webapp/crm/components/ui";
import { errorMessage } from "../lib/api";
import { useWorkspace } from "../lib/hooks";
import { useT } from "../lib/i18n";
import { hostOf, normalizeUrl } from "../lib/notes";
import type { Note, NoteKind, NoteLink } from "../lib/types";

const KIND_ICON: Record<NoteKind, typeof Link2> = { links: Link2, text: FileText };

/** Confirmación de borrado (en vez de window.confirm). Se monta solo abierta; el error se muestra dentro. */
function ConfirmDeleteModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && !busy && onCancel()}
      title={title}
      width={440}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={onCancel} disabled={busy}>
            {t("Cancelar", "Cancel")}
          </button>
          <button type="button" className="ec-btn-danger" onClick={confirm} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ec-text)" }}>{message}</p>
      {error ? <p role="alert" className="ec-notes-error">{error}</p> : null}
    </Modal>
  );
}

/**
 * Notas privadas de cada persona del equipo, estilo Notion: páginas de links o de texto.
 * Las notas son del usuario conectado; el backend nunca devuelve las de otra persona.
 */
export function NotesScreen({ noteId, onOpen }: { noteId: string | null; onOpen: (id: string | null) => void }) {
  const { t } = useT();
  const { api } = useWorkspace();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .listNotes()
      .then((list) => alive && (setNotes(list), setError(null)))
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [api, reload]);

  const upsert = (note: Note) =>
    setNotes((prev) => [note, ...(prev ?? []).filter((n) => n.id !== note.id)]);
  const patchLocal = (id: string, fn: (n: Note) => Note) =>
    setNotes((prev) => (prev ?? []).map((n) => (n.id === id ? fn(n) : n)));

  const create = async (kind: NoteKind) => {
    setCreating(true);
    try {
      const note = await api.createNote({ kind, title: kind === "links" ? t("Links sin título", "Untitled links") : t("Nota sin título", "Untitled note") });
      upsert(note);
      onOpen(note.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const [toDelete, setToDelete] = useState<Note | null>(null);
  const remove = async (note: Note) => {
    await api.deleteNote(note.id);
    setNotes((prev) => (prev ?? []).filter((n) => n.id !== note.id));
    setToDelete(null);
    onOpen(null);
  };

  const open = notes?.find((n) => n.id === noteId) ?? null;

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Notas", "Notes")}
        subtitle={t("Solo tú ves tus notas.", "Only you can see your notes.")}
      />
      {error ? <ErrorNotice message={error} onRetry={() => setReload((n) => n + 1)} /> : null}
      {!notes && !error ? <Loading /> : null}

      {notes ? (
        <div className={`ec-notes ${open ? "has-open" : ""}`}>
          <aside className="ec-notes-rail" aria-label={t("Tus notas", "Your notes")}>
            <div className="ec-notes-new">
              <button type="button" className="ec-btn-secondary" disabled={creating} onClick={() => create("links")}>
                <Plus size={14} aria-hidden /> {t("Links", "Links")}
              </button>
              <button type="button" className="ec-btn-secondary" disabled={creating} onClick={() => create("text")}>
                <Plus size={14} aria-hidden /> {t("Texto", "Text")}
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="ec-notes-empty">
                {t("Aún no tienes notas. Crea una página de links o de texto.", "No notes yet. Create a links or text page.")}
              </p>
            ) : (
              <ul>
                {notes.map((n) => {
                  const Icon = KIND_ICON[n.kind];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={n.id === noteId ? "active" : ""}
                        aria-current={n.id === noteId ? "page" : undefined}
                        onClick={() => onOpen(n.id)}
                      >
                        <Icon size={15} aria-hidden />
                        <span className="ec-notes-title">{n.title}</span>
                        <span className="ec-notes-meta">
                          {n.kind === "links" ? n.links.length : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="ec-notes-page">
            {open ? (
              <NotePage
                key={open.id}
                note={open}
                onBack={() => onOpen(null)}
                onChange={upsert}
                onPatch={(fn) => patchLocal(open.id, fn)}
                onDelete={() => setToDelete(open)}
              />
            ) : (
              <div className="ec-notes-placeholder">
                {notes.length
                  ? t("Elige una nota de la lista.", "Pick a note from the list.")
                  : t("Tus links y apuntes de trabajo viven aquí.", "Your work links and jotted notes live here.")}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {toDelete ? (
        <ConfirmDeleteModal
          title={t("Borrar nota", "Delete note")}
          message={
            toDelete.kind === "links" && toDelete.links.length
              ? t(`Se borra "${toDelete.title}" con sus ${toDelete.links.length} links. No se puede deshacer.`, `"${toDelete.title}" and its ${toDelete.links.length} links will be deleted. This cannot be undone.`)
              : t(`Se borra "${toDelete.title}". No se puede deshacer.`, `"${toDelete.title}" will be deleted. This cannot be undone.`)
          }
          confirmLabel={t("Borrar nota", "Delete note")}
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove(toDelete)}
        />
      ) : null}
    </div>
  );
}

function NotePage({
  note,
  onBack,
  onChange,
  onPatch,
  onDelete,
}: {
  note: Note;
  onBack: () => void;
  onChange: (n: Note) => void;
  onPatch: (fn: (n: Note) => Note) => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  const { api } = useWorkspace();
  const [title, setTitle] = useState(note.title);
  const [error, setError] = useState<string | null>(null);

  const saveTitle = async () => {
    const next = title.trim();
    if (!next) return setTitle(note.title);
    if (next === note.title) return;
    try {
      onChange(await api.updateNote(note.id, { title: next }));
    } catch (e) {
      setError(errorMessage(e));
      setTitle(note.title);
    }
  };

  return (
    <article>
      <div className="ec-notes-bar">
        <button type="button" className="ec-notes-back" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden /> {t("Notas", "Notes")}
        </button>
        <span className="ec-badge ec-badge-neutral">
          {note.kind === "links" ? <Link2 size={12} aria-hidden /> : <FileText size={12} aria-hidden />}
          {note.kind === "links" ? t("Links", "Links") : t("Texto", "Text")}
        </span>
        <button type="button" className="ec-notes-icon danger" onClick={onDelete} aria-label={t("Borrar nota", "Delete note")}>
          <Trash2 size={15} aria-hidden />
        </button>
      </div>

      <input
        className="ec-notes-heading ec-display"
        value={title}
        maxLength={120}
        aria-label={t("Título de la nota", "Note title")}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      {error ? <p role="alert" className="ec-notes-error">{error}</p> : null}

      {note.kind === "links" ? (
        <LinksEditor note={note} onPatch={onPatch} />
      ) : (
        <TextEditor note={note} onSaved={onChange} />
      )}
    </article>
  );
}

function LinksEditor({ note, onPatch }: { note: Note; onPatch: (fn: (n: Note) => Note) => void }) {
  const { t } = useT();
  const { api } = useWorkspace();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!clean) return setError(t("Escribe un link válido, por ejemplo figma.com/archivo.", "Enter a valid link, for example figma.com/file."));
    setBusy(true);
    setError(null);
    try {
      const link = await api.addNoteLink(note.id, { url: clean, title: title.trim() || hostOf(clean), description: description.trim() || null });
      onPatch((n) => ({ ...n, links: [...n.links, link] }));
      setUrl("");
      setTitle("");
      setDescription("");
      urlRef.current?.focus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const [toDelete, setToDelete] = useState<NoteLink | null>(null);
  const remove = async (link: NoteLink) => {
    await api.deleteNoteLink(note.id, link.id);
    onPatch((n) => ({ ...n, links: n.links.filter((l) => l.id !== link.id) }));
    setToDelete(null);
  };

  return (
    <div className="ec-links">
      <form className="ec-links-add" onSubmit={add}>
        <input
          ref={urlRef}
          className="ec-field-input"
          value={url}
          placeholder={t("Pega un link", "Paste a link")}
          aria-label={t("Link", "Link")}
          inputMode="url"
          autoComplete="off"
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="ec-field-input"
          value={title}
          maxLength={160}
          placeholder={t("Título (opcional)", "Title (optional)")}
          aria-label={t("Título del link", "Link title")}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="ec-field-input ec-links-desc"
          value={description}
          maxLength={300}
          placeholder={t("Para qué sirve (opcional)", "What it is for (optional)")}
          aria-label={t("Descripción del link", "Link description")}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="ec-btn-primary" disabled={busy || !url.trim()}>
          <Plus size={14} aria-hidden /> {t("Agregar link", "Add link")}
        </button>
      </form>
      {error ? <p role="alert" className="ec-notes-error">{error}</p> : null}

      {note.links.length === 0 ? (
        <p className="ec-notes-empty">{t("Pega tu primer link arriba.", "Paste your first link above.")}</p>
      ) : (
        <ul className="ec-links-list">
          {note.links.map((link) => (
            <LinkRow key={link.id} noteId={note.id} link={link} onSaved={(l) => onPatch((n) => ({ ...n, links: n.links.map((x) => (x.id === l.id ? l : x)) }))} onDelete={() => setToDelete(link)} />
          ))}
        </ul>
      )}

      {toDelete ? (
        <ConfirmDeleteModal
          title={t("Borrar link", "Delete link")}
          message={t(`Se borra "${toDelete.title}" de esta nota. No se puede deshacer.`, `"${toDelete.title}" will be removed from this note. This cannot be undone.`)}
          confirmLabel={t("Borrar link", "Delete link")}
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove(toDelete)}
        />
      ) : null}
    </div>
  );
}

function LinkRow({ noteId, link, onSaved, onDelete }: { noteId: string; link: NoteLink; onSaved: (l: NoteLink) => void; onDelete: () => void }) {
  const { t } = useT();
  const { api } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: link.title, url: link.url, description: link.description ?? "" });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = () =>
    navigator.clipboard.writeText(link.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }, () => {});

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeUrl(draft.url);
    if (!clean || !draft.title.trim()) return setError(t("Revisa el título y el link.", "Check the title and link."));
    try {
      onSaved(await api.updateNoteLink(noteId, link.id, { title: draft.title.trim(), url: clean, description: draft.description.trim() || null }));
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <li className="ec-link editing">
        <form onSubmit={save} className="ec-link-form">
          <input className="ec-field-input" value={draft.title} maxLength={160} aria-label={t("Título del link", "Link title")} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className="ec-field-input" value={draft.url} aria-label={t("Link", "Link")} inputMode="url" onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          <input className="ec-field-input" value={draft.description} maxLength={300} placeholder={t("Para qué sirve (opcional)", "What it is for (optional)")} aria-label={t("Descripción del link", "Link description")} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          {error ? <p role="alert" className="ec-notes-error">{error}</p> : null}
          <div className="ec-link-form-actions">
            <button type="button" className="ec-btn-secondary" onClick={() => { setEditing(false); setError(null); setDraft({ title: link.title, url: link.url, description: link.description ?? "" }); }}>
              <X size={14} aria-hidden /> {t("Cancelar", "Cancel")}
            </button>
            <button type="submit" className="ec-btn-primary">
              <Check size={14} aria-hidden /> {t("Guardar link", "Save link")}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="ec-link">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="ec-link-main">
        <span className="ec-link-title">
          {link.title} <ExternalLink size={12} aria-hidden />
        </span>
        <span className="ec-link-host">{hostOf(link.url)}</span>
        {link.description ? <span className="ec-link-desc">{link.description}</span> : null}
      </a>
      <div className="ec-link-actions">
        <button type="button" className="ec-notes-icon" onClick={copy} aria-label={copied ? t("Link copiado", "Link copied") : t("Copiar link", "Copy link")}>
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        </button>
        <button type="button" className="ec-notes-icon" onClick={() => setEditing(true)} aria-label={t("Editar link", "Edit link")}>
          <Pencil size={15} aria-hidden />
        </button>
        <button type="button" className="ec-notes-icon danger" onClick={onDelete} aria-label={t("Borrar link", "Delete link")}>
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </li>
  );
}

/** Guarda solo: 800 ms después de dejar de escribir y al salir del campo. */
function TextEditor({ note, onSaved }: { note: Note; onSaved: (n: Note) => void }) {
  const { t } = useT();
  const { api } = useWorkspace();
  const [body, setBody] = useState(note.body ?? "");
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const saved = useRef(note.body ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = async (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value === saved.current) return setState("saved");
    setState("saving");
    try {
      const note2 = await api.updateNote(note.id, { body: value });
      saved.current = value;
      onSaved(note2);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  // Al cambiar de nota o salir de la vista se guarda lo último escrito en vez de perderlo.
  const latest = useRef(note.body ?? "");
  useEffect(() => {
    const id = note.id;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (latest.current !== saved.current) void api.updateNote(id, { body: latest.current }).catch(() => {});
    };
  }, [api, note.id]);

  const label =
    state === "saving" ? t("Guardando…", "Saving…")
    : state === "dirty" ? t("Sin guardar", "Unsaved")
    : state === "error" ? t("No se guardó. Sal del campo para reintentar.", "Not saved. Leave the field to retry.")
    : t("Guardado", "Saved");

  return (
    <div className="ec-text-note">
      <textarea
        value={body}
        maxLength={50000}
        placeholder={t("Escribe aquí…", "Start writing…")}
        aria-label={t("Contenido de la nota", "Note content")}
        onChange={(e) => {
          const v = e.target.value;
          latest.current = v;
          setBody(v);
          setState("dirty");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void flush(v), 800);
        }}
        onBlur={() => void flush(body)}
      />
      <p className={`ec-text-state ${state === "error" ? "is-error" : ""}`} aria-live="polite">
        {label}
      </p>
    </div>
  );
}
