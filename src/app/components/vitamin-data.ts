// Vitamin-pairing copy, split out of VitaminPairing.tsx so the component file
// exports only a component (react-refresh/only-export-components).
import type { Lang } from "./i18n";

export const VT: Record<Lang, {
  head: [string, string];
  pick: string;
  inputPh: string;
  go: string;
  comboFor: string;
  items: string;
  tipLabel: string;
  noMatch: string;
  disclaimer: string;
}> = {
  ko: {
    head: ["목표에 맞는 비타민 궁합", "원하는 목표를 고르면 함께 먹으면 좋은 영양제 조합을 안내합니다."],
    pick: "목표를 선택하세요",
    inputPh: "예: 눈 피로, 집중력, 면역",
    go: "추천 보기",
    comboFor: "추천 조합",
    items: "함께 먹으면 좋아요",
    tipLabel: "복용 팁",
    noMatch: "딱 맞는 목표를 찾지 못했어요. 아래에서 가장 가까운 목표를 골라 보세요.",
    disclaimer: "일반적인 영양 정보이며 의학적 조언이 아닙니다. 복용 중인 약이 있으면 약사와 상담하세요.",
  },
  en: {
    head: ["Vitamin pairing for your goal", "Pick a goal and we suggest supplements that work well together."],
    pick: "Choose a goal",
    inputPh: "e.g., eye strain, focus, immunity",
    go: "See picks",
    comboFor: "Recommended combo",
    items: "Good to take together",
    tipLabel: "How to take",
    noMatch: "No exact match — pick the closest goal below.",
    disclaimer: "General nutrition info, not medical advice. If you take medication, consult a pharmacist.",
  },
  ja: {
    head: ["目標に合うビタミンの相性", "目標を選ぶと相性の良いサプリの組み合わせを案内します。"],
    pick: "目標を選択",
    inputPh: "例：眼精疲労、集中力、免疫",
    go: "おすすめを見る",
    comboFor: "おすすめの組み合わせ",
    items: "一緒に摂ると良い",
    tipLabel: "摂り方",
    noMatch: "一致する目標が見つかりません。下から近いものを選んでください。",
    disclaimer: "一般的な栄養情報であり医療アドバイスではありません。服薬中は薬剤師にご相談を。",
  },
  zh: {
    head: ["契合目标的维生素搭配", "选择目标，为你推荐适合一起服用的营养组合。"],
    pick: "选择目标",
    inputPh: "例如：眼疲劳、专注、免疫",
    go: "查看推荐",
    comboFor: "推荐组合",
    items: "适合一起服用",
    tipLabel: "服用建议",
    noMatch: "未找到完全匹配，请在下方选择最接近的目标。",
    disclaimer: "仅为一般营养信息，非医疗建议。如在服药请咨询药师。",
  },
};

export const VITAMIN_HEAD: Record<Lang, [string, string]> = {
  ko: VT.ko.head,
  en: VT.en.head,
  ja: VT.ja.head,
  zh: VT.zh.head,
};
