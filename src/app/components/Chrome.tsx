"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, type Lang } from "./i18n";
import { LegalModal } from "./LegalModal";
import { type LegalKey } from "./Legal";
import { type ToastDetail } from "./chrome-helpers";

/* ---------------- toast (emitter + copy + useAuth live in chrome-helpers.ts) ---------------- */
const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string; out?: boolean }[]>([]);
  useEffect(() => {
    const onToast = (e: Event) => {
      const { msg } = (e as CustomEvent<ToastDetail>).detail;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, msg }]);
      setTimeout(() => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, out: true } : x))), 2200);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2520);
    };
    window.addEventListener("mq-toast", onToast);
    return () => window.removeEventListener("mq-toast", onToast);
  }, []);
  return (
    <div id="toastWrap">
      {items.map((t) => (
        <div key={t.id} className={`toast${t.out ? " out" : ""}`}>
          {CheckIcon}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- trust strip ---------------- */
const TRUST: Record<Lang, string[]> = {
  ko: ["약사 감수 정보", "개인정보 안전 보호", "4개 언어 지원"],
  en: ["Pharmacist-reviewed", "Privacy protected", "4 languages"],
  ja: ["薬剤師監修の情報", "プライバシー保護", "4言語対応"],
  zh: ["药师审核信息", "隐私安全保护", "支持4种语言"],
};
export function TrustStrip() {
  const { lang } = useI18n();
  return (
    <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 text-[12px] font-semibold text-ink-3">
      {TRUST[lang].map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {s}
        </span>
      ))}
    </div>
  );
}

/* ---------------- product footer ---------------- */
const FOOTER: Record<Lang, { tagline: string; links: string[]; biz: string; copy: string }> = {
  ko: {
    tagline: "증상 분석부터 약국 찾기까지, 일상 건강을 돕는 AI 가이드입니다.",
    links: ["서비스 소개", "이용약관", "개인정보처리방침", "자주 묻는 질문", "고객센터", "공지사항"],
    biz: "메디큐레이터 · 고객센터 1577-0000 · help@mediq.health",
    copy: "© 2026 MediQ. All rights reserved.",
  },
  en: {
    tagline: "From symptom analysis to finding a pharmacy — an AI guide for everyday health.",
    links: ["About", "Terms of Service", "Privacy Policy", "FAQ", "Support", "Notices"],
    biz: "MediQ · Support 1577-0000 · help@mediq.health",
    copy: "© 2026 MediQ. All rights reserved.",
  },
  ja: {
    tagline: "症状分析から薬局探しまで、毎日の健康を支えるAIガイド。",
    links: ["サービス紹介", "利用規約", "プライバシー", "よくある質問", "サポート", "お知らせ"],
    biz: "MediQ · サポート 1577-0000 · help@mediq.health",
    copy: "© 2026 MediQ. All rights reserved.",
  },
  zh: {
    tagline: "从症状分析到查找药房——助力日常健康的AI向导。",
    links: ["关于服务", "使用条款", "隐私政策", "常见问题", "客户支持", "公告"],
    biz: "MediQ · 客服 1577-0000 · help@mediq.health",
    copy: "© 2026 MediQ 版权所有。",
  },
};
export function ProductFooter({ disclaimer }: { disclaimer: string }) {
  const { t, lang } = useI18n();
  const f = FOOTER[lang];
  const [legal, setLegal] = useState<LegalKey | null>(null);
  const LEGAL_LINK: Record<number, LegalKey> = { 0: "about", 1: "terms", 2: "privacy", 3: "faq", 4: "support", 5: "notices" };
  return (
    <footer className="mt-12 sm:mt-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface px-5 py-4 text-center text-[12px] leading-relaxed text-ink-3 shadow-sm">
        {disclaimer}
      </div>
      <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-6 border-t border-line pt-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ink text-surface">
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l2-6 4 14 2-8h6" />
              </svg>
            </span>
            <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.02em] text-ink">{t.brand.name}</span>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">{f.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[13px]">
          {f.links.map((l, i) => {
            const key = LEGAL_LINK[i];
            return key ? (
              <button key={l} onClick={() => setLegal(key)} className="text-left text-ink-3 transition hover:text-brand">
                {l}
              </button>
            ) : (
              <a key={l} href="#" className="text-ink-3 transition hover:text-brand">
                {l}
              </a>
            );
          })}
        </nav>
      </div>
      <div className="mx-auto mt-7 flex max-w-5xl flex-col gap-2 border-t border-line pt-5 text-[11px] text-ink-4 sm:flex-row sm:items-center sm:justify-between">
        <p>{f.biz}</p>
        <p>{f.copy}</p>
      </div>
      <LegalModal docKey={legal} onClose={() => setLegal(null)} />
    </footer>
  );
}

/* ---------------- account chip + dropdown ---------------- */
const ACCT: Record<Lang, { account: string; guest: string; settings: string; help: string; signout: string }> = {
  ko: { account: "내 계정", guest: "게스트", settings: "환경설정", help: "고객센터", signout: "로그아웃" },
  en: { account: "Account", guest: "Guest", settings: "Preferences", help: "Support", signout: "Sign out" },
  ja: { account: "アカウント", guest: "ゲスト", settings: "環境設定", help: "サポート", signout: "ログアウト" },
  zh: { account: "我的账户", guest: "访客", settings: "偏好设置", help: "客户支持", signout: "退出登录" },
};
function providerMeta(p: string, guestLabel: string) {
  const m: Record<string, { name: string; bg: string; fg: string }> = {
    google: { name: "Google", bg: "#ffffff", fg: "#1f1f1f" },
    apple: { name: "Apple", bg: "#111111", fg: "#ffffff" },
    kakao: { name: "Kakao", bg: "#FEE500", fg: "#181600" },
    naver: { name: "Naver", bg: "#03C75A", fg: "#ffffff" },
  };
  return m[p] || { name: guestLabel, bg: "var(--brand)", fg: "#ffffff" };
}
export function AccountMenu({ provider, onSignOut }: { provider: string; onSignOut: () => void }) {
  const { lang } = useI18n();
  const ac = ACCT[lang];
  const pm = providerMeta(provider, ac.guest);
  const initial = (pm.name[0] || "·").toUpperCase();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  const avatar = (cls: string) => (
    <span className={`flex items-center justify-center rounded-full font-black ${cls}`} style={{ background: pm.bg, color: pm.fg, boxShadow: "inset 0 0 0 1px var(--line)" }}>
      {initial}
    </span>
  );
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[9px] border border-line bg-surface/80 pl-1.5 pr-2.5 text-[12px] font-semibold text-ink-2 backdrop-blur transition hover:bg-surface hover:text-ink"
        aria-haspopup="true"
      >
        {avatar("h-6 w-6 text-[11px]")}
        <span className="hidden sm:inline">{ac.account}</span>
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-ink-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.4)]">
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-4">{ac.account}</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13px] font-bold text-ink">{avatar("h-5 w-5 text-[10px]")}{pm.name}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <a href="#" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-2 transition hover:bg-surface-soft">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
            {ac.settings}
          </a>
          <a href="#" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-2 transition hover:bg-surface-soft">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.2" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
            {ac.help}
          </a>
          <div className="my-1 h-px bg-line" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-danger transition hover:bg-danger-tint"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            {ac.signout}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- auth (demo OAuth gate) ---------------- */
const AUTHC: Record<Lang, { title: string; sub: string; guest: string; note: string }> = {
  ko: { title: "로그인", sub: "건강 정보를 안전하게 보관하려면 로그인하세요.", guest: "로그인 없이 둘러보기", note: "Google·Apple·카카오·네이버 계정으로 로그인합니다. 정보는 안전하게 보호됩니다." },
  en: { title: "Sign in", sub: "Sign in to keep your health information secure.", guest: "Browse without signing in", note: "Sign in with Google, Apple, Kakao or Naver. Your data is protected." },
  ja: { title: "ログイン", sub: "健康情報を安全に保つにはログインしてください。", guest: "ログインせずに見る", note: "Google・Apple・カカオ・ネイバーのアカウントでログインします。情報は安全に保護されます。" },
  zh: { title: "登录", sub: "登录以安全保存您的健康信息。", guest: "不登录先浏览", note: "使用 Google、Apple、Kakao 或 Naver 账户登录。您的信息受到安全保护。" },
};
const OAUTH = [
  { id: "google", name: "Google", bg: "#ffffff", fg: "#1f1f1f", bd: "#e3e3e3" },
  { id: "apple", name: "Apple", bg: "#111111", fg: "#ffffff", bd: "#111111" },
  { id: "kakao", name: "Kakao", bg: "#FEE500", fg: "#181600", bd: "#FEE500" },
  { id: "naver", name: "Naver", bg: "#03C75A", fg: "#ffffff", bd: "#03C75A" },
];
function providerLabel(name: string, lang: Lang) {
  return lang === "ko" ? `${name}(으)로 계속` : lang === "ja" ? `${name}で続ける` : lang === "zh" ? `使用${name} 继续` : `Continue with ${name}`;
}
export function LoginGate({ onSignIn }: { onSignIn: (p: string) => void }) {
  const { lang } = useI18n();
  const a = AUTHC[lang];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(8,18,17,.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-[24px] border border-line bg-surface p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-surface ring-1 ring-black/5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 14 2-8h6" /></svg>
          </span>
          <h2 className="mt-4 text-[20px] font-bold tracking-tight text-ink">{a.title}</h2>
          <p className="mt-1.5 max-w-[16rem] text-[13px] leading-snug text-ink-3">{a.sub}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          {OAUTH.map((p) => (
            <button
              key={p.id}
              onClick={() => onSignIn(p.id)}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border text-[14px] font-bold shadow-sm transition hover:shadow-md"
              style={{ background: p.bg, color: p.fg, borderColor: p.bd }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-black" style={{ background: p.fg, color: p.bg }}>
                {p.name[0]}
              </span>
              {providerLabel(p.name, lang)}
            </button>
          ))}
        </div>
        <button onClick={() => onSignIn("guest")} className="mt-3.5 w-full text-center text-[12.5px] font-semibold text-ink-4 underline-offset-2 transition hover:text-ink-2 hover:underline">
          {a.guest}
        </button>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-4">{a.note}</p>
      </div>
    </div>
  );
}
