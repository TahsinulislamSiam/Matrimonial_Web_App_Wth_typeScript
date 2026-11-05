"use client";

import { createContext, useContext } from "react";
import { t, type Locale, type MsgKey } from "@/lib/i18n";

type I18nValue = {
  locale: Locale;
  tr: (key: MsgKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value: I18nValue = {
    locale,
    tr: (key, vars) => t(locale, key, vars),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LocaleProvider");
  return ctx;
}
