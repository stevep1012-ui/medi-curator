"use client";

import { useState } from "react";
import { useI18n, type Lang } from "./i18n";
import { VT } from "./vitamin-data";
import { getPairingFromAI } from "../../services/aiToolsService";
import {
  deleteCombo,
  exportCombosText,
  loadSavedCombos,
  saveCombo,
  type ComboVaultInput,
  type ComboVaultItem,
} from "../../services/comboVaultService";
import type { PairingAIResultT } from "../../schemas/aiTools";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

// AI-path labels kept local so vitamin-data's VT type stays untouched.
const AI_T = {
  badge: ml("AI 추천", "AI pick", "AIおすすめ", "AI 推荐"),
  loading: ml("AI가 목표에 맞는 조합을 찾는 중…", "AI is finding a combo for your goal…", "AIが目標に合う組み合わせを探索中…", "AI 正在为你的目标寻找组合…"),
  errorRetry: ml("다시 시도", "Retry", "再試行", "重试"),
  multiBadge: ml("추천 꿀조합", "Combo picks", "おすすめ組み合わせ", "推荐搭配"),
  saveCombo: ml("내 꿀조합 보관함에 저장", "Save to my combo vault", "組み合わせ保管庫に保存", "保存到我的搭配库"),
  savedCombo: ml("저장됨", "Saved", "保存済み", "已保存"),
  vaultTitle: ml("내 꿀조합 보관함", "My combo vault", "私の組み合わせ保管庫", "我的搭配库"),
  vaultBody: ml("마음에 드는 조합을 저장해 루틴·쇼핑리스트·상담 전 메모로 다시 씁니다.", "Save good combos and reuse them as routines, shopping lists, or pre-consult notes.", "気に入った組み合わせをルーティン・買い物リスト・相談前メモに再利用できます。", "保存喜欢的搭配，用作流程、购物清单或咨询前笔记。"),
  exportVault: ml("보관함 내보내기", "Export vault", "保管庫を書き出す", "导出搭配库"),
  deleteSaved: ml("삭제", "Delete", "削除", "删除"),
  openSaved: ml("열기", "Open", "開く", "打开"),
  savedBadge: ml("보관함", "Saved", "保管庫", "已保存"),
} as const;

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
type CategoryId = "popular" | "taste" | "nutrition" | "beauty" | "sleep" | "fitness" | "immune";
type Goal = {
  id: string;
  category: CategoryId;
  tone: GoalTone;
  kw: string[];
  label: ML;
  summary: ML;
  items: [ML, ML][];
  tip: ML;
};

const CATEGORIES: { id: CategoryId; label: ML; desc: ML }[] = [
  { id: "popular", label: ml("전체 인기", "Popular", "人気", "热门"), desc: ml("가장 많이 찾는 조합", "Most searched combos", "よく検索される組み合わせ", "最常搜索搭配") },
  { id: "taste", label: ml("편의점 맛조합", "Taste combos", "コンビニ味組み", "便利店口味"), desc: ml("건강효능이 아닌 맛·청량감", "Taste and refreshment, not health claims", "健康効果ではなく味・爽快感", "口味与清爽感，不是健康功效") },
  { id: "nutrition", label: ml("기본 영양제", "Nutrition basics", "栄養基本", "基础营养"), desc: ml("같이 먹는 질문이 많은 조합", "Common together-or-not questions", "一緒に摂る質問が多い", "常见同服问题") },
  { id: "beauty", label: ml("피부·미용", "Skin & beauty", "肌・美容", "皮肤美容"), desc: ml("콜라겐·항산화 중심", "Collagen and antioxidant focus", "コラーゲン・抗酸化中心", "胶原与抗氧化") },
  { id: "sleep", label: ml("수면·긴장", "Sleep & calm", "睡眠・リラックス", "睡眠放松"), desc: ml("저녁 루틴에 맞는 조합", "Evening-routine friendly", "夜の習慣向け", "适合晚间流程") },
  { id: "fitness", label: ml("운동·회복", "Fitness recovery", "運動・回復", "运动恢复"), desc: ml("운동 전후 회복 조합", "Workout recovery combos", "運動前後の回復", "运动前后恢复") },
  { id: "immune", label: ml("면역·환절기", "Immune support", "免疫・季節", "免疫换季"), desc: ml("비타민 C·D·아연 중심", "Vitamin C, D, and zinc focus", "C・D・亜鉛中心", "C、D、锌为主") },
];


const GOALS: Goal[] = [
  {
    id: "ice-bacchus",
    category: "taste",
    tone: "amber",
    kw: ["박사", "얼박사", "박카스", "사이다", "bacchus", "cider", "ice bac", "energy drink"],
    label: ml("얼박사 · 박카스+사이다", "Ice Bacchus soda", "アイスバッカスソーダ", "冰力保健苏打"),
    summary: ml(
      "인터넷·편의점에서 유행한 청량 음료 조합입니다. 건강 효과가 아니라 맛 조합으로 안내합니다.",
      "A viral convenience-store drink combo. This is framed as taste, not a health effect.",
      "ネットやコンビニで流行した清涼ドリンクの組み合わせ。健康効果ではなく味の提案です。",
      "网络和便利店流行的清爽饮品搭配。仅作为口味组合，不表示健康功效。",
    ),
    items: [
      [ml("박카스 1병", "1 Bacchus bottle", "バッカス1本", "力保健 1 瓶"), ml("특유의 비타민·타우린 향이 베이스가 됩니다", "Gives the vitamin/taurine-style base note", "ビタミン・タウリン系の風味がベース", "提供维生素/牛磺酸风味基底")],
      [ml("사이다 1~1.5배", "Soda 1–1.5×", "サイダー1〜1.5倍", "苏打 1–1.5 倍"), ml("단맛과 탄산을 더해 여름철 청량감을 올립니다", "Adds sweetness and fizz for a summer-cool taste", "甘さと炭酸で夏らしい爽快感", "增加甜味和气泡感")],
      [ml("얼음컵", "Ice cup", "氷カップ", "冰杯"), ml("진하게 마시려면 1:1, 가볍게 마시려면 1:1.5가 무난합니다", "Try 1:1 for stronger taste or 1:1.5 for lighter fizz", "濃いめは1:1、軽めは1:1.5", "浓一点 1:1，清爽一点 1:1.5")],
    ],
    tip: ml("카페인·당이 있을 수 있어 늦은 밤, 어린이, 임신 중, 심장이 두근거리는 분은 피하거나 디카페인/제로 제품을 확인하세요.", "May contain caffeine and sugar; avoid late night and check decaf/zero options if sensitive, pregnant, young, or with palpitations.", "カフェイン・糖分に注意。夜遅く、子ども、妊娠中、動悸がある方は避けるかデカフェ/ゼロを確認。", "可能含咖啡因和糖；夜间、儿童、孕期或心悸者应避免或选择无咖啡因/零糖产品。"),
  },
  {
    id: "cal-mag-d",
    category: "nutrition",
    tone: "brand",
    kw: ["칼마디", "칼슘", "마그네슘", "비타민 d", "비타민d", "calcium", "magnesium", "vitamin d", "bone"],
    label: ml("칼마디 · 칼슘+마그네슘+D", "Cal-Mag-D", "カルマグD", "钙镁D"),
    summary: ml("뼈·근육 건강에서 자주 묶이는 기본 조합입니다.", "A common baseline combo for bone and muscle support.", "骨・筋肉サポートでよく使われる基本セットです。", "骨骼和肌肉支持中常见的基础组合。"),
    items: [
      [ml("비타민 D", "Vitamin D", "ビタミンD", "维生素D"), ml("칼슘 이용과 면역 균형을 도와요", "Supports calcium use and immune balance", "カルシウム利用と免疫バランスを支える", "帮助钙利用和免疫平衡")],
      [ml("칼슘", "Calcium", "カルシウム", "钙"), ml("뼈·치아 건강의 기본 미네랄", "Core mineral for bones and teeth", "骨・歯の基本ミネラル", "骨骼和牙齿基础矿物质")],
      [ml("마그네슘", "Magnesium", "マグネシウム", "镁"), ml("근육 이완과 신경 기능을 도와요", "Supports muscle relaxation and nerve function", "筋肉の緩和と神経機能を支える", "支持肌肉放松和神经功能")],
    ],
    tip: ml("지용성인 D는 식후, 마그네슘은 저녁 식후가 무난합니다. 신장질환·결석 병력이 있으면 전문가와 확인하세요.", "Vitamin D is fine after meals; magnesium often fits evening. Check with a professional for kidney disease or stone history.", "Dは食後、Mgは夕食後が無難。腎疾患・結石歴があれば専門家へ。", "D 宜餐后，镁常适合晚餐后。有肾病或结石史请咨询专业人员。"),
  },
  {
    id: "omega-c-mag",
    category: "nutrition",
    tone: "brand",
    kw: ["오메가", "오메가3", "비타민c", "마그네슘", "omega", "vitamin c", "fish oil"],
    label: ml("오메가3+C+마그네슘", "Omega-3 + C + Magnesium", "オメガ3+C+Mg", "欧米伽3+C+镁"),
    summary: ml("인터넷에서 많이 묻는 ‘같이 먹어도 되는지’ 조합입니다. 일반적으로는 시간대만 나누면 무난한 편입니다.", "A commonly searched combo. Usually acceptable when timed sensibly.", "よく検索される組み合わせ。時間帯を分ければ一般的には無難です。", "常被搜索的搭配。合理安排时间通常较容易接受。"),
    items: [
      [ml("비타민 C", "Vitamin C", "ビタミンC", "维生素C"), ml("공복 속쓰림이 있으면 식후가 편합니다", "Take after meals if it upsets your stomach", "胃が荒れるなら食後に", "胃不适则餐后服用")],
      [ml("오메가-3", "Omega-3", "オメガ3", "欧米伽-3"), ml("지용성이라 식사 후가 흡수에 유리합니다", "Fat-soluble, so after meals helps absorption", "脂溶性なので食後が向きます", "脂溶性，餐后更利吸收")],
      [ml("마그네슘", "Magnesium", "マグネシウム", "镁"), ml("저녁 식후에 두면 수면 루틴과 맞추기 좋습니다", "Often fits well after dinner as part of a sleep routine", "夕食後に置くと睡眠ルーティンに合う", "晚餐后较适合作为睡眠流程")],
    ],
    tip: ml("항응고제·아스피린 복용 중이면 오메가3는 약사와 먼저 확인하세요.", "If taking anticoagulants or aspirin, check omega-3 with a pharmacist first.", "抗凝固薬・アスピリン服用中はオメガ3を薬剤師に確認。", "服用抗凝药或阿司匹林时，欧米伽3请先咨询药师。"),
  },
  {
    id: "fatigue",
    category: "popular",
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
    category: "beauty",
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
    category: "sleep",
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
    category: "fitness",
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
    category: "fitness",
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
    category: "immune",
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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function VitaminPairing({ uid }: { uid?: string }) {
  const { lang } = useI18n();
  const v = VT[lang];
  const [categoryId, setCategoryId] = useState<CategoryId>("popular");
  const [goalId, setGoalId] = useState<string | null>("ice-bacchus");
  const [text, setText] = useState("");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [savedCombos, setSavedCombos] = useState(() => loadSavedCombos(uid));
  const [viewingSaved, setViewingSaved] = useState<ComboVaultItem | null>(null);

  // Hybrid: predefined goal chips answer instantly; any free-text the chips can't
  // match is judged by the AI so every input gets a real answer.
  const [ai, setAi] = useState<PairingAIResultT | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const recommendGoals = (q: string): Goal[] => {
    const tx = q.toLowerCase().trim();
    if (!tx) return [];
    const direct = GOALS.filter(
      (g) =>
        g.label[lang].toLowerCase().includes(tx) ||
        tx.includes(g.label[lang].toLowerCase()) ||
        g.kw.some((k) => tx.includes(k.toLowerCase()) || k.toLowerCase().includes(tx)),
    );
    const siblingCategory = direct[0]?.category;
    const siblings = siblingCategory ? GOALS.filter((g) => g.category === siblingCategory) : [];
    const popular = GOALS.filter((g) => ["ice-bacchus", "cal-mag-d", "omega-c-mag", "fatigue", "sleep"].includes(g.id));
    const merged = [...direct, ...siblings, ...popular];
    return merged.filter((g, index) => merged.findIndex((x) => x.id === g.id) === index).slice(0, 6);
  };

  function clearAi() {
    setAi(null);
    setAiError(null);
    setAiLoading(false);
  }

  function clearSavedView() {
    setViewingSaved(null);
  }

  function selectGoal(id: string) {
    setGoalId(id);
    const goal = GOALS.find((g) => g.id === id);
    if (goal) setCategoryId(goal.category);
    setText("");
    setRecommendedIds([]);
    clearAi();
    clearSavedView();
  }

  function selectCategory(id: CategoryId) {
    setCategoryId(id);
    setRecommendedIds([]);
    clearAi();
    clearSavedView();
    const first = GOALS.find((g) => (id === "popular" ? ["ice-bacchus", "cal-mag-d", "omega-c-mag", "fatigue", "sleep"].includes(g.id) : g.category === id));
    if (first) setGoalId(first.id);
  }

  function openSavedCombo(combo: ComboVaultItem) {
    setViewingSaved(combo);
    clearAi();
    setRecommendedIds([]);
    setText("");
    const matched = GOALS.find((g) => g.label[lang] === combo.title);
    if (matched) {
      setGoalId(matched.id);
      setCategoryId(matched.category);
    } else {
      setGoalId(null);
    }
  }

  async function runAi(goal: string) {
    setAiLoading(true);
    setAiError(null);
    setAi(null);
    setGoalId(null);
    clearSavedView();
    try {
      setAi(await getPairingFromAI(goal, false, lang));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  function onSubmit() {
    const q = text.trim();
    if (!q) return;
    const picks = recommendGoals(q);
    if (picks.length) {
      setRecommendedIds(picks.map((g) => g.id));
      setGoalId(picks[0].id);
      setCategoryId(picks[0].category);
      clearAi();
      clearSavedView();
      return;
    }
    const m = matchGoal(q);
    if (m) selectGoal(m.id);
    else void runAi(q);
  }

  function currentCombo(): ComboVaultInput | null {
    if (viewingSaved) {
      return {
        title: viewingSaved.title,
        category: viewingSaved.category,
        summary: viewingSaved.summary,
        items: viewingSaved.items,
        tip: viewingSaved.tip,
        disclaimer: viewingSaved.disclaimer,
      };
    }
    if (ai) {
      return {
        title: ai.goalLabel,
        category: AI_T.badge[lang],
        summary: ai.summary,
        items: ai.items.map((item) => ({ name: item.name, why: item.why })),
        tip: ai.tip,
        disclaimer: ai.disclaimer,
      };
    }
    const goal = GOALS.find((g) => g.id === goalId);
    if (!goal) return null;
    const category = CATEGORIES.find((cat) => cat.id === goal.category)?.label[lang] ?? goal.category;
    return {
      title: goal.label[lang],
      category,
      summary: goal.summary[lang],
      items: goal.items.map(([name, why]) => ({ name: name[lang], why: why[lang] })),
      tip: goal.tip[lang],
      disclaimer: v.disclaimer,
    };
  }

  function saveCurrentCombo() {
    const combo = currentCombo();
    if (!combo) return;
    const next = saveCombo(combo, uid);
    setSavedCombos(next);
    if (viewingSaved) {
      const refreshed = next.find((item) => item.title === combo.title);
      if (refreshed) setViewingSaved(refreshed);
    }
  }

  function exportVault() {
    const textOut = exportCombosText(savedCombos, lang);
    downloadText(`mediq-combo-vault-${new Date().toISOString().slice(0, 10)}.txt`, textOut);
  }

  const sel = GOALS.find((g) => g.id === goalId) || null;
  const activeCombo = currentCombo();
  const currentSaved = Boolean(activeCombo && savedCombos.some((item) => item.title === activeCombo.title));

  function renderComboDetail(
    title: string,
    badge: string | null,
    summary: string,
    items: { name: string; why: string }[],
    tip: string,
    disclaimer: string,
    tone: keyof typeof TONE = "brand",
  ) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${TONE[tone]}`}>
            <LeafIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{v.comboFor}</div>
              {badge ? (
                <span className="rounded-full bg-brand px-2 py-[1px] text-[10px] font-extrabold text-white">{badge}</span>
              ) : null}
            </div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">{title}</h3>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed text-ink-2">{summary}</p>
        <section className={CARD_CLS}>
          <h3 className="mb-3.5 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <PillIcon className="h-[15px] w-[15px]" />
            </span>
            {v.items}
          </h3>
          <ul className="space-y-3 text-[13.5px] leading-snug text-ink-2">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-bright" />
                <span>
                  <b className="font-bold text-ink">{it.name}</b> — {it.why}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {tip ? (
          <div className="flex items-start gap-3 rounded-[16px] border border-brand-tint-2 bg-brand-tint px-4 py-3.5">
            <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
            <p className="text-[13px] leading-relaxed text-ink-2">
              <b className="font-bold text-brand">{v.tipLabel}</b> · {tip}
            </p>
          </div>
        ) : null}
        {disclaimer ? <p className="text-[11.5px] leading-relaxed text-ink-4">{disclaimer}</p> : null}
      </div>
    );
  }
  const visibleGoals = categoryId === "popular"
    ? GOALS.filter((g) => ["ice-bacchus", "cal-mag-d", "omega-c-mag", "fatigue", "sleep"].includes(g.id))
    : GOALS.filter((g) => g.category === categoryId);
  const recommendedGoals = recommendedIds.map((id) => GOALS.find((g) => g.id === id)).filter(Boolean) as Goal[];

  return (
    <>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{v.disclaimer}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{v.pick}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const on = cat.id === categoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${on ? "border-brand bg-brand text-white shadow-[0_14px_26px_-18px_rgba(11,110,97,0.85)]" : "border-line bg-surface-soft text-ink-2 hover:border-brand-tint-2 hover:bg-surface"}`}
              >
                <span className="block text-[13px] font-extrabold">{cat.label[lang]}</span>
                <span className={`mt-1 block text-[11px] leading-snug ${on ? "text-white/75" : "text-ink-4"}`}>{cat.desc[lang]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleGoals.map((g) => {
            const on = g.id === goalId;
            const cls = on
              ? "border-brand bg-brand text-white shadow-[0_8px_18px_-10px_rgba(11,110,97,0.8)]"
              : "border-line bg-surface text-ink-2 hover:border-brand-tint-2 hover:text-brand";
            return (
              <button
                key={g.id}
                onClick={() => selectGoal(g.id)}
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
              if (e.key === "Enter") onSubmit();
            }}
            placeholder={v.inputPh}
            className="min-w-0 flex-1 rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
          />
          <button
            onClick={onSubmit}
            disabled={aiLoading}
            className="inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[14px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 disabled:cursor-not-allowed disabled:bg-ink-4"
          >
            <SearchIcon className="h-[17px] w-[17px]" />
            {v.go}
          </button>
        </div>
      </div>

      {recommendedGoals.length > 1 && (
        <section className="mt-6 rounded-[22px] border border-brand-tint-2 bg-brand-tint/45 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.12em] text-white">{AI_T.multiBadge[lang]}</span>
            <h3 className="text-[16px] font-black tracking-[-0.02em] text-ink">{text.trim()}</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedGoals.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGoal(g.id)}
                className={`rounded-2xl border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${g.id === goalId ? "border-brand" : "border-line"}`}
              >
                <span className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-white ${TONE[g.tone]}`}>
                  <LeafIcon className="h-[16px] w-[16px]" />
                </span>
                <span className="block text-[14px] font-black tracking-[-0.02em] text-ink">{g.label[lang]}</span>
                <span className="mt-1.5 block text-[12px] leading-relaxed text-ink-3">{g.summary[lang]}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {aiLoading ? (
        <div className="mt-6 flex items-center gap-3 rounded-[16px] border border-brand-tint-2 bg-brand-tint/40 px-4 py-3.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-[13px] leading-relaxed text-ink-2">{AI_T.loading[lang]}</p>
        </div>
      ) : aiError ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[16px] border border-warn-tint bg-warn-tint px-4 py-3.5">
          <InfoIcon className="h-[18px] w-[18px] shrink-0 text-warn" />
          <p className="text-[13px] leading-relaxed text-ink-2">{aiError}</p>
          <button
            onClick={() => void runAi(text.trim())}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-bold text-ink-2 transition hover:border-brand hover:text-brand"
          >
            {AI_T.errorRetry[lang]}
          </button>
        </div>
      ) : viewingSaved ? (
        renderComboDetail(
          viewingSaved.title,
          AI_T.savedBadge[lang],
          viewingSaved.summary,
          viewingSaved.items,
          viewingSaved.tip,
          viewingSaved.disclaimer,
        )
      ) : ai ? (
        renderComboDetail(ai.goalLabel, AI_T.badge[lang], ai.summary, ai.items, ai.tip, ai.disclaimer)
      ) : sel ? (
        renderComboDetail(
          sel.label[lang],
          null,
          sel.summary[lang],
          sel.items.map(([n, why]) => ({ name: n[lang], why: why[lang] })),
          sel.tip[lang],
          v.disclaimer,
          sel.tone,
        )
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-[16px] border border-warn-tint bg-warn-tint px-4 py-3.5">
          <InfoIcon className="h-[18px] w-[18px] shrink-0 text-warn" />
          <p className="text-[13px] leading-relaxed text-ink-2">{v.noMatch}</p>
        </div>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[22px] border border-brand-tint-2 bg-brand-tint/45 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
              <LeafIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[16px] font-black tracking-[-0.02em] text-ink">{AI_T.vaultTitle[lang]}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{AI_T.vaultBody[lang]}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCurrentCombo}
              disabled={!currentCombo() || currentSaved}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-ink px-4 text-[12.5px] font-extrabold text-surface transition hover:bg-brand disabled:bg-ink-4"
            >
              {currentSaved ? AI_T.savedCombo[lang] : AI_T.saveCombo[lang]}
            </button>
            <button
              type="button"
              onClick={exportVault}
              disabled={savedCombos.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface px-4 text-[12.5px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand disabled:opacity-50"
            >
              {AI_T.exportVault[lang]}
            </button>
          </div>
        </div>

        <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-black tracking-[-0.02em] text-ink">{AI_T.vaultTitle[lang]}</h3>
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-black text-ink-3">{savedCombos.length}/30</span>
          </div>
          <div className="mt-3 max-h-[min(420px,50vh)] space-y-2.5 overflow-y-auto pr-1">
            {savedCombos.length === 0 ? (
              <p className="rounded-2xl bg-surface-soft px-4 py-4 text-[12.5px] leading-relaxed text-ink-3">{AI_T.vaultBody[lang]}</p>
            ) : (
              savedCombos.map((combo) => {
                const active = viewingSaved?.id === combo.id;
                return (
                  <div
                    key={combo.id}
                    className={`rounded-2xl border px-4 py-3 transition ${active ? "border-brand bg-brand-tint/35" : "border-line bg-surface-soft"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openSavedCombo(combo)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-[13.5px] font-black text-ink">{combo.title}</p>
                        <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-3">{combo.summary}</p>
                        <span className="mt-2 inline-flex rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-extrabold text-brand">
                          {AI_T.openSaved[lang]}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSavedCombos(deleteCombo(combo.id, uid));
                          if (viewingSaved?.id === combo.id) clearSavedView();
                        }}
                        className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-extrabold text-ink-4 transition hover:border-danger-line hover:text-danger"
                      >
                        {AI_T.deleteSaved[lang]}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
}
