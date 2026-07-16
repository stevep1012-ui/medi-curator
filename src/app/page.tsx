"use client";

import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
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
import PharmacyFinder from "./components/PharmacyFinder";
import SearchHistory from "./components/SearchHistory";
import PrivacySettings from "./components/PrivacySettings";
import MemberOnboarding from "./components/MemberOnboarding";
import {
  AccountMenu,
  LoginGate,
  ProductFooter,
  Toaster,
  TrustStrip,
} from "./components/Chrome";
import { toast, useAuth, ACCT_TOASTS } from "./components/chrome-helpers";
import { FREE_USAGE_COPY } from "../config/usageLimits";
import { loadMemberProfile, type MemberProfileT } from "../services/memberProfileService";

// Three.js is visually valuable but heavy. Keep it out of the first app chunk so
// text, login, and core tools become interactive before the hero ornament loads.
const HeroCanvas = lazy(() => import("./components/HeroCanvas"));

type ThemeMode = "auto" | "light" | "dark";

function LockedFeature({ onSignIn }: { onSignIn: (provider: string) => void }) {
  return (
    <section className="rounded-[22px] border border-brand-tint-2 bg-brand-tint/45 p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
        <PulseIcon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em] text-ink">로그인 후 이용할 수 있어요</h2>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">
        게스트는 메뉴와 제품 흐름을 둘러볼 수 있습니다. 증상 분석, 약 사진 판독, 복용 검사, 기록 저장은 무료 회원으로 로그인한 뒤 사용할 수 있어요.
      </p>
      <div className="mx-auto mt-5 grid max-w-sm gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSignIn("google")}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-ink px-4 text-[13.5px] font-extrabold text-surface transition hover:opacity-90 active:scale-[0.98]"
        >
          Google로 시작
        </button>
        <button
          type="button"
          onClick={() => onSignIn("naver")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 text-[13.5px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand active:scale-[0.98]"
        >
          Naver로 시작
        </button>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-ink-4">
        무료 회원은 {FREE_USAGE_COPY.monthlyLabelKo}까지 AI 기능을 사용할 수 있고, 이후에는 Plus 플랜 안내를 확인하게 됩니다.
      </p>
    </section>
  );
}

// Night window: 18:00 — 06:00 local time
function isNightNow() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

function HomeInner() {
  const { t, lang } = useI18n();
  const { provider, user, signIn, signOut } = useAuth();
  const [view, setView] = useState<ViewId>("home");
  const isGuest = provider === "guest";
  const [memberProfile, setMemberProfile] = useState<MemberProfileT | null | undefined>(undefined);
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
    setMemberProfile(undefined);
    const ok = await signIn(p);
    if (!ok) return; // failed/cancelled login: no "welcome" toast
    const name = p === "guest" ? ACCT_TOASTS[lang].welcome : `${ACCT_TOASTS[lang].welcome} · ${p[0].toUpperCase() + p.slice(1)}`;
    toast(name);
  };
  const onSignOut = () => {
    signOut();
    setMemberProfile(undefined);
    toast(ACCT_TOASTS[lang].bye);
  };

  useEffect(() => {
    if (!user || provider === "guest") {
      return;
    }
    let alive = true;
    loadMemberProfile(user.uid, user.email)
      .then((profile) => {
        if (alive) setMemberProfile(profile);
      });
    return () => {
      alive = false;
    };
  }, [provider, user]);

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
        <header className="hero hero-3d-entrance relative mb-2 overflow-hidden rounded-[20px] px-5 pb-9 pt-5 sm:px-9 sm:pb-12 sm:pt-7">
          <div className="hero-bg" />
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>

          <div className="relative z-[3]">
            {/* Brand row */}
            <div className="entrance-layer flex items-center justify-between gap-3">
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
                {provider && (
                  <AccountMenu
                    provider={provider}
                    displayName={memberProfile?.nickname ?? user?.displayName?.split(" ")[0]}
                    answerEmail={memberProfile?.answerEmail ?? user?.email ?? undefined}
                    onEditProfile={provider !== "guest" && user ? () => setView("privacy") : undefined}
                    onSignOut={onSignOut}
                  />
                )}
              </div>
            </div>

            <div className="entrance-layer mt-10 sm:mt-14" style={{ animationDelay: "110ms" }}>
              <div className="mb-3.5 flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{t.brand.tag}</span>
              </div>
              <h1 className="max-w-[20ch] text-[clamp(1.85rem,5vw,2.85rem)] font-bold leading-[1.08] tracking-[-0.035em] text-ink text-balance">
                {heading[0]}
              </h1>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-2 sm:text-[15.5px]">{heading[1]}</p>
              {view === "home" && (
                <>
                  <div className="mt-5 grid max-w-xl gap-2.5 sm:grid-cols-3">
                    {[
                      ["사진 인식", "처방전·약봉투"],
                      ["로컬 약 목록", "원본 사진 저장 없음"],
                      ["상담 요약", "내보내기 가능"],
                    ].map(([title, body]) => (
                      <div key={title} className="premium-chip rounded-2xl px-3.5 py-3">
                        <p className="text-[12.5px] font-black tracking-[-0.02em] text-ink">{title}</p>
                        <p className="mt-1 text-[11px] font-semibold leading-snug text-ink-3">{body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView("mymeds")}
                      className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink pl-5 pr-2 text-[13.5px] font-extrabold text-surface shadow-[0_20px_54px_-28px_rgba(0,0,0,.85)] transition hover:-translate-y-0.5 hover:bg-brand active:scale-[0.98]"
                    >
                      약 사진으로 시작
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 transition group-hover:translate-x-0.5">›</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("interaction")}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-surface/85 px-5 text-[13.5px] font-extrabold text-ink-2 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-tint-2 hover:text-brand active:scale-[0.98]"
                    >
                      상담 준비하기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <TrustStrip />

        {provider && provider !== "guest" && user && memberProfile === undefined ? (
          <div className="mt-6">
            <section className="rounded-[18px] border border-line bg-surface p-6 text-[13px] font-bold text-ink-3">회원 정보를 확인하는 중입니다…</section>
          </div>
        ) : provider && provider !== "guest" && user && !memberProfile ? (
          <div className="mt-6">
            <MemberOnboarding user={user} onComplete={setMemberProfile} />
          </div>
        ) : view === "home" ? (
          <MenuCards onPick={setView} uid={user?.uid} />
        ) : (
          <div className="mt-6" style={{ ["--tool" as string]: ACCENT[view as MenuId] } as CSSProperties}>
            <ToolNav active={view} onGo={setView} />
            <div className="relative min-w-0 overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_50px_-34px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--tool, var(--brand))" }} />
              <div
                key={view}
                className="p-5 pt-6 sm:p-7 motion-safe:animate-[pageflip_0.42s_cubic-bezier(0.2,0.7,0.2,1)] [transform-origin:left_center]"
              >
                {isGuest ? (
                  <LockedFeature onSignIn={onSignIn} />
                ) : (
                  <>
                    {view === "symptom" && <SymptomAnalysis uid={user?.uid} />}
                    {view === "interaction" && <InteractionCheck uid={user?.uid} />}
                    {view === "vitamin" && <VitaminPairing uid={user?.uid} />}
                    {view === "mymeds" && <MyMeds uid={user?.uid} />}
                    {view === "pharmacy" && <PharmacyFinder />}
                    {view === "history" && <SearchHistory />}
                    {view === "privacy" && (
                      <PrivacySettings
                        uid={user?.uid}
                        user={user}
                        memberProfile={memberProfile}
                        onProfileSaved={setMemberProfile}
                        onGoToMeds={() => setView("mymeds")}
                      />
                    )}
                    <NextSteps active={view as MenuId} onGo={(id) => setView(id)} />
                  </>
                )}
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
