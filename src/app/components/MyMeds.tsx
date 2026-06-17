"use client";

import { useState } from "react";
import { useI18n, type Lang } from "./i18n";
import { InfoIcon, PillIcon, TrashIcon } from "./icons";
import MedCapture from "./MedCapture";
import { addMed, deleteAllMeds, deleteMed, loadMeds } from "../../services/medStore";
import type { MedCategoryT, RecognizedMedT, StoredMedT } from "../../schemas/aiTools";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

const T = {
  add: ml("사진으로 추가", "Add by photo", "写真で追加", "拍照添加"),
  save: ml("내 목록에 저장", "Save to my list", "リストに保存", "保存到我的列表"),
  discard: ml("취소", "Discard", "取り消し", "放弃"),
  notRecognized: ml("제품을 식별하지 못했어요. 라벨이 잘 보이는 사진으로 다시 시도해 주세요.", "Couldn't identify the product. Try a clearer photo of the label.", "製品を識別できませんでした。ラベルが見える写真で再試行してください。", "未能识别产品。请用标签清晰的照片重试。"),
  ingredients: ml("주요 성분", "Key ingredients", "主な成分", "主要成分"),
  efficacy: ml("효능·용도", "Uses", "効能・用途", "功效·用途"),
  cautions: ml("주의", "Cautions", "注意", "注意"),
  empty: ml("아직 저장된 약·비타민이 없어요. 사진으로 추가해 보세요.", "No saved items yet. Add one by photo.", "保存された項目はまだありません。写真で追加してください。", "尚无已保存项目。请拍照添加。"),
  clearAll: ml("전체 삭제", "Clear all", "すべて削除", "全部删除"),
  localOnly: ml("이 목록은 이 기기에만 저장되며 서버로 전송되지 않습니다. 사진은 저장하지 않습니다.", "This list is stored on this device only and never sent to a server. Photos are not saved.", "このリストは端末内のみに保存され、サーバーには送信されません。写真は保存しません。", "此列表仅存储在本机，不会发送到服务器。不保存照片。"),
} as const;

const CAT_LABEL: Record<MedCategoryT, ML> = {
  medicine: ml("의약품", "Medicine", "医薬品", "药品"),
  supplement: ml("보충제", "Supplement", "サプリ", "补充剂"),
  vitamin: ml("비타민", "Vitamin", "ビタミン", "维生素"),
  unknown: ml("기타", "Other", "その他", "其他"),
};

export default function MyMeds({ uid }: { uid?: string }) {
  const { lang } = useI18n();
  const [meds, setMeds] = useState<StoredMedT[]>(() => loadMeds(uid));
  const [draft, setDraft] = useState<RecognizedMedT | null>(null);

  function refresh() {
    setMeds(loadMeds(uid));
  }

  function onSave() {
    if (!draft || !draft.recognized) return;
    addMed(uid, draft);
    setDraft(null);
    refresh();
  }

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : `${lang}`);
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{T.localOnly[lang]}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <MedCapture lang={lang} onRecognized={setDraft} />

        {draft && (
          <div className="mt-4 rounded-[16px] border border-brand-tint-2 bg-brand-tint/40 p-4">
            {!draft.recognized ? (
              <p className="text-[13px] leading-relaxed text-ink-2">{T.notRecognized[lang]}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-bold tracking-tight text-ink">{draft.name}</h3>
                  <span className="rounded-full bg-brand px-2 py-[2px] text-[10.5px] font-extrabold text-white">
                    {CAT_LABEL[draft.category][lang]}
                  </span>
                </div>
                {draft.ingredients.length > 0 && (
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    <b className="font-bold text-ink-3">{T.ingredients[lang]}</b> · {draft.ingredients.join(", ")}
                  </p>
                )}
                {draft.efficacy && (
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    <b className="font-bold text-ink-3">{T.efficacy[lang]}</b> · {draft.efficacy}
                  </p>
                )}
                {draft.cautions.length > 0 && (
                  <p className="text-[12.5px] leading-relaxed text-ink-3">
                    <b className="font-bold">{T.cautions[lang]}</b> · {draft.cautions.join(" / ")}
                  </p>
                )}
                <p className="text-[11.5px] leading-relaxed text-ink-4">{draft.disclaimer}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {draft.recognized && (
                <button
                  type="button"
                  onClick={onSave}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-[13px] font-bold text-white transition hover:bg-brand-2"
                >
                  {T.save[lang]}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-4 text-[13px] font-bold text-ink-2 transition hover:border-brand hover:text-brand"
              >
                {T.discard[lang]}
              </button>
            </div>
          </div>
        )}
      </div>

      {meds.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[16px] border border-line bg-surface px-4 py-4 text-[13px] leading-relaxed text-ink-2">
          <PillIcon className="h-[18px] w-[18px] shrink-0 text-ink-3" />
          {T.empty[lang]}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                deleteAllMeds(uid);
                refresh();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-bold text-ink-3 transition hover:border-danger hover:text-danger"
            >
              <TrashIcon className="h-[14px] w-[14px]" />
              {T.clearAll[lang]}
            </button>
          </div>
          {meds.map((m) => (
            <section key={m.id} className="rounded-[16px] border border-line bg-surface p-4 shadow-sm sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold tracking-tight text-ink">{m.name || "—"}</h3>
                    <span className="rounded-full bg-surface-soft px-2 py-[2px] text-[10.5px] font-extrabold text-ink-3">
                      {CAT_LABEL[m.category][lang]}
                    </span>
                    <span className="text-[11px] text-ink-4">{fmtDate(m.addedAt)}</span>
                  </div>
                  {m.ingredients.length > 0 && (
                    <p className="text-[13px] leading-relaxed text-ink-2">
                      <b className="font-bold text-ink-3">{T.ingredients[lang]}</b> · {m.ingredients.join(", ")}
                    </p>
                  )}
                  {m.efficacy && (
                    <p className="text-[13px] leading-relaxed text-ink-2">
                      <b className="font-bold text-ink-3">{T.efficacy[lang]}</b> · {m.efficacy}
                    </p>
                  )}
                  {m.cautions.length > 0 && (
                    <p className="text-[12.5px] leading-relaxed text-ink-3">
                      <b className="font-bold">{T.cautions[lang]}</b> · {m.cautions.join(" / ")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="delete"
                  onClick={() => {
                    deleteMed(uid, m.id);
                    refresh();
                  }}
                  className="shrink-0 rounded-lg border border-line bg-surface p-2 text-ink-3 transition hover:border-danger hover:text-danger"
                >
                  <TrashIcon className="h-[15px] w-[15px]" />
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
