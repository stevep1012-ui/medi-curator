import { Apple, LogIn, LogOut, MessageCircle, Sun, Moon, Monitor, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/useTheme';
import { useLanguage } from '../contexts/useLanguage';
import type { Language, Theme } from '../types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'ES' },
];

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

interface HeaderProps {
  isProMode: boolean;
  onToggleProMode: () => void;
}

export default function Header({ isProMode, onToggleProMode }: HeaderProps) {
  const { user, loginWithProvider, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const cycleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'auto'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent hidden sm:block">
            {t.appName}
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* Pro Mode Toggle */}
          <button
            onClick={onToggleProMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isProMode
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            PRO
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'light' ? t.lightMode : theme === 'dark' ? t.darkMode : t.autoMode}
          >
            <ThemeIcon className="w-4 h-4" />
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
            >
              <Globe className="w-4 h-4" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              {LANGUAGES.find((l) => l.code === language)?.label}
            </button>
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => loginWithProvider('google')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                title="Google 로그인"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google</span>
              </button>
              <button
                onClick={() => loginWithProvider('apple')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-black transition-colors"
                title="Apple 로그인"
              >
                <Apple className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Apple</span>
              </button>
              <button
                onClick={() => loginWithProvider('kakao')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-300 text-slate-900 text-xs font-medium hover:bg-yellow-400 transition-colors"
                title="Kakao 로그인"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kakao</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
