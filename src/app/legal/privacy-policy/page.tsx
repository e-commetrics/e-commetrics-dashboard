import type { Metadata } from "next";
import LegalDocument, { type LegalContent } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Privacy notice | E-commetrics",
  description:
    "What personal data E-commetrics collects on e-commetrics.com, why, who it is shared with and how to exercise your rights.",
  alternates: { canonical: "/legal/privacy-policy" },
};

const content: Record<"es" | "en", LegalContent> = {
  es: {
    title: "Aviso de privacidad",
    updated: "Última actualización: 13 de octubre de 2026 · Versión 1.0",
    intro: [
      "E-commetrics opera el sitio e-commetrics.com: una página pública, un formulario para recibir el resumen de un paquete y un espacio con inicio de sesión para clientes y equipo, que incluye un chatbot. Este aviso explica qué datos personales se tratan en el sitio, para qué, con quién se comparten y cómo puedes ejercer tus derechos.",
      "Para cualquier duda o solicitud sobre tus datos escribe a admin@e-commetrics.com.",
    ],
    sections: [
      {
        heading: "Datos que tratamos",
        bullets: [
          "Formulario de paquetes: tu correo electrónico y el paquete que consultaste, para enviarte el resumen.",
          "Chatbot: los mensajes que escribes y el idioma elegido, para generar las respuestas. Evita escribir datos sensibles (de salud, financieros o contraseñas) en el chat.",
          "Inicio de sesión: correo y contraseña de las personas autorizadas a usar el espacio de clientes.",
          "Espacio de clientes y CRM: información que nuestros clientes gestionan sobre sus propios contactos o prospectos (por ejemplo nombre, correo, teléfono, origen del contacto, respuestas de formularios, etapa y notas). En ese caso E-commetrics trata los datos por cuenta del cliente, que es quien decide para qué se usan.",
          "Datos técnicos: como en cualquier sitio web, nuestros servidores y proveedores pueden registrar la dirección IP, el tipo de navegador y la fecha y hora de las solicitudes. También usamos tu dirección IP para estimar si visitas desde México o Estados Unidos y mostrarte los precios de tu región; esa consulta se hace en nuestro propio servidor.",
        ],
      },
      {
        heading: "Qué se guarda en tu navegador",
        paragraphs: [
          "Usamos una cookie llamada lang para recordar tu idioma (hasta 1 año), una cookie llamada sidebar_state para recordar si el menú lateral está abierto (7 días), tu preferencia de tema claro u oscuro, y los datos de sesión necesarios para mantener tu inicio de sesión. Son datos de funcionamiento.",
          "A la fecha de esta versión, el sitio no usa herramientas de analítica ni de publicidad de terceros.",
        ],
      },
      {
        heading: "Para qué los usamos",
        bullets: [
          "Enviarte el resumen del paquete que pediste.",
          "Responder tus mensajes en el chatbot.",
          "Permitirte iniciar sesión y usar el espacio de clientes.",
          "Operar el CRM y las aplicaciones que los clientes contratan.",
        ],
        paragraphs: ["No usamos tus datos para fines distintos sin avisarte antes y, cuando la ley lo exija, sin tu consentimiento."],
      },
      {
        heading: "Con quién los compartimos",
        paragraphs: [
          "No vendemos tus datos personales. Los procesan proveedores que nos ayudan a operar el sitio: alojamiento e infraestructura, envío de correos y el servicio de inteligencia artificial externo que genera las respuestas del chatbot. En el CRM, y solo si el cliente lo activa, también intervienen servicios de mensajería (correo y WhatsApp) y de Meta (sincronización de formularios y eventos de conversión).",
          "Podemos entregar datos a autoridades cuando la ley lo exija.",
        ],
      },
      {
        heading: "Cuánto tiempo los conservamos",
        paragraphs: [
          "Conservamos los datos solo el tiempo necesario para las finalidades anteriores y después los borramos o los volvemos anónimos. En los datos del CRM, el plazo lo define el cliente responsable.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          "Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su tratamiento, y retirar tu consentimiento. Escribe a admin@e-commetrics.com con tu nombre, el correo que usaste y el derecho que quieres ejercer. Podemos pedirte una identificación para confirmar que eres tú. Responderemos dentro del plazo que marca la ley.",
          "Si tus datos están en el CRM de uno de nuestros clientes, también puedes dirigirte directamente a ese cliente.",
        ],
      },
      {
        heading: "Residentes de California",
        paragraphs: [
          "Si vives en California, puedes escribir a admin@e-commetrics.com para preguntar qué información personal tenemos sobre ti o pedir que la borremos. Responderemos como lo exige la ley aplicable. El sitio no rastrea a los visitantes entre otros sitios web.",
        ],
      },
      {
        heading: "Menores de edad",
        paragraphs: ["El sitio no está dirigido a menores de 13 años y no recabamos sus datos de forma consciente."],
      },
      {
        heading: "Cambios a este aviso",
        paragraphs: ["Publicaremos aquí cualquier cambio, con su fecha y versión, y conservaremos las versiones anteriores."],
      },
    ],
  },
  en: {
    title: "Privacy notice",
    updated: "Last updated: October 13, 2026 · Version 1.0",
    intro: [
      "E-commetrics operates e-commetrics.com: a public page, a form to receive a package summary and a sign-in area for clients and staff, which includes a chatbot. This notice explains what personal data is handled on the site, why, who it is shared with and how you can exercise your rights.",
      "For any question or request about your data, write to admin@e-commetrics.com.",
    ],
    sections: [
      {
        heading: "Data we handle",
        bullets: [
          "Package form: your email address and the package you looked at, to send you the summary.",
          "Chatbot: the messages you type and your chosen language, to generate replies. Please avoid typing sensitive data (health, financial or passwords) in the chat.",
          "Sign-in: email and password of the people authorized to use the client area.",
          "Client area and CRM: information that our clients manage about their own contacts or leads (for example name, email, phone, where the contact came from, form answers, stage and notes). In that case E-commetrics handles the data on behalf of the client, who decides what it is used for.",
          "Technical data: as on any website, our servers and providers may record the IP address, browser type and the date and time of requests. We also use your IP address to estimate whether you are visiting from Mexico or the United States and show you the prices for your region; that lookup is done on our own server.",
        ],
      },
      {
        heading: "What is stored in your browser",
        paragraphs: [
          "We use a cookie named lang to remember your language (up to 1 year), a cookie named sidebar_state to remember whether the side menu is open (7 days), your light or dark theme preference, and the session data needed to keep you signed in. This is functional data.",
          "As of this version, the site does not use third-party analytics or advertising tools.",
        ],
      },
      {
        heading: "What we use it for",
        bullets: [
          "Sending you the package summary you asked for.",
          "Answering your messages in the chatbot.",
          "Letting you sign in and use the client area.",
          "Operating the CRM and the applications that clients subscribe to.",
        ],
        paragraphs: ["We do not use your data for other purposes without telling you first and, when the law requires it, without your consent."],
      },
      {
        heading: "Who we share it with",
        paragraphs: [
          "We do not sell your personal data. It is processed by providers that help us run the site: hosting and infrastructure, email delivery and the external artificial-intelligence service that generates the chatbot's replies. In the CRM, and only if the client turns them on, messaging services (email and WhatsApp) and Meta (form sync and conversion events) are also involved.",
          "We may disclose data to authorities when the law requires it.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "We keep data only as long as needed for the purposes above and then delete it or make it anonymous. For CRM data, the period is set by the responsible client.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You can access, correct or delete your data, object to its use and withdraw your consent. Write to admin@e-commetrics.com with your name, the email you used and the right you want to exercise. We may ask for an ID to confirm it is you. We will answer within the time the law sets.",
          "If your data is in the CRM of one of our clients, you can also contact that client directly.",
        ],
      },
      {
        heading: "California residents",
        paragraphs: [
          "If you live in California, you may write to admin@e-commetrics.com to ask what personal information we hold about you or to ask us to delete it. We will respond as required by applicable law. The site does not track visitors across other websites.",
        ],
      },
      {
        heading: "Children",
        paragraphs: ["The site is not directed to children under 13 and we do not knowingly collect their data."],
      },
      {
        heading: "Changes to this notice",
        paragraphs: ["We will post any changes here with their date and version, and keep previous versions."],
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  return <LegalDocument content={content} />;
}
