"use client";

import { useState } from "react";
import { TrashIcon } from "./icons";
import { PRIV_ON, useI18n } from "./i18n";
import { toast } from "./chrome-helpers";
import { saveConsent } from "../../services/consentService";
import { LegalModal } from "./LegalModal";
import { type LegalKey } from "./Legal";

export default function PrivacySettings({ uid }: { uid?: string }) {
  const { t } = useI18n();
  const pv = t.privacy;

  const [on, setOn] = useState<boolean[]>(PRIV_ON);
  const toggle = (i: number) => setOn((cur) => cur.map((v, idx) => (idx === i ? !v : v)));

  const [saving, setSaving] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalKey | null>(null);
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

  return (
    <div>
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

      <button className="mt-3 inline-flex h-11 items-center gap-2 rounded-[14px] border border-danger-line bg-danger-tint px-[18px] text-[13.5px] font-bold text-danger transition hover:bg-surface">
        <TrashIcon className="h-[15px] w-[15px]" />
        {pv.deleteAll}
      </button>
    </div>
  );
}
