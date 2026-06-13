import type { RuleId } from "./i18n";

export type Severity = "danger" | "caution" | "duplicate";
export type Finding = { id: RuleId; sev: Severity };
export type Verdict = "danger" | "caution" | "safe";
export type CheckResult = { findings: Finding[]; verdict: Verdict };

// Each token lists multilingual aliases (lowercased substrings).
const TOKENS: Record<string, string[]> = {
  vitK: ["vitamin k", "비타민 k", "비타민k", "ビタミンk", "ビタミンｋ", "维生素k", "維生素k", "vit k"],
  vitE: ["vitamin e", "비타민 e", "비타민e", "ビタミンe", "维生素e", "vit e"],
  omega3: ["omega-3", "omega 3", "omega3", "오메가-3", "오메가3", "오메가 3", "オメガ3", "オメガ-3", "欧米伽-3", "欧米伽3", "鱼油", "fish oil"],
  calcium: ["calcium", "칼슘", "カルシウム", "钙", "鈣"],
  iron: ["iron", "철분", "철", "鉄分", "鉄", "铁", "鐵", "ferrous"],
  zinc: ["zinc", "아연", "亜鉛", "锌", "鋅"],
  copper: ["copper", "구리", "銅", "铜"],
  potassium: ["potassium", "칼륨", "カリウム", "钾", "鉀"],
  stJohns: ["st. john", "st john", "세인트존스워트", "세인트 존스", "セントジョーンズ", "セントジョンズ", "贯叶连翘", "圣约翰草", "聖約翰草"],
  multivit: ["multivitamin", "multi-vitamin", "종합비타민", "멀티비타민", "総合ビタミン", "マルチビタミン", "复合维生素", "綜合維他命", "multivit"],
  anticoag: ["warfarin", "와파린", "항응고", "ワルファリン", "ワーファリン", "抗凝", "华法林", "華法林", "apixaban", "rivaroxaban", "아픽사반", "리바록사반"],
  aspirin: ["aspirin", "아스피린", "アスピリン", "阿司匹林", "阿斯匹靈"],
  ssri: ["ssri", "항우울", "sertraline", "세르트랄린", "fluoxetine", "플루옥세틴", "抗うつ", "抗抑郁", "抗抑鬱", "セルトラリン", "舍曲林"],
  ace: ["ace inhibitor", "ace 억제", "lisinopril", "리시노프릴", " enalapril", "에날라프릴", "リシノプリル", "ace阻害", "ace抑制", "赖诺普利", "賴諾普利", "-pril"],
  thyroid: ["thyroid", "갑상선", "levothyroxine", "레보티록신", "甲状腺", "甲狀腺", "レボチロキシン", "左甲状腺素", "synthroid"],
};

const hasTok = (text: string, tok: keyof typeof TOKENS) => TOKENS[tok].some((a) => text.includes(a));

type Rule = { id: RuleId; sev: Severity; test: (q: string, c: string) => boolean };

// q = queried item text, c = currently-taken text (both lowercased)
const RULES: Rule[] = [
  { id: "vitk_anticoag", sev: "danger", test: (q, c) => hasTok(q, "vitK") && hasTok(c, "anticoag") },
  { id: "sjw_ssri", sev: "danger", test: (q, c) => hasTok(q, "stJohns") && hasTok(c, "ssri") },
  { id: "potassium_ace", sev: "danger", test: (q, c) => hasTok(q, "potassium") && hasTok(c, "ace") },
  { id: "vite_bleed", sev: "caution", test: (q, c) => hasTok(q, "vitE") && (hasTok(c, "anticoag") || hasTok(c, "aspirin")) },
  { id: "omega_anticoag", sev: "caution", test: (q, c) => hasTok(q, "omega3") && hasTok(c, "anticoag") },
  { id: "cal_thyroid", sev: "caution", test: (q, c) => hasTok(q, "calcium") && hasTok(c, "thyroid") },
  { id: "iron_thyroid", sev: "caution", test: (q, c) => hasTok(q, "iron") && hasTok(c, "thyroid") },
  { id: "iron_calcium", sev: "caution", test: (q, c) => hasTok(q, "iron") && hasTok(c, "calcium") },
  {
    id: "multivit_dup",
    sev: "duplicate",
    test: (q, c) =>
      hasTok(c, "multivit") &&
      (hasTok(q, "vitK") || hasTok(q, "vitE") || hasTok(q, "iron") || hasTok(q, "calcium") || hasTok(q, "zinc")),
  },
];

const SEV_ORDER: Record<Severity, number> = { danger: 0, duplicate: 1, caution: 2 };

export function runInteractionCheck(queryText: string, currentText: string): CheckResult {
  const q = (queryText || "").toLowerCase();
  const c = (currentText || "").toLowerCase();
  const findings = RULES.filter((r) => r.test(q, c)).map((r) => ({ id: r.id, sev: r.sev }));
  findings.sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]);
  let verdict: Verdict = "safe";
  if (findings.some((f) => f.sev === "danger")) verdict = "danger";
  else if (findings.length) verdict = "caution";
  return { findings, verdict };
}
