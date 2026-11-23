"use client";

import {
  LOCALE_STORAGE_KEY,
  Locale,
  Messages,
  messages,
} from "@/lib/i18n/messages";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Messages;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  statusLabel: (value: string) => string;
  formatMoney: (value: number | string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.documentElement.dataset.locale = locale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial: Locale = "fr";
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "ar" || saved === "fr") initial = saved;
    } catch {
      /* ignore */
    }
    setLocaleState(initial);
    applyDocumentLocale(initial);
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyDocumentLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "fr" : "ar");
  }, [locale, setLocale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = messages[locale];
    return {
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t,
      setLocale,
      toggleLocale,
      statusLabel: (code: string) =>
        (t.status as Record<string, string>)[code] || code,
      formatMoney: (amount: number | string) =>
        `${Number(amount).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")} ${locale === "ar" ? "درهم" : "MAD"}`,
    };
  }, [locale, setLocale, toggleLocale]);

  // Avoid flashing wrong direction before localStorage is read
  if (!ready) {
    return <div className="min-h-screen bg-[#f4f5f7]" />;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
