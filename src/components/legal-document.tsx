"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLang } from "@/app/context/LangContext";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalContent = {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;

function linkify(text: string): ReactNode[] {
  return text.split(EMAIL).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={`mailto:${part}`} style={{ color: "var(--ec-text)", textDecoration: "underline" }}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function LegalDocument({ content }: { content: Record<"es" | "en", LegalContent> }) {
  const { lang, changeLang } = useLang();
  const doc = content[lang];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="focus:outline-none"
      style={{ background: "var(--ec-surface-1)", color: "var(--ec-text)", minHeight: "100vh" }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 96px" }}>
        <header
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12, marginBottom: 40,
          }}
        >
          <Link href="/" style={{ color: "var(--ec-text)", fontSize: 14, textDecoration: "underline" }}>
            {lang === "es" ? "← Volver al inicio" : "← Back to home"}
          </Link>
          <div role="group" aria-label={lang === "es" ? "Idioma" : "Language"} style={{ display: "flex", gap: 6 }}>
            {(["es", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => changeLang(code)}
                aria-pressed={lang === code}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: "1px solid var(--ec-hairline-strong)",
                  background: lang === code ? "var(--ec-text)" : "transparent",
                  color: lang === code ? "var(--ec-surface-1)" : "var(--ec-text)",
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <h1
          style={{
            fontFamily: "Instrument Serif, serif", fontSize: 44, fontWeight: 400,
            lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0,
          }}
        >
          {doc.title}
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--ec-text-muted)" }}>{doc.updated}</p>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14, lineHeight: 1.65, fontSize: 16 }}>
          {doc.intro.map((paragraph, index) => (
            <p key={index} style={{ margin: 0 }}>{linkify(paragraph)}</p>
          ))}
        </div>

        {doc.sections.map((section) => (
          <section key={section.heading} style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{section.heading}</h2>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.65, fontSize: 16 }}>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} style={{ margin: 0 }}>{linkify(paragraph)}</p>
              ))}
              {section.bullets && (
                <ul style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{linkify(bullet)}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
