import { useState, type ReactNode } from 'react';
import type { Language } from '../types';
import translations from '../i18n/translations';
import { LanguageContext } from './languageContext';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('medi-lang') as Language) || 'ko';
  });

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('medi-lang', l);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
