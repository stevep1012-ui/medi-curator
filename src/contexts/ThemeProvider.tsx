import { useEffect, useState, type ReactNode } from 'react';
import type { Theme } from '../types';
import { ThemeContext } from './themeContext';

function getAutoTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('medi-theme') as Theme) || 'auto';
  });

  const resolvedTheme = theme === 'auto' ? getAutoTheme() : theme;

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('medi-theme', t);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const interval = setInterval(() => {
      const root = document.documentElement;
      const auto = getAutoTheme();
      if (auto === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    }, 60000);
    return () => clearInterval(interval);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
