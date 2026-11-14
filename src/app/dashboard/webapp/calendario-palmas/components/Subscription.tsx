"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Link, Check } from "lucide-react";

export function SubscriptionButton({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const subUrl = `${apiBaseUrl}/api/calendar.ics`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subUrl);
      setCopied(true);
      toast.success("URL de suscripción copiada al portapapeles");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar la URL");
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
        borderRadius: 10, border: "1px solid var(--ec-border)",
        background: copied ? "rgba(16,185,129,0.12)" : "var(--ec-surface-2)",
        color: copied ? "#10b981" : "var(--ec-text)",
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        transition: "all 0.2s",
      }}
      title="Copiar URL de suscripción para el calendario"
    >
      {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
      {copied ? "Copiado" : "Suscripción"}
    </button>
  );
}

// ── InstallModal ─────────────────────────────────────────────────────────────

export function InstallModal({ onClose, apiBaseUrl }: { onClose: () => void; apiBaseUrl: string }) {
  const subUrl = `${apiBaseUrl}/api/calendar.ics`;

  useEffect(() => {

  }, []);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", padding: 16 }}
      onClick={onClose}
    >
      <div
        className="ec-project-card"
        style={{ borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--ec-border)" }}>
          <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--ec-text)" }}>
            Cómo ver las reservas en tu calendario
          </h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--ec-text-dim)" }}
            className="hover:bg-[var(--ec-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Method A: Subscription ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "var(--ec-success)" }}>A</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ec-text)", margin: 0 }}>Suscripción automática <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ec-success)", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 6 }}>RECOMENDADO</span></h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 36 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "var(--ec-info)" }}>1</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Haz clic en <strong>&ldquo;Suscripción&rdquo;</strong></p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Se copiará la URL del calendario al portapapeles.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "var(--ec-info)" }}>2</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Abre la app <strong>Calendario</strong> en Mac</p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Ve a Archivo &gt; Nueva suscripción a calendario…</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "var(--ec-info)" }}>3</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Pega la URL</p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Cmd+V y haz clic en <strong>&ldquo;Suscribir&rdquo;</strong>. En iPhone, abre el enlace desde Safari.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "var(--ec-info)" }}>4</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>¡Listo!</p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Se actualiza automáticamente cuando se agreguen, modifiquen o cancelen reservas — tanto desde la página web (<strong>palmasrecovery.com</strong>) como desde este dashboard. Para forzar la actualización, haz clic derecho sobre el calendario en iCal y selecciona <strong>&ldquo;Actualizar&rdquo;</strong>.</p>
                </div>
              </div>
              <div style={{ padding: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ec-warning)" }}>Nota:</strong> Apple Calendar actualiza la suscripción automáticamente cada 24-48 horas para ahorrar batería. No es instantáneo, pero las reservas nuevas aparecerán solas. Puedes forzar la actualización manualmente cuando quieras.
              </div>
              <div style={{ padding: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ec-success)" }}>URL de suscripción:</strong>
                <code style={{ display: "block", marginTop: 4, padding: "6px 10px", background: "var(--ec-surface-2)", borderRadius: 6, fontSize: 11, color: "var(--ec-text)", wordBreak: "break-all", userSelect: "all" }}>{subUrl}</code>
              </div>
            </div>
          </div>

          {/* divider */}
          <div style={{ borderTop: "1px solid var(--ec-border)", margin: "4px 0" }} />

          {/* ── Method B: Manual export ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(107,114,128,0.12)", color: "var(--ec-text-dim)" }}>B</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ec-text)", margin: 0 }}>Exportación manual (alternativa)</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 36 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(107,114,128,0.1)", color: "var(--ec-text-dim)" }}>1</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Haz clic en <strong>&ldquo;Exportar citas&rdquo;</strong></p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Descarga el archivo .ics con todas las reservas.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(107,114,128,0.1)", color: "var(--ec-text-dim)" }}>2</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Abre el archivo .ics</p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Haz doble clic en <code>palmas-recovery-reservas.ics</code> y elige tu cuenta de iCloud.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, background: "rgba(107,114,128,0.1)", color: "var(--ec-text-dim)" }}>3</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ec-text)", margin: 0 }}>Se sincroniza con iPhone</p>
                  <p style={{ fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>Si tienes iCloud activado, aparecerá automáticamente en tus dispositivos.</p>
                </div>
              </div>
              <div style={{ padding: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12, color: "var(--ec-text-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ec-warning)" }}>Nota:</strong> Con este método debes repetir la exportación cada vez que cambien las reservas para mantener el calendario actualizado. Es más trabajo pero te da control total.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
