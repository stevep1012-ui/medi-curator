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
    head: ["비타민·편의점 꿀조합", "영양제 조합부터 인터넷에서 도는 맛 조합까지, 일반 정보 수준으로 빠르게 정리합니다."],
    pick: "꿀조합을 선택하세요",
    inputPh: "예: 박사, 칼마디, 오메가3 C 마그네슘, 눈 피로",
    go: "조합 보기",
    comboFor: "추천 조합",
    items: "구성·이유",
    tipLabel: "복용 팁",
    noMatch: "딱 맞는 목표를 찾지 못했어요. 아래에서 가장 가까운 목표를 골라 보세요.",
    disclaimer: "일반적인 영양·생활 정보입니다. 맛 조합은 건강 효능으로 보지 않고, 복용 중인 약이 있으면 약사와 확인하세요.",
  },
  en: {
    head: ["Vitamin and viral combo picks", "Quickly organize supplement pairings and internet-style taste combos as general information."],
    pick: "Choose a combo",
    inputPh: "e.g., Ice Bacchus, Cal-Mag-D, omega-3 C magnesium, eye strain",
    go: "See combo",
    comboFor: "Recommended combo",
    items: "What goes in it",
    tipLabel: "How to take",
    noMatch: "No exact match — pick the closest goal below.",
    disclaimer: "General nutrition and lifestyle info. Taste combos are not health-effect claims; consult a pharmacist if taking medication.",
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
