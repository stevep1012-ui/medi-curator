"use client";

import { useState } from "react";
import { useI18n, type Lang } from "./i18n";
import { VT } from "./vitamin-data";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

const InfoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </svg>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16Z" />
    <path d="M8 16C12 12 14 9 18 7" />
  </svg>
);
const PillIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="8" rx="4" />
    <path d="M12 8v8" />
  </svg>
);

type GoalTone = "amber" | "brand" | "danger";
type Goal = {
  id: string;
  tone: GoalTone;
  kw: string[];
  label: ML;
  summary: ML;
  items: [ML, ML][];
  tip: ML;
};


const GOALS: Goal[] = [
  {
    id: "fatigue",
    tone: "amber",
    kw: ["피로", "피곤", "기운", "지침", "fatigue", "tired", "energy", "疲れ", "疲労", "疲劳", "累", "乏力"],
    label: ml("피로 회복", "Fatigue recovery", "疲労回復", "缓解疲劳"),
    summary: ml("에너지 대사와 활력을 끌어올리는 조합", "Lifts energy metabolism and vitality", "エネルギー代謝と活力を高める", "提升能量代谢与活力"),
    items: [
      [ml("비타민 B군", "B-complex", "ビタミンB群", "维生素B族"), ml("에너지 대사를 도와 피로를 줄여요", "Aids energy metabolism", "エネルギー代謝を助ける", "帮助能量代谢")],
      [ml("마그네슘", "Magnesium", "マグネシウム", "镁"), ml("근육·신경 피로 회복을 도와요", "Eases muscle & nerve fatigue", "筋肉・神経の疲労を回復", "缓解肌肉与神经疲劳")],
      [ml("코엔자임 Q10", "CoQ10", "コエンザイムQ10", "辅酶Q10"), ml("세포 에너지 생성을 지원해요", "Supports cellular energy", "細胞のエネルギー産生を支える", "支持细胞能量生成")],
      [ml("비타민 C", "Vitamin C", "ビタミンC", "维生素C"), ml("항산화로 활력 회복을 도와요", "Antioxidant support for recovery", "抗酸化で回復を後押し", "抗氧化助力恢复")],
    ],
    tip: ml("아침 식후 B군·C, 저녁에 마그네슘이 좋아요.", "B/C after breakfast, magnesium in the evening.", "朝食後にB群・C、夜にマグネシウムを。", "早餐后B族/C，晚上服镁。"),
  },
  {
    id: "skin",
    tone: "brand",
    kw: ["피부", "미용", "생기", "skin", "beauty", "美容", "肌", "皮肤", "美肌"],
    label: ml("피부 생기", "Skin vitality", "肌のハリ", "皮肤活力"),
    summary: ml("콜라겐과 항산화로 피부 탄력을 지켜요", "Collagen & antioxidants for supple skin", "コラーゲンと抗酸化でハリを保つ", "胶原与抗氧化守护弹润"),
    items: [
      [ml("비타민 C", "Vitamin C", "ビタミンC", "维生素C"), ml("콜라겐 합성과 미백을 도와요", "Aids collagen synthesis & brightening", "コラーゲン生成と美白を助ける", "促进胶原合成与提亮")],
      [ml("비타민 E", "Vitamin E", "ビタミンE", "维生素E"), ml("피부를 산화로부터 보호해요", "Protects skin from oxidation", "肌を酸化から守る", "保护皮肤抗氧化")],
      [ml("아연", "Zinc", "亜鉛", "锌"), ml("피부 재생과 트러블 진정에 도움", "Supports renewal & calms breakouts", "再生を助け肌荒れを鎮める", "助再生并舒缓痘痘")],
      [ml("콜라겐 펩타이드", "Collagen peptide", "コラーゲンペプチド", "胶原蛋白肽"), ml("탄력과 수분 유지를 도와요", "Helps elasticity & hydration", "弾力と潤いを保つ", "维持弹性与水润")],
    ],
    tip: ml("C와 콜라겐은 함께, E는 지용성이라 식후에.", "Take C with collagen; E (fat-soluble) after meals.", "Cとコラーゲンは一緒に、Eは食後に。", "C与胶原同服，E为脂溶性宜餐后。"),
  },
  {
    id: "sleep",
    tone: "brand",
    kw: ["수면", "잠", "불면", "숙면", "sleep", "insomnia", "rest", "睡眠", "眠", "失眠", "睡"],
    label: ml("편한 수면", "Restful sleep", "快眠サポート", "舒适睡眠"),
    summary: ml("신경을 이완해 잠들기 쉽게 도와요", "Relaxes the nervous system for easier sleep", "神経を緩めて入眠を助ける", "放松神经助你入睡"),
    items: [
      [ml("마그네슘", "Magnesium", "マグネシウム", "镁"), ml("신경 이완과 수면의 질을 도와요", "Relaxes nerves, improves sleep quality", "神経を緩め睡眠の質を上げる", "放松神经改善睡眠质量")],
      [ml("비타민 B6", "Vitamin B6", "ビタミンB6", "维生素B6"), ml("멜라토닌 생성을 보조해요", "Supports melatonin production", "メラトニン生成を補助", "辅助褪黑素生成")],
      [ml("L-테아닌", "L-theanine", "L-テアニン", "L-茶氨酸"), ml("긴장을 풀어 편안하게 이완", "Eases tension for calm relaxation", "緊張を和らげリラックス", "舒缓紧张放松身心")],
      [ml("글리신", "Glycine", "グリシン", "甘氨酸"), ml("심부 체온을 낮춰 입면을 도와요", "Lowers core temp to aid falling asleep", "深部体温を下げ入眠を助ける", "降低核心体温助入睡")],
    ],
    tip: ml("취침 30~60분 전, 카페인은 피하세요.", "30–60 min before bed; avoid caffeine.", "就寝30〜60分前に、カフェインは避けて。", "睡前30–60分钟服用，避免咖啡因。"),
  },
  {
    id: "recovery",
    tone: "brand",
    kw: ["근육", "운동", "회복", "muscle", "workout", "recovery", "exercise", "筋", "運動", "回復", "肌肉", "运动", "恢复"],
    label: ml("운동 후 근육 회복", "Post-workout recovery", "運動後の筋回復", "运动后肌肉恢复"),
    summary: ml("근단백 재건과 염증 완화를 도와요", "Rebuilds muscle protein, eases soreness", "筋タンパク再建と炎症緩和", "重建肌蛋白并缓解炎症"),
    items: [
      [ml("단백질 · BCAA", "Protein · BCAA", "プロテイン・BCAA", "蛋白质·BCAA"), ml("근섬유 재건과 근손상 감소", "Rebuilds fibers, cuts muscle damage", "筋線維の再建と損傷軽減", "重建肌纤维减少损伤")],
      [ml("마그네슘", "Magnesium", "マグネシウム", "镁"), ml("근경련 예방과 이완을 도와요", "Prevents cramps, aids relaxation", "痙攣予防とリラックス", "预防抽筋并放松")],
      [ml("비타민 D", "Vitamin D", "ビタミンD", "维生素D"), ml("근기능과 회복을 지원해요", "Supports muscle function & recovery", "筋機能と回復を支える", "支持肌肉功能与恢复")],
      [ml("오메가-3", "Omega-3", "オメガ3", "欧米伽-3"), ml("운동 후 염증 완화에 도움", "Helps ease post-exercise inflammation", "運動後の炎症を和らげる", "缓解运动后炎症")],
    ],
    tip: ml("운동 직후 30분 내 단백질·BCAA가 효과적.", "Protein/BCAA within 30 min post-workout.", "運動直後30分以内にタンパク質を。", "运动后30分钟内补蛋白质效果佳。"),
  },
  {
    id: "training",
    tone: "danger",
    kw: ["훈련", "강도", "고강도", "training", "intense", "endurance", "トレ", "高強度", "训练", "高强度"],
    label: ml("강도 높은 훈련 후", "After intense training", "高強度トレ後", "高强度训练后"),
    summary: ml("과훈련 스트레스와 산화를 방어해요", "Defends against overtraining & oxidation", "オーバートレと酸化を防ぐ", "抵御过度训练与氧化"),
    items: [
      [ml("L-글루타민", "L-glutamine", "L-グルタミン", "L-谷氨酰胺"), ml("면역·근회복과 과훈련 보호", "Immune & muscle recovery support", "免疫・筋回復を支える", "支持免疫与肌肉恢复")],
      [ml("비타민 C · E", "Vitamin C · E", "ビタミンC・E", "维生素C·E"), ml("산화 스트레스를 완화해요", "Reduces oxidative stress", "酸化ストレスを軽減", "减轻氧化应激")],
      [ml("아연", "Zinc", "亜鉛", "锌"), ml("회복과 호르몬 균형을 도와요", "Supports recovery & hormone balance", "回復とホルモンバランスを支える", "支持恢复与激素平衡")],
      [ml("코엔자임 Q10", "CoQ10", "コエンザイムQ10", "辅酶Q10"), ml("미토콘드리아 회복을 지원해요", "Supports mitochondrial recovery", "ミトコンドリアの回復を支援", "支持线粒体恢复")],
    ],
    tip: ml("강훈련일엔 항산화를 늘리고 수분·전해질을 충분히.", "On hard days, add antioxidants and electrolytes.", "ハード日は抗酸化と電解質を十分に。", "大强度日增加抗氧化与电解质。"),
  },
  {
    id: "immune",
    tone: "brand",
    kw: ["면역", "감기", "환절기", "immune", "immunity", "cold", "免疫", "感冒", "免疫力"],
    label: ml("면역 강화", "Immune support", "免疫サポート", "增强免疫"),
    summary: ml("환절기 면역 방어를 탄탄하게", "Strengthens seasonal immune defense", "季節の変わり目の免疫を強化", "加固换季免疫防线"),
    items: [
      [ml("비타민 C", "Vitamin C", "ビタミンC", "维生素C"), ml("면역세포 기능을 지원해요", "Supports immune cell function", "免疫細胞の機能を支える", "支持免疫细胞功能")],
      [ml("비타민 D", "Vitamin D", "ビタミンD", "维生素D"), ml("면역 균형 조절을 도와요", "Helps regulate immune balance", "免疫バランスを整える", "帮助调节免疫平衡")],
      [ml("아연", "Zinc", "亜鉛", "锌"), ml("면역 방어와 회복 단축에 도움", "Aids defense & faster recovery", "防御と回復短縮を助ける", "助防御并缩短恢复")],
      [ml("프로바이오틱스", "Probiotics", "プロバイオティクス", "益生菌"), ml("장 면역 환경을 건강하게", "Supports gut immune health", "腸の免疫環境を整える", "维护肠道免疫环境")],
    ],
    tip: ml("D와 아연은 함께, 환절기엔 꾸준히 드세요.", "Take D with zinc; stay consistent in season changes.", "DとⅤ亜鉛は一緒に、季節の変わり目は継続を。", "D与锌同服，换季坚持服用。"),
  },
];

const TONE = {
  amber: "bg-amber-500",
  brand: "bg-brand",
  danger: "bg-danger",
} as const;

const CARD_CLS = "rounded-[18px] border border-line bg-surface p-5 shadow-sm";

export default function VitaminPairing() {
  const { lang } = useI18n();
  const v = VT[lang];
  const [goalId, setGoalId] = useState<string | null>("fatigue");
  const [text, setText] = useState("");

  const matchGoal = (q: string): Goal | null => {
    const tx = q.toLowerCase().trim();
    if (!tx) return null;
    return (
      GOALS.find(
        (g) =>
          g.label[lang].toLowerCase().includes(tx) ||
          tx.includes(g.label[lang].toLowerCase()) ||
          g.kw.some((k) => tx.includes(k.toLowerCase())),
      ) || null
    );
  };

  const sel = GOALS.find((g) => g.id === goalId) || null;

  return (
    <>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{v.disclaimer}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{v.pick}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const on = g.id === goalId;
            const cls = on
              ? "border-brand bg-brand text-white shadow-[0_8px_18px_-10px_rgba(11,110,97,0.8)]"
              : "border-line bg-surface text-ink-2 hover:border-brand-tint-2 hover:text-brand";
            return (
              <button
                key={g.id}
                onClick={() => setGoalId(g.id)}
                className={`inline-flex items-center whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-bold transition ${cls}`}
              >
                {g.label[lang]}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setGoalId(matchGoal(text)?.id ?? null);
            }}
            placeholder={v.inputPh}
            className="min-w-0 flex-1 rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
          />
          <button
            onClick={() => setGoalId(matchGoal(text)?.id ?? null)}
            className="inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[14px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2"
          >
            <SearchIcon className="h-[17px] w-[17px]" />
            {v.go}
          </button>
        </div>
      </div>

      {sel ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${TONE[sel.tone]}`}>
              <LeafIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{v.comboFor}</div>
              <h3 className="text-[17px] font-bold tracking-tight text-ink">{sel.label[lang]}</h3>
            </div>
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink-2">{sel.summary[lang]}</p>
          <section className={CARD_CLS}>
            <h3 className="mb-3.5 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-tint text-brand">
                <PillIcon className="h-[15px] w-[15px]" />
              </span>
              {v.items}
            </h3>
            <ul className="space-y-3 text-[13.5px] leading-snug text-ink-2">
              {sel.items.map(([n, why], i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-bright" />
                  <span>
                    <b className="font-bold text-ink">{n[lang]}</b> — {why[lang]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex items-start gap-3 rounded-[16px] border border-brand-tint-2 bg-brand-tint px-4 py-3.5">
            <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
            <p className="text-[13px] leading-relaxed text-ink-2">
              <b className="font-bold text-brand">{v.tipLabel}</b> · {sel.tip[lang]}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-[16px] border border-warn-tint bg-warn-tint px-4 py-3.5">
          <InfoIcon className="h-[18px] w-[18px] shrink-0 text-warn" />
          <p className="text-[13px] leading-relaxed text-ink-2">{v.noMatch}</p>
        </div>
      )}
    </>
  );
}
