"use client";

import React, {
  createContext,
  useEffect,
  useSyncExternalStore,
  ReactNode,
  useContext,
} from "react";
import Cookies from "js-cookie";

type LangType = "es" | "en";

interface LangContextProps {
  lang: LangType;
  changeLang: (newLang: LangType) => void;
}

const LangContext = createContext<LangContextProps>({
  lang: "es",
  changeLang: () => {},
});

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readLang(): LangType {
  return Cookies.get("lang") === "en" ? "en" : "es";
}

function readServerLang(): LangType {
  return "es";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, readServerLang);

  useEffect(() => {
    if (!Cookies.get("lang")) Cookies.set("lang", "es", { expires: 365, sameSite: "lax", secure: window.location.protocol === "https:" });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLang = (newLang: LangType) => {
    Cookies.set("lang", newLang, { expires: 365, sameSite: "lax", secure: window.location.protocol === "https:" });
    listeners.forEach((listener) => listener());
  };

  return (
    <LangContext.Provider value={{ lang, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

// Custom hook para usar el contexto de idioma
export function useLang() {
  return useContext(LangContext);
}
