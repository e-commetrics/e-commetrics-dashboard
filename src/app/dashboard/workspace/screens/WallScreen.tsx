"use client";

import { useState } from "react";
import { Heart, Loader2, MessageSquare, Pin, PinOff, Send, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { EmptyState, ErrorNotice, Loading, PageHeader } from "../../webapp/crm/components/ui";
import { Avatar } from "../components/shared";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { useT } from "../lib/i18n";
import type { WallPost, WorkProject } from "../lib/types";

function timeAgo(isoDate: string, lang: "es" | "en") {
  const mins = Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(lang === "es" ? "es" : "en", { numeric: "auto" });
  if (mins < 60) return rtf.format(-Math.max(mins, 0), "minute");
  if (mins < 60 * 24) return rtf.format(-Math.round(mins / 60), "hour");
  return rtf.format(-Math.round(mins / 1440), "day");
}

/** Muro general: avisos y conversacion de todo el equipo. */
export function WallScreen({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const { t } = useT();
  const { memberById, meId } = useWorkspace();
  const posts = useResource("wall", (api) => api.listWall());
  const projects = useResource("projects", (api) => api.listProjects());
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState("");

  const create = useMutation((api, input: { body: string; projectId: string | null }) => api.createPost(input), {
    onSuccess: () => {
      setBody("");
      setProjectId("");
    },
    onError: (m) => toast.error(m),
  });

  const me = memberById(meId);

  return (
    <div style={{ padding: 28, maxWidth: 760 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Muro del equipo", "Team wall")}
        subtitle={t("Avisos, avances y conversación para todo el equipo.", "Announcements, updates and conversation for the whole team.")}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          void create.run({ body: body.trim(), projectId: projectId || null });
        }}
        style={{ border: "1px solid var(--ec-hairline-strong)", borderRadius: 14, background: "var(--ec-surface-1)", padding: 14, marginBottom: 22 }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar member={me} size={34} />
          <textarea
            className="ec-field-input"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("Comparte algo con el equipo…", "Share something with the team…")}
            aria-label={t("Nueva publicación", "New post")}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <select className="ec-field-input" style={{ width: 240, padding: "7px 12px", fontSize: 13 }} value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label={t("Proyecto", "Project")}>
            <option value="">{t("Sin proyecto", "No project")}</option>
            {(projects.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="ec-btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} disabled={create.loading || !body.trim()}>
            {create.loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t("Publicar", "Post")}
          </button>
        </div>
      </form>

      {posts.loading && !posts.data ? <Loading /> : null}
      {posts.error ? <ErrorNotice message={posts.error} onRetry={posts.reload} /> : null}
      {posts.data && posts.data.length === 0 ? <EmptyState title={t("Aún no hay publicaciones.", "No posts yet.")} /> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(posts.data ?? []).map((post) => (
          <PostCard key={post.id} post={post} projects={projects.data ?? []} onOpenProject={onOpenProject} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, projects, onOpenProject }: { post: WallPost; projects: WorkProject[]; onOpenProject: (id: string) => void }) {
  const { t, lang } = useT();
  const { memberById, meId, isAdmin } = useWorkspace();
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length <= 2);
  const [comment, setComment] = useState("");
  const author = memberById(post.authorId);
  const project = projects.find((p) => p.id === post.projectId);
  const liked = post.likedBy.includes(meId);

  const like = useMutation((api) => api.toggleLike(post.id));
  const pin = useMutation((api) => api.setPinned(post.id, !post.pinned), { onError: (m) => toast.error(m) });
  const remove = useMutation((api) => api.deletePost(post.id), { onError: (m) => toast.error(m) });
  const addComment = useMutation((api, body: string) => api.addPostComment(post.id, body), {
    onSuccess: () => setComment(""),
    onError: (m) => toast.error(m),
  });

  const iconBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12.5,
    color: "var(--ec-text-muted)",
    padding: "4px 6px",
    borderRadius: 6,
  };

  return (
    <article
      style={{
        border: `1px solid ${post.pinned ? "var(--ec-brand)" : "var(--ec-hairline-strong)"}`,
        borderRadius: 14,
        background: post.pinned ? "var(--ec-brand-softer)" : "var(--ec-surface-1)",
        padding: 16,
      }}
    >
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar member={author} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {author?.name ?? "—"}
            {author?.title ? <span style={{ fontWeight: 400, color: "var(--ec-text-muted)", fontSize: 12.5 }}> · {author.title}</span> : null}
          </div>
          <div style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{timeAgo(post.createdAt, lang)}</div>
        </div>
        {post.pinned ? (
          <span className="ec-badge ec-badge-brand">
            <Pin size={11} /> {t("Fijado", "Pinned")}
          </span>
        ) : null}
      </header>

      <p style={{ fontSize: 14, lineHeight: 1.55, margin: "12px 0", whiteSpace: "pre-wrap" }}>{post.body}</p>

      {project ? (
        <button
          type="button"
          onClick={() => onOpenProject(project.id)}
          className="ec-badge ec-badge-neutral"
          style={{ cursor: "pointer", border: "none", marginBottom: 10 }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: project.color }} />
          {project.name}
        </button>
      ) : null}

      <footer style={{ display: "flex", alignItems: "center", gap: 4, borderTop: "1px solid var(--ec-hairline)", paddingTop: 8 }}>
        <button type="button" style={{ ...iconBtn, color: liked ? "var(--ec-brand)" : iconBtn.color }} onClick={() => void like.run()} aria-pressed={liked}>
          <Heart size={14} fill={liked ? "currentColor" : "none"} /> {post.likedBy.length || ""}
        </button>
        <button type="button" style={iconBtn} onClick={() => setShowComments((v) => !v)}>
          <MessageSquare size={14} />{" "}
          {post.comments.length > 0 ? `${post.comments.length} ${t("comentarios", "comments")}` : t("Comentar", "Comment")}
        </button>
        <span style={{ flex: 1 }} />
        {isAdmin ? (
          <button type="button" style={iconBtn} onClick={() => void pin.run()}>
            {post.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            {post.pinned ? t("Desfijar", "Unpin") : t("Fijar", "Pin")}
          </button>
        ) : null}
        {isAdmin || post.authorId === meId ? (
          <button
            type="button"
            style={iconBtn}
            aria-label={t("Eliminar", "Delete")}
            onClick={() => window.confirm(t("¿Eliminar publicación?", "Delete post?")) && void remove.run()}
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </footer>

      {showComments ? (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {post.comments.map((c) => {
            const a = memberById(c.authorId);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <Avatar member={a} size={26} />
                <div style={{ background: "var(--ec-surface-2)", borderRadius: 10, padding: "7px 11px", fontSize: 13 }}>
                  <strong>{a?.name ?? "—"}</strong> <span style={{ color: "var(--ec-text-muted)", fontSize: 11.5 }}>{timeAgo(c.createdAt, lang)}</span>
                  <div style={{ marginTop: 2 }}>{c.body}</div>
                </div>
              </div>
            );
          })}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (comment.trim()) void addComment.run(comment.trim());
            }}
            style={{ display: "flex", gap: 8 }}
          >
            <input className="ec-field-input" style={{ padding: "7px 12px", fontSize: 13 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("Escribe un comentario…", "Write a comment…")} />
            <button type="submit" className="ec-btn-secondary" style={{ padding: "6px 12px" }} disabled={addComment.loading}>
              <Send size={13} />
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
