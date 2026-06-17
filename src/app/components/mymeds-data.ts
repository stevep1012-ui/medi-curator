// '내 약·비타민' 화면 헤드 카피 — MyMeds.tsx 가 컴포넌트만 export 하도록 분리
// (react-refresh/only-export-components), vitamin-data.ts 와 동일한 패턴.
import type { Lang } from "./i18n";

export const MYMEDS_HEAD: Record<Lang, [string, string]> = {
  ko: ["내 약·비타민", "촬영하면 성분·효능을 정리해 기기에만 기록합니다. 원할 때 다시 확인하세요."],
  en: ["My meds & vitamins", "Scan to record ingredients and uses on this device only. Re-check anytime."],
  ja: ["私の薬・ビタミン", "撮影すると成分・効能を整理し端末内のみに記録。いつでも再確認できます。"],
  zh: ["我的药品·维生素", "拍照即整理成分与功效，仅记录在本机。随时再次查看。"],
};
