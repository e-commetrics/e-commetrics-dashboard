import type { Metadata } from "next";
import LegalDocument, { type LegalContent } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Accessibility statement | E-commetrics",
  description:
    "E-commetrics accessibility statement: the standard we use, the current state of the site, its known limitations and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
};

const content: Record<"es" | "en", LegalContent> = {
  es: {
    title: "Declaración de accesibilidad",
    updated: "Última actualización: 30 de octubre de 2026",
    intro: [
      "Queremos que e-commetrics.com se pueda usar con teclado, con lector de pantalla y en pantallas de distintos tamaños. Tomamos como referencia las pautas WCAG 2.1 nivel AA.",
      "Esta declaración describe el estado actual del sitio. No afirma que cumpla todas las pautas: las limitaciones conocidas están más abajo.",
    ],
    sections: [
      {
        heading: "Qué hemos hecho",
        paragraphs: [
          "El 13 de octubre de 2026 revisamos con la herramienta automática axe las pantallas públicas del sitio (entrada, página principal, inicio de sesión, formulario de paquetes y aviso de privacidad), en tema claro y oscuro, y corregimos los problemas críticos y serios que encontró.",
        ],
        bullets: [
          "Enlace para saltar al contenido principal al navegar con teclado.",
          "El idioma de la página se actualiza cuando cambias entre español e inglés, para que los lectores de pantalla lo lean con la voz correcta.",
          "Campos de inicio de sesión y del formulario de paquetes con etiqueta asociada, y botones de ícono con nombre accesible.",
          "Indicador de foco visible en los elementos interactivos.",
          "Ventana del formulario de paquetes y del chat identificadas como diálogos.",
        ],
      },
      {
        heading: "Limitaciones conocidas",
        paragraphs: [
          "Estamos trabajando en estos puntos y actualizaremos esta declaración cuando se resuelvan.",
        ],
        bullets: [
          "Aún no hemos probado con la herramienta automática las pantallas que requieren iniciar sesión (el panel y el CRM).",
          "Aún no hemos hecho pruebas manuales con lectores de pantalla (NVDA y VoiceOver).",
          "El chat no se ha probado con lectores de pantalla.",
        ],
      },
      {
        heading: "Cómo lo medimos",
        paragraphs: [
          "Usamos pruebas automáticas con axe y revisión con teclado de las funciones nuevas. Esto no es una auditoría de conformidad completa.",
        ],
      },
      {
        heading: "Reporta una barrera",
        paragraphs: [
          "Si hay algo del sitio que no puedes usar, escríbenos a admin@e-commetrics.com con la dirección de la página y qué problema tuviste. Te responderemos lo antes posible.",
        ],
      },
    ],
  },
  en: {
    title: "Accessibility statement",
    updated: "Last updated: October 30, 2026",
    intro: [
      "We want e-commetrics.com to be usable with a keyboard, with a screen reader and on screens of different sizes. We use the WCAG 2.1 Level AA guidelines as our reference.",
      "This statement describes the current state of the site. It does not claim that the site meets every guideline: the known limitations are listed below.",
    ],
    sections: [
      {
        heading: "What we have done",
        paragraphs: [
          "On October 13, 2026 we ran the axe automated tool on the public screens of the site (entry, home page, sign-in, package form and privacy notice), in light and dark themes, and fixed the critical and serious problems it found.",
        ],
        bullets: [
          "A link to skip to the main content when navigating with a keyboard.",
          "The page language updates when you switch between Spanish and English, so screen readers use the right voice.",
          "Sign-in and package form fields with associated labels, and icon buttons with an accessible name.",
          "A visible focus indicator on interactive elements.",
          "The package form window and the chat are identified as dialogs.",
        ],
      },
      {
        heading: "Known limitations",
        paragraphs: [
          "We are working on these points and will update this statement when they are resolved.",
        ],
        bullets: [
          "We have not yet tested the screens that require signing in (the dashboard and the CRM) with the automated tool.",
          "We have not yet done manual testing with screen readers (NVDA and VoiceOver).",
          "The chat has not been tested with screen readers.",
        ],
      },
      {
        heading: "How we measured",
        paragraphs: [
          "We used automated testing with axe and a keyboard review of the new features. This is not a full conformance audit.",
        ],
      },
      {
        heading: "Report a barrier",
        paragraphs: [
          "If something on the site is hard to use, write to admin@e-commetrics.com with the page address and the problem you had. We will reply as soon as we can.",
        ],
      },
    ],
  },
};

export default function AccessibilityPage() {
  return <LegalDocument content={content} />;
}
