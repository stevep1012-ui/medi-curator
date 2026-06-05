import { createContext } from 'react';
import type { Language } from '../types';
import type { TranslationKeys } from '../i18n/translations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  t: TranslationKeys;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
