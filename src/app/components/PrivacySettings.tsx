"use client";

import { useState } from "react";
import { TrashIcon } from "./icons";
import { PRIV_ON, useI18n } from "./i18n";
import { toast } from "./chrome-helpers";
import { saveConsent } from "../../services/consentService";
import { LegalModal } from "./LegalModal";
import { type LegalKey } from "./Legal";
import MemberOnboarding from "./MemberOnboarding";
import type { User as FbUser } from "firebase/auth";
import type { MemberProfileT } from "../../services/memberProfileService";
import { deleteAccountData } from "../../services/accountDataService";
import { loadHealthProfile, saveHealthProfile, type SelfReportedHealthProfileT } from "../../services/healthProfileService";

export default function PrivacySettings({
  uid,
  user,
  memberProfile,
  onProfileSaved,
  onGoToMeds,
}: {
  uid?: string;
  user?: FbUser | null;
  memberProfile?: MemberProfileT | null;
  onProfileSaved?: (profile: MemberProfileT | null) => void;
  onGoToMeds?: () => void;
}) {
  const { t } = useI18n();
  const pv = t.privacy;

  const [on, setOn] = useState<boolean[]>(PRIV_ON);
  const toggle = (i: number) => setOn((cur) => cur.map((v, idx) => (idx === i ? !v : v)));

  const [saving, setSaving] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalKey | null>(null);
  const [healthProfile, setHealthProfile] = useState<SelfReportedHealthProfileT>(() => loadHealthProfile(uid));
  // Persist the PIPA sensitive-info consent record (required by /api/curate).
  // NOTE (legal gate): the consent items, copy, and adult verification (isAdult)
  // require legal-advisor + medical-reviewer sign-off (AGENTS.md). isAdult is
  // hard-set to true here pending a real birthdate/adult-verification step.
  async function acceptConsent() {
    if (!uid) {
      toast("로그인 후 동의를 저장할 수 있어요.");
      return;
    }
    setSaving(true);
    try {
      await saveConsent(
        uid,
        {
          pii: true,
          sensitiveHealth: true,
          overseasTransfer: true,
          location: true,
          marketing: on[2] ?? false,
          analytics: on[2] ?? false,
        },
        true,
      );
      toast("민감정보 처리 동의가 저장됐어요.");
    } catch {
      toast("동의 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMyData() {
    if (!uid) {
      toast("로그인 후 데이터를 삭제할 수 있어요.");
      return;
    }
    const confirmed = window.confirm(
      "이 기기의 검색 기록·저장한 약 목록과 서버의 회원 프로필/동의 기록을 삭제합니다. 계정 로그인 자체는 유지됩니다. 계속할까요?",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const result = await deleteAccountData(uid);
      onProfileSaved?.(null);
      if (result.remoteError) {
        toast("기기 데이터는 삭제했고, 서버 데이터 일부는 다시 시도해야 합니다.");
      } else {
        toast("회원 데이터와 기기 저장 기록을 삭제했어요.");
      }
    } catch {
      toast("데이터 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  }

  function updateHealthProfile(next: Partial<SelfReportedHealthProfileT>) {
    setHealthProfile((cur) => ({ ...cur, ...next }));
  }

  function saveSelfReportedHealthProfile() {
    if (!uid) {
      toast("로그인 후 건강 메모를 저장할 수 있어요.");
      return;
    }
    setSavingHealth(true);
    try {
      const saved = saveHealthProfile(uid, {
        conditionStatus: healthProfile.conditionStatus,
        conditionsText: healthProfile.conditionsText,
        allergiesText: healthProfile.allergiesText,
        notes: healthProfile.notes,
      });
      setHealthProfile(saved);
      toast("내 프로필 건강 메모를 이 기기에 저장했어요.");
    } catch {
      toast("건강 메모 저장에 실패했어요.");
    } finally {
      setSavingHealth(false);
    }
  }

  return (
    <div>
      {user && onProfileSaved && (
        <div className="mb-5">
          <MemberOnboarding
            user={user}
            initialProfile={memberProfile}
            title="회원 정보를 수정하세요"
            subtitle="닉네임과 답변 받을 이메일을 언제든 바꿀 수 있습니다. 로그인 이메일은 인증 상태만 확인하고, 답변 이메일은 별도로 선택합니다."
            submitLabel="회원 정보 저장"
            onComplete={onProfileSaved}
          />
        </div>
      )}

      {uid && (
        <section className="mb-5 rounded-[24px] border border-line bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">My profile</p>
              <h2 className="mt-1 text-[20px] font-black tracking-[-0.03em] text-ink">
                {memberProfile?.nickname ? `${memberProfile.nickname}님의 프로필 설정` : "내 프로필 설정"}
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
                처방전·약봉투는 ‘내 약 목록’에 텍스트로만 저장하고, 질병·알레르기 메모는 이 기기에만 보관합니다. 원본 사진은 저장하지 않습니다.
              </p>
            </div>
            {onGoToMeds && (
              <button
                type="button"
                onClick={onGoToMeds}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-ink px-4 text-[12.5px] font-extrabold text-white transition hover:opacity-90 active:scale-[0.98]"
              >
                처방전·약봉투 등록
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4">
            <fieldset className="rounded-2xl border border-line p-4">
              <legend className="px-1 text-[12px] font-extrabold text-ink-3">질병/건강상태 메모</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[
                  ["none", "없음"],
                  ["has", "있음"],
                  ["unknown", "모름/미입력"],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-soft px-3 py-2 text-[12.5px] font-bold text-ink-2">
                    <input
                      type="radio"
                      checked={healthProfile.conditionStatus === value}
                      onChange={() => updateHealthProfile({ conditionStatus: value as SelfReportedHealthProfileT['conditionStatus'] })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <textarea
                value={healthProfile.conditionsText}
                onChange={(event) => updateHealthProfile({ conditionsText: event.target.value })}
                placeholder="예: 고혈압, 당뇨, 천식 등 직접 알고 있는 정보만 적어 주세요."
                maxLength={1000}
                className="mt-3 min-h-[92px] w-full rounded-xl border border-line bg-surface px-3 py-3 text-[13px] font-semibold leading-relaxed text-ink outline-none focus:border-brand"
              />
            </fieldset>

            <label className="block rounded-2xl border border-line p-4">
              <span className="text-[12px] font-extrabold text-ink-3">알레르기/주의 성분</span>
              <textarea
                value={healthProfile.allergiesText}
                onChange={(event) => updateHealthProfile({ allergiesText: event.target.value })}
                placeholder="예: 페니실린 알레르기, 특정 성분 주의 등"
                maxLength={1000}
                className="mt-2 min-h-[76px] w-full rounded-xl border border-line bg-surface px-3 py-3 text-[13px] font-semibold leading-relaxed text-ink outline-none focus:border-brand"
              />
            </label>

            <label className="block rounded-2xl border border-line p-4">
              <span className="text-[12px] font-extrabold text-ink-3">기타 메모</span>
              <textarea
                value={healthProfile.notes}
                onChange={(event) => updateHealthProfile({ notes: event.target.value })}
                placeholder="진료 전 물어볼 질문이나 기억할 내용을 적어 두세요."
                maxLength={1000}
                className="mt-2 min-h-[76px] w-full rounded-xl border border-line bg-surface px-3 py-3 text-[13px] font-semibold leading-relaxed text-ink outline-none focus:border-brand"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] leading-relaxed text-ink-4">
              이 메모는 진단/처방 판단용이 아니라 상담 준비용입니다. 민감 건강정보이므로 서버에 저장하지 않습니다.
            </p>
            <button
              type="button"
              onClick={saveSelfReportedHealthProfile}
              disabled={savingHealth}
              className="h-10 rounded-xl border border-line bg-surface-soft px-4 text-[12.5px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand disabled:opacity-60"
            >
              {savingHealth ? "저장 중…" : "건강 메모 저장"}
            </button>
          </div>
        </section>
      )}

      <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
        {pv.items.map((s, i) => (
          <div
            key={s.title}
            className={`flex items-center justify-between gap-4 px-5 py-[18px] ${
              i < pv.items.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div>
              <b className="block text-sm font-bold text-ink">{s.title}</b>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{s.desc}</span>
            </div>
            <button
              onClick={() => toggle(i)}
              role="switch"
              aria-checked={on[i]}
              className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition ${on[i] ? "bg-brand" : "bg-line-2"}`}
            >
              <span
                className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-sm transition-all ${
                  on[i] ? "left-[22px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setLegalDoc("privacy")}
          className="inline-flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-[13.5px] font-semibold text-ink-2 transition hover:border-line-2 hover:text-ink"
        >
          {pv.policy}
        </button>
        <button
          type="button"
          onClick={() => setLegalDoc("terms")}
          className="inline-flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-[13.5px] font-semibold text-ink-2 transition hover:border-line-2 hover:text-ink"
        >
          {pv.terms}
        </button>
      </div>
      <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />

      <button
        onClick={acceptConsent}
        disabled={saving || !uid}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-[18px] text-[13.5px] font-bold text-white shadow-sm transition hover:bg-brand-2 disabled:cursor-not-allowed disabled:bg-ink-4 disabled:shadow-none"
      >
        {saving ? "저장 중…" : uid ? "민감정보 처리에 동의하고 저장" : "로그인 후 동의할 수 있어요"}
      </button>

      <button
        type="button"
        onClick={() => void deleteMyData()}
        disabled={deleting || !uid}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-[14px] border border-danger-line bg-danger-tint px-[18px] text-[13.5px] font-bold text-danger transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        <TrashIcon className="h-[15px] w-[15px]" />
        {deleting ? "삭제 중…" : pv.deleteAll}
      </button>
    </div>
  );
}
