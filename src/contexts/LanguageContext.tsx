"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { type Language, translate } from "@/lib/translations";
import { loadSettings, saveSettings } from "@/utils/gameSettings";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from settings on mount
  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setLanguageState(settings.language);
      document.documentElement.lang = settings.language;
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    const settings = await loadSettings();
    await saveSettings({ ...settings, language: lang });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(key, language, params),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
