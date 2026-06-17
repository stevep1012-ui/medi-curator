"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AutoIcon, MoonIcon, PulseIcon, SunIcon } from "./components/icons";
import { useI18n } from "./components/i18n";
import { I18nProvider } from "./components/I18nProvider";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { HOME_HEAD, ACCENT, type ViewId, type MenuId } from "./components/Menu";
import { MenuCards, ToolNav } from "./components/menu-views";
import SymptomAnalysis from "./components/SymptomAnalysis";
import InteractionCheck from "./components/InteractionCheck";
import VitaminPairing from "./components/VitaminPairing";
import { VITAMIN_HEAD } from "./components/vitamin-data";
import MyMeds from "./components/MyMeds";
import { MYMEDS_HEAD } from "./components/mymeds-data";
import NextSteps from "./components/NextSteps";
import HeroCanvas from "./components/HeroCanvas";
import PharmacyFinder from "./components/PharmacyFinder";
import SearchHistory from "./components/SearchHistory";
import PrivacySettings from "./components/PrivacySettings";
import {
  AccountMenu,
  LoginGate,
  ProductFooter,
  Toaster,
  TrustStrip,
} from "./components/Chrome";
import { toast, useAuth, ACCT_TOASTS } from "./components/chrome-helpers";

type ThemeMode = "auto" | "light" | "dark";

// Night window: 18:00 — 06:00 local time
function isNightNow() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

function HomeInner() {
  const { t, lang } = useI18n();
  const { provider, user, signIn, signOut } = useAuth();
  const [view, setView] = useState<ViewId>("home");
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("mc-theme") as ThemeMode | null;
    return saved === "auto" || saved === "light" || saved === "dark" ? saved : "auto";
  });
  const [isNight, setIsNight] = useState(false);

  // Re-evaluate time-of-day every minute so it flips at the boundary
  useEffect(() => {
    const tick = () => setIsNight(isNightNow());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const dark = mode === "dark" || (mode === "auto" && isNight);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const cycleMode = () => {
    setMode((m) => {
      const next: ThemeMode = m === "auto" ? "light" : m === "light" ? "dark" : "auto";
      localStorage.setItem("mc-theme", next);
      return next;
    });
  };

  const onSignIn = async (p: string) => {
    const ok = await signIn(p);
    if (!ok) return; // failed/cancelled login: no "welcome" toast
    const name = p === "guest" ? ACCT_TOASTS[lang].welcome : `${ACCT_TOASTS[lang].welcome} · ${p[0].toUpperCase() + p.slice(1)}`;
    toast(name);
  };
  const onSignOut = () => {
    signOut();
    toast(ACCT_TOASTS[lang].bye);
  };

  const themeIcon =
    mode === "auto" ? <AutoIcon className="h-4 w-4" /> : dark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />;
  const themeLabel =
    mode === "auto"
      ? `${t.theme.auto} · ${isNight ? t.theme.night : t.theme.day}`
      : mode === "dark"
      ? t.theme.dark
      : t.theme.light;

  const heading =
    view === "home"
      ? HOME_HEAD[lang]
      : view === "vitamin"
        ? VITAMIN_HEAD[lang]
        : view === "mymeds"
          ? MYMEDS_HEAD[lang]
          : t.head[view];

  return (
    <main className="min-h-screen bg-paper px-4 pb-12 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
      <section className="mx-auto w-full max-w-5xl">
        {/* HERO: calm editorial surface (refined, minimal) */}
        <header className="hero relative mb-2 overflow-hidden rounded-[20px] px-5 pb-9 pt-5 sm:px-9 sm:pb-12 sm:pt-7">
          <div className="hero-bg" />
          <HeroCanvas />

          <div className="relative z-[3]">
            {/* Brand row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-ink text-surface ring-1 ring-black/5">
                  <PulseIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="leading-tight">
                  <p className="whitespace-nowrap text-[16px] font-bold tracking-[-0.02em] text-ink">{t.brand.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={cycleMode}
                  title={themeLabel}
                  className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[9px] border border-line bg-surface/80 px-2.5 text-[11.5px] font-semibold text-ink-2 backdrop-blur transition hover:bg-surface hover:text-ink"
                  aria-label={`Theme: ${themeLabel}`}
                >
                  {themeIcon}
                  <span className="hidden sm:inline">{themeLabel}</span>
                </button>
                {provider && <AccountMenu provider={provider} onSignOut={onSignOut} />}
              </div>
            </div>

            <div className="mt-10 sm:mt-14">
              <div className="mb-3.5 flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{t.brand.tag}</span>
              </div>
              <h1 className="max-w-[20ch] text-[clamp(1.85rem,5vw,2.85rem)] font-bold leading-[1.08] tracking-[-0.035em] text-ink text-balance">
                {heading[0]}
              </h1>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-2 sm:text-[15.5px]">{heading[1]}</p>
            </div>
          </div>
        </header>

        <TrustStrip />

        {view === "home" ? (
          <MenuCards onPick={setView} />
        ) : (
          <div className="mt-6" style={{ ["--tool" as string]: ACCENT[view as MenuId] } as CSSProperties}>
            <ToolNav active={view} onGo={setView} />
            <div className="relative min-w-0 overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_50px_-34px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--tool, var(--brand))" }} />
              <div
                key={view}
                className="p-5 pt-6 sm:p-7 motion-safe:animate-[pageflip_0.42s_cubic-bezier(0.2,0.7,0.2,1)] [transform-origin:left_center]"
              >
                {view === "symptom" && <SymptomAnalysis />}
                {view === "interaction" && <InteractionCheck />}
                {view === "vitamin" && <VitaminPairing />}
                {view === "mymeds" && <MyMeds uid={user?.uid} />}
                {view === "pharmacy" && <PharmacyFinder />}
                {view === "history" && <SearchHistory />}
                {view === "privacy" && <PrivacySettings uid={user?.uid} />}
                <NextSteps active={view as MenuId} onGo={(id) => setView(id)} />
              </div>
            </div>
          </div>
        )}

        <ProductFooter disclaimer={t.footer} />
      </section>

      {!provider && <LoginGate onSignIn={onSignIn} />}
      <Toaster />
    </main>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeInner />
    </I18nProvider>
  );
}
