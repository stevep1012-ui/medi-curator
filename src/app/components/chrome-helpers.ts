"use client";

// Non-component helpers split out of Chrome.tsx (toast emitter, account-toast
// copy, auth hook) so Chrome.tsx exports only components
// (react-refresh/only-export-components).
import { useState, useEffect } from "react";
import { type Lang } from "./i18n";
import { watchAuth, signInWithGoogle, signOutUser } from "../../firebase";
import type { User as FbUser } from "firebase/auth";

export type ToastDetail = { msg: string };

export function toast(msg: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>("mq-toast", { detail: { msg } }));
}

export const ACCT_TOASTS: Record<Lang, { welcome: string; bye: string; langChanged: string }> = {
  ko: { welcome: "환영합니다", bye: "로그아웃되었습니다", langChanged: "언어가 변경되었습니다" },
  en: { welcome: "Welcome", bye: "Signed out", langChanged: "Language changed" },
  ja: { welcome: "ようこそ", bye: "ログアウトしました", langChanged: "言語を変更しました" },
  zh: { welcome: "欢迎", bye: "已退出登录", langChanged: "已切换语言" },
};

// Real Firebase auth. Google is fully wired; other providers (Apple/Kakao/Naver)
// require Firebase OIDC provider setup and are surfaced as "준비 중" for now.
// "guest" is a local browse-only mode (curation will return 401 until sign-in).
export function useAuth() {
  // Restore guest browse-mode from the initializer (avoids setState-in-effect).
  const [provider, setProvider] = useState<string | null>(() => {
    try {
      const a = JSON.parse(localStorage.getItem("mc-auth") || "null");
      return a?.provider === "guest" ? "guest" : null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<FbUser | null>(null);

  useEffect(() => {
    let unsub = () => {};
    watchAuth((u) => {
      setUser(u);
      setProvider((prev) => (u ? "google" : prev === "guest" ? "guest" : null));
    })
      .then((fn) => {
        unsub = fn;
      })
      .catch(() => {
        /* firebase unavailable (e.g. no config) — stay signed out */
      });
    return () => unsub();
  }, []);

  const signIn = async (p: string) => {
    if (p === "guest") {
      localStorage.setItem("mc-auth", JSON.stringify({ provider: "guest", ts: Date.now() }));
      setProvider("guest");
      return;
    }
    if (p !== "google") {
      toast("이 로그인 방식은 준비 중이에요. Google 로그인을 이용해 주세요.");
      return;
    }
    try {
      const u = await signInWithGoogle();
      setUser(u);
      setProvider("google");
    } catch {
      toast("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("mc-auth");
    setUser(null);
    setProvider(null);
  };

  return { provider, user, signIn, signOut };
}
