import { createContext } from 'react';
import type { Theme } from '../types';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
