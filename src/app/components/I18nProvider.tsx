"use client";

// Split out of i18n.tsx so that i18n.tsx exports only non-components (context,
// hook, dictionaries) and this file exports only the provider component —
// satisfying react-refresh/only-export-components without suppressing the rule.
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { I18nContext, type I18nValue, type Lang, TRANSLATIONS } from "./i18n";

function detectInitialLang(): Lang {
  const saved = localStorage.getItem("mc-lang") as Lang | null;
  if (saved && TRANSLATIONS[saved]) return saved;
  // No saved preference → respect the device's default language.
  const cands =
    typeof navigator !== "undefined" && navigator.languages && navigator.languages.length
      ? navigator.languages
      : [typeof navigator !== "undefined" ? navigator.language : ""];
  for (const raw of cands) {
    const c = (raw || "").toLowerCase();
    if (c.startsWith("ko")) return "ko";
    if (c.startsWith("ja")) return "ja";
    if (c.startsWith("zh")) return "zh";
    if (c.startsWith("en")) return "en";
  }
  return "ko";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Resolve language in the initializer (avoids setState-in-effect).
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("mc-lang", l);
    setLangState(l);
  };

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t: TRANSLATIONS[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
