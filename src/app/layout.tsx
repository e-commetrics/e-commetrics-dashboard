import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LangProvider } from "@/app/context/LangContext";
import { RegionProvider } from "@/app/context/RegionContext";
import { MotionProvider } from "@/components/motion-provider";
import SkipLink from "@/components/skip-link";

// Brand Board: Montserrat for the interface, Breston for page titles and client names.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const breston = localFont({
  src: "./fonts/Breston-Regular.otf",
  variable: "--font-breston",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://e-commetrics.com"),
  title: "E-commetrics | Dashboard & E-commerce Solutions for B2B and B2C",
  description:
    "E-commerce consulting with a team of digital experts in marketing and tech dev-ops, assembled, especially for B2B and B2C",
  keywords: [
    "E-commetrics",
    "e-commerce consulting",
    "digital marketing",
    "dev-ops",
    "B2B e-commerce",
    "B2C e-commerce",
    "e-commerce dashboard",
    "e-commerce solutions",
    "marketing analytics",
  ],
  authors: [{ name: "E-commetrics Team", url: "https://e-commetrics.com" }],
  creator: "E-commetrics",
  publisher: "E-commetrics",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
  openGraph: {
    title: "E-commetrics | Dashboard & E-commerce Solutions for B2B and B2C",
    description:
      "E-commerce consulting with a team of digital experts in marketing and tech dev-ops, assembled, especially for B2B and B2C",
    url: "https://e-commetrics.com/",
    siteName: "E-commetrics",
    locale: "es_mx",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${breston.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LangProvider>
            <SkipLink />
            <RegionProvider>
              <AuthProvider>
                <MotionProvider>{children}</MotionProvider>
              </AuthProvider>
            </RegionProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
