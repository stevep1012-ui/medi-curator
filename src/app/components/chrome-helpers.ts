"use client";

// Non-component helpers split out of Chrome.tsx (toast emitter, account-toast
// copy, auth hook) so Chrome.tsx exports only components
// (react-refresh/only-export-components).
import { useState, useEffect } from "react";
import { type Lang } from "./i18n";
import { watchAuth, signInWith, signOutUser, type ProviderKey } from "../../firebase";
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

const PROVIDER_KEYS: ProviderKey[] = ["google", "apple", "kakao", "naver"];

// Map a signed-in Firebase user back to our provider key (providerData[0]).
function providerKeyOf(u: FbUser | null): string | null {
  const pid = u?.providerData?.[0]?.providerId ?? "";
  if (pid.includes("google")) return "google";
  if (pid.includes("apple")) return "apple";
  if (pid.includes("kakao")) return "kakao";
  if (pid.includes("naver")) return "naver";
  return u ? "google" : null;
}

// Real Firebase OAuth. google/apple are built-in; kakao/naver use custom OIDC
// providers (oidc.kakao / oidc.naver) registered in the Firebase console — until
// registered they fail with a friendly error. "guest" is a local browse-only mode.
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
      setProvider((prev) => (u ? providerKeyOf(u) : prev === "guest" ? "guest" : null));
    })
      .then((fn) => {
        unsub = fn;
      })
      .catch(() => {
        /* firebase unavailable (e.g. no config) — stay signed out */
      });
    return () => unsub();
  }, []);

  // Returns true only when sign-in actually succeeded, so the caller can defer the
  // "welcome" toast until then (a failed/cancelled login must not show "Welcome").
  const signIn = async (p: string): Promise<boolean> => {
    if (p === "guest") {
      localStorage.setItem("mc-auth", JSON.stringify({ provider: "guest", ts: Date.now() }));
      setProvider("guest");
      return true;
    }
    if (!PROVIDER_KEYS.includes(p as ProviderKey)) {
      toast("지원하지 않는 로그인 방식이에요.");
      return false;
    }
    try {
      const u = await signInWith(p as ProviderKey);
      setUser(u);
      setProvider(providerKeyOf(u) ?? p);
      return true;
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      // 사용자가 팝업을 닫거나 중복 요청한 경우는 조용히 무시.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return false;
      // 설정 단계 디버깅용 — 어떤 코드로 실패했는지 콘솔에 남긴다.
      if (code) console.warn("[auth] sign-in failed:", code);
      if (code === "auth/operation-not-allowed") {
        // OIDC provider(oidc.kakao 등)가 Firebase 콘솔에 아직 등록/활성화되지 않음.
        toast("이 로그인 방식이 아직 활성화되지 않았어요. 다른 방식으로 로그인해 주세요.");
      } else if (code === "auth/popup-blocked") {
        toast("팝업이 차단되었어요. 브라우저 팝업 허용 후 다시 시도해 주세요.");
      } else if (code === "auth/unauthorized-domain") {
        toast("허용되지 않은 도메인이에요. 잠시 후 다시 시도해 주세요.");
      } else {
        toast("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
      return false;
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
