"use client";

import { useLang } from "@/app/context/LangContext";

export default function SkipLink() {
  const { lang } = useLang();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg"
    >
      {lang === "es" ? "Saltar al contenido" : "Skip to content"}
    </a>
  );
}
