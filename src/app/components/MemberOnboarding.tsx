"use client";

import { useState } from "react";
import type { User as FbUser } from "firebase/auth";
import { sendCurrentUserEmailVerification } from "../../firebase";
import { saveMemberProfile, type MemberProfileT } from "../../services/memberProfileService";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function MemberOnboarding({
  user,
  initialProfile,
  title = "로그인 후 보여줄 닉네임을 정해 주세요",
  subtitle = "닉네임과 이메일만 회원 식별용으로 저장합니다. 같은 이메일로 다른 로그인 방식을 써도 저장된 닉네임을 먼저 찾아 보여줍니다.",
  submitLabel = "회원가입 완료",
  onComplete,
}: {
  user: FbUser;
  initialProfile?: MemberProfileT | null;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onComplete: (profile: MemberProfileT) => void;
}) {
  const loginEmail = user.email ?? "";
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? user.displayName?.split(" ")[0] ?? "");
  const [emailMode, setEmailMode] = useState<'login' | 'custom'>(initialProfile?.answerEmailSource ?? 'login');
  const [customEmail, setCustomEmail] = useState(initialProfile?.answerEmailSource === 'custom' ? initialProfile.answerEmail : "");
  const [saving, setSaving] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [message, setMessage] = useState("");

  const answerEmail = emailMode === 'login' ? loginEmail : customEmail.trim();
  const loginEmailVerified = user.emailVerified;
  const canSave = nickname.trim().length > 0 && isEmail(answerEmail);

  async function sendVerification() {
    setVerifySending(true);
    setMessage("");
    try {
      await sendCurrentUserEmailVerification();
      setMessage("확인 메일을 보냈습니다. 메일함에서 인증을 완료한 뒤 다시 로그인하면 반영됩니다.");
    } catch (error) {
      setMessage((error as Error).message || "확인 메일 발송에 실패했습니다.");
    } finally {
      setVerifySending(false);
    }
  }

  async function submit() {
    if (!canSave) {
      setMessage("닉네임과 답변 받을 이메일을 확인해 주세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const profile = await saveMemberProfile(user.uid, {
        nickname: nickname.trim(),
        loginEmail: loginEmail || null,
        answerEmail,
        answerEmailSource: emailMode,
        answerEmailVerified: emailMode === 'login' ? loginEmailVerified : false,
      });
      onComplete(profile);
    } catch (error) {
      setMessage((error as Error).message || "회원 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-brand-tint-2 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(0,0,0,.65)] sm:p-8">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-brand">Member setup</p>
      <h2 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">
        {subtitle}
      </p>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-[12px] font-extrabold text-ink-3">닉네임</span>
          <input
            value={nickname}
            maxLength={40}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="예: Steve"
            className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px] font-bold text-ink outline-none focus:border-brand"
          />
          <span className="mt-2 block rounded-xl bg-brand-tint/45 px-3 py-2 text-[12px] font-bold text-brand">
            저장 후 상단 계정 버튼에 {nickname.trim() || "닉네임"}님으로 표시됩니다.
          </span>
        </label>

        <div className="rounded-2xl border border-line bg-ink-1/40 p-4">
          <p className="text-[12px] font-extrabold text-ink-3">로그인 이메일</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] font-bold text-ink">{loginEmail || "이메일 없음"}</p>
            <span className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${loginEmailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {loginEmailVerified ? "확인됨" : "확인 필요"}
            </span>
          </div>
          {loginEmail && !loginEmailVerified && (
            <button
              type="button"
              onClick={() => void sendVerification()}
              disabled={verifySending}
              className="mt-3 h-10 rounded-xl border border-line bg-white px-4 text-[12.5px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand disabled:opacity-50"
            >
              {verifySending ? "발송 중" : "이메일 확인 메일 보내기"}
            </button>
          )}
        </div>

        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="px-1 text-[12px] font-extrabold text-ink-3">답변 받을 이메일</legend>
          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-ink-1/40">
            <input type="radio" checked={emailMode === 'login'} onChange={() => setEmailMode('login')} className="mt-1" />
            <span>
              <span className="block text-[14px] font-extrabold text-ink">로그인 이메일로 받기</span>
              <span className="block text-[12.5px] text-ink-3">{loginEmail || "로그인 이메일이 없습니다."}</span>
            </span>
          </label>
          <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-ink-1/40">
            <input type="radio" checked={emailMode === 'custom'} onChange={() => setEmailMode('custom')} className="mt-1" />
            <span className="flex-1">
              <span className="block text-[14px] font-extrabold text-ink">새 이메일로 받기</span>
              <input
                value={customEmail}
                onChange={(event) => {
                  setCustomEmail(event.target.value);
                  setEmailMode('custom');
                }}
                placeholder="answer@example.com"
                className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[14px] font-bold text-ink outline-none focus:border-brand"
              />
              <span className="mt-1 block text-[11.5px] text-ink-4">새 이메일은 등록 후 확인 상태로 관리됩니다. 실제 인증 메일 연동은 운영 메일 시스템 연결 단계에서 활성화합니다.</span>
            </span>
          </label>
        </fieldset>
      </div>

      {message && <p className="mt-4 rounded-xl bg-ink-1/60 px-4 py-3 text-[12.5px] font-semibold text-ink-3">{message}</p>}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-ink-4">이 정보는 회원 식별, 로그인 방식 연결, 안내 발송 목적에만 사용합니다.</p>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSave || saving}
          className="h-12 rounded-xl bg-ink px-6 text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink-4"
        >
          {saving ? "저장 중" : submitLabel}
        </button>
      </div>
    </section>
  );
}
