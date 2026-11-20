"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SESSION_EXPIRED_FLAG, useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { useLang } from "@/app/context/LangContext";
import { useTheme } from "next-themes";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Sun, Moon, AtSign, Lock } from "lucide-react";
import { setCookie } from "@/lib/cookies";

const translations = {
  en: {
    eyebrow: "SIGN IN",
    welcome: "Welcome",
    sub: "Sign in to your workspace",
    email: "Email address",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    btn: "Sign in",
    back: "Back to home",
    divider: "or go back",
    error: "Invalid credentials. Please try again.",
    expired: "Your session expired. Sign in again; anything not saved was lost.",
    rights: "All rights reserved · 2026",
    loading: "Verifying…",
    tagline1: "Build, measure,",
    tagline2: "iterate",
    tagline3: "— together.",
    tagSub: "Centralise clients, projects and specialised apps in one results-oriented workspace.",
    workspaceSub: "Workspace · Dashboard",
    section: "GROWTH OPERATIONS",
    stat1: "Projects",
    stat2: "Clients",
    stat3: "Apps",
  },
  es: {
    eyebrow: "INICIAR SESIÓN",
    welcome: "Bienvenido",
    sub: "Inicia sesión en tu espacio de trabajo",
    email: "Correo electrónico",
    password: "Contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    btn: "Iniciar sesión",
    back: "Volver a la página principal",
    divider: "o vuelve",
    error: "Credenciales inválidas. Inténtalo de nuevo.",
    expired: "Tu sesión expiró. Vuelve a iniciar sesión; lo que no se guardó se perdió.",
    rights: "Todos los derechos reservados · 2026",
    loading: "Verificando…",
    tagline1: "Construye, mide,",
    tagline2: "itera",
    tagline3: "— juntos.",
    tagSub: "Centraliza clientes, proyectos y apps especializadas en un solo espacio de trabajo orientado a resultados.",
    workspaceSub: "Espacio de trabajo · Panel",
    section: "OPERACIONES DE CRECIMIENTO",
    stat1: "Proyectos",
    stat2: "Clientes",
    stat3: "Apps",
  },
};

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.29),
      background: "var(--ec-brand-fill)", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontFamily: "Instrument Serif, serif", fontSize: size * 0.65, color: "#fff", lineHeight: 1 }}>E</span>
    </div>
  );
}

export default function LoginPage({ goToLanding }: { goToLanding?: () => void }) {
  const { user, login } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const { lang, changeLang } = useLang();
  const { theme, setTheme } = useTheme();
  const t = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let expired = false;
    try {
      expired = sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "1";
      sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    } catch {}
    if (expired) toast.error(t.expired, { id: "session-expired", duration: 6000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      await login(email, password);
      router.push("/dashboard");
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }

  if (user === undefined || redirecting) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ec-bg)", color: "var(--ec-text-dim)", fontFamily: "JetBrains Mono, monospace", fontSize: 13, letterSpacing: "0.1em" }}>
        LOADING…
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", width: "100vw" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      {/* ── LEFT — branded panel ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "var(--ec-hero-base)" }}>
        {/* Radial glow overlay */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 50% 50%, var(--ec-hero-glow-a), transparent)", pointerEvents: "none" }} />
        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--ec-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--ec-grid-line) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        {/* Accent dots */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[{ top: "12%", left: "20%" }, { top: "34%", left: "72%" }, { top: "55%", left: "40%" }, { top: "70%", left: "15%" }, { top: "82%", left: "65%" }, { top: "24%", left: "55%" }].map((pos, i) => (
            <div key={i} style={{ position: "absolute", ...pos, width: 5, height: 5, borderRadius: "50%", background: "var(--ec-brand-fill)", opacity: 0.5 }} />
          ))}
        </div>

        {/* Left panel content */}
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
          {/* Top brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark size={36} />
            <div>
              <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 19, color: "var(--ec-text)" }}>E-commetrics</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "var(--ec-text-dim)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {t.workspaceSub}
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ec-text-dim)", marginBottom: 16 }}>
              ⎯⎯⎯&nbsp;&nbsp;{t.section}
            </div>
            <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 52, fontWeight: 400, lineHeight: 1.02, letterSpacing: "-0.025em", color: "var(--ec-text)", marginBottom: 20 }}>
              {t.tagline1}<br />
              <em style={{ color: "var(--ec-brand)", fontStyle: "italic" }}>{t.tagline2}</em> {t.tagline3}
            </h2>
            <p style={{ fontSize: 15, color: "var(--ec-text-muted)", maxWidth: "40ch", lineHeight: 1.6 }}>
              {t.tagSub}
            </p>
          </div>

          {/* Stats footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "var(--ec-text-dim)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <div style={{ display: "flex", gap: 28 }}>
              {[["11", t.stat1], ["8", t.stat2], ["8", t.stat3]].map(([num, label]) => (
                <div key={label}>
                  <div style={{ color: "var(--ec-text-muted)", fontFamily: "Instrument Serif, serif", fontSize: 22, letterSpacing: "-0.01em" }}>{num}</div>
                  <div>{label}</div>
                </div>
              ))}
            </div>
            <div>© 2026</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — form panel ── */}
      <div style={{ position: "relative", background: "var(--ec-surface-1)", display: "flex", flexDirection: "column" }}>
        {/* Top-right controls */}
        <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 8, zIndex: 10 }}>
          <div className="entry-toggle-pill">
            <button
              className={lang === "es" ? "active" : ""}
              onClick={() => { changeLang("es"); setCookie("lang", "es", 31536000); }}
            >
              ES
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => { changeLang("en"); setCookie("lang", "en", 31536000); }}
            >
              EN
            </button>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={lang === "es" ? "Cambiar tema claro u oscuro" : "Switch between light and dark theme"}
            style={{
              width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", background: "var(--ec-surface-2)",
              border: "1px solid var(--ec-hairline)", cursor: "pointer",
              color: "var(--ec-text-muted)", transition: "all 140ms",
            }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <form onSubmit={handleLogin} className="fade-in-up" style={{ width: "100%", maxWidth: 380 }}>
            {/* Eyebrow */}
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ec-brand-glow)", marginBottom: 14 }}>
              ⎯⎯&nbsp;&nbsp;{t.eyebrow}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 48, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ec-text)", marginBottom: 8 }}>
              {t.welcome}
            </h1>
            <p style={{ color: "var(--ec-text-muted)", fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
              {t.sub}
            </p>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Email */}
              <div>
                <label htmlFor="login-email" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ec-text-muted)", marginBottom: 6 }}>
                  <AtSign size={11} aria-hidden /> {t.email}
                </label>
                <input
                  id="login-email"
                  className="ec-field-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ec-text-muted)", marginBottom: 6 }}>
                  <Lock size={11} aria-hidden /> {t.password}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    className="ec-field-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    aria-pressed={showPassword}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ec-text-muted)", padding: 0, display: "flex" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="ec-btn-primary"
                style={{ width: "100%", height: 48, fontSize: 15, marginTop: 8, justifyContent: "center", gap: 10 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                    {t.loading}
                  </>
                ) : (
                  <>
                    {t.btn}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1, background: "var(--ec-hairline)" }} />
                <span style={{ fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 10, color: "var(--ec-text-muted)" }}>
                  {t.divider}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--ec-hairline)" }} />
              </div>

              {/* Back button */}
              <button
                type="button"
                onClick={() => goToLanding?.()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  alignSelf: "center", background: "none", border: "none",
                  cursor: "pointer", color: "var(--ec-text-muted)",
                  fontSize: 13, fontWeight: 500, padding: "6px 0",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ec-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ec-text-muted)")}
              >
                <ArrowLeft size={14} />
                {t.back}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--ec-text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ec-hairline)" }}>
          <span>{t.rights}</span>
          <span style={{ display: "flex", gap: 14 }}>
            <a href="/legal/privacy-policy" style={{ color: "inherit", textDecoration: "underline" }}>
              {lang === "es" ? "Privacidad" : "Privacy"}
            </a>
            <a href="/accessibility" style={{ color: "inherit", textDecoration: "underline" }}>
              {lang === "es" ? "Accesibilidad" : "Accessibility"}
            </a>
          </span>
          <span>E-COMMETRICS</span>
        </div>
      </div>
    </div>
  );
}
