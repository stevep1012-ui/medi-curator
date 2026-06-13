"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: { code: Lang; native: string }[] = [
  { code: "ko", native: "한국어" },
  { code: "en", native: "English" },
  { code: "ja", native: "日本語" },
  { code: "zh", native: "中文" },
];

export type RuleId =
  | "vitk_anticoag"
  | "sjw_ssri"
  | "potassium_ace"
  | "vite_bleed"
  | "omega_anticoag"
  | "cal_thyroid"
  | "iron_thyroid"
  | "iron_calcium"
  | "multivit_dup";

export type TabKey = "symptom" | "interaction" | "pharmacy" | "history" | "privacy";

export type Dict = {
  brand: { name: string; tag: string };
  theme: { auto: string; day: string; night: string; light: string; dark: string };
  tabs: Record<TabKey, [string, string]>;
  head: Record<TabKey, [string, string]>;
  footer: string;
  symptom: {
    disclaimer: string;
    symptomsLabel: string;
    symptomsPh: string;
    symptomsVal: string;
    medsLabel: string;
    medsPh: string;
    medsVal: string;
    analyze: string;
    resultsOverview: string;
    educationalSummary: string;
    findPharmacy: string;
    otcTitle: string;
    interactionTitle: string;
    exerciseTitle: string;
    herbalTitle: string;
    redFlagTitle: string;
    otc: string[];
    interaction: string;
    exercise: string;
    herbal: string[];
    redFlags: string[];
  };
  interaction: {
    queryLabel: string;
    queryPh: string;
    queryVal: string;
    currentLabel: string;
    currentPh: string;
    currentVal: string;
    checkBtn: string;
    findingsTitle: string;
    noInput: string;
    verdict: { danger: string; caution: string; safe: string };
    sev: { danger: string; caution: string; duplicate: string };
    safeTitle: string;
    safeDetail: string;
    disclaimer: string;
    count: (n: number) => string;
    rules: Record<RuleId, [string, string]>;
  };
  pharmacy: {
    useLocation: string;
    enterAddress: string;
    within: string;
    open: string;
    closed: string;
    directions: string;
    items: { name: string; addr: string; note: string }[];
  };
  history: {
    title: string;
    clearAll: string;
    empty: string;
    items: { text: string; tag: string }[];
  };
  privacy: {
    items: { title: string; desc: string }[];
    policy: string;
    terms: string;
    deleteAll: string;
  };
};

/* Language-independent metadata shared across locales */
export const PH_META = [
  { distance: "240m", rating: "4.8", open: true },
  { distance: "410m", rating: "4.6", open: true },
  { distance: "820m", rating: "4.9", open: false },
];
export const HIST_META = [
  { date: "2026.06.10", time: "14:22" },
  { date: "2026.06.07", time: "09:05" },
  { date: "2026.06.02", time: "21:40" },
];
export const PRIV_ON = [true, true, false];

export const TRANSLATIONS: Record<Lang, Dict> = {
  ko: {
    brand: { name: "메디큐레이터", tag: "AI 건강 가이드" },
    theme: { auto: "자동", day: "낮", night: "밤", light: "라이트", dark: "다크" },
    tabs: {
      symptom: ["증상 분석", "증상"],
      interaction: ["복용 검사", "검사"],
      pharmacy: ["약국 찾기", "약국"],
      history: ["검색 기록", "기록"],
      privacy: ["개인정보", "내정보"],
    },
    head: {
      symptom: [
        "증상을 알려주세요 — 명확하고 신중한 다음 단계를 안내합니다.",
        "증상 정리, 상담 질문, 위험 신호 확인을 돕습니다. 진단이나 약품 추천이 아닌, 차분한 출발점입니다.",
      ],
      interaction: [
        "복용 안전성을 먼저 확인하세요.",
        "새로 복용할 약·비타민이 지금 드시는 것과 겹치거나 해가 되지 않는지 판단해 드립니다.",
      ],
      pharmacy: ["가까운 약국을 찾아보세요.", "영업시간과 거리를 한눈에 — 필요한 것을 헤매지 않고 받을 수 있습니다."],
      history: ["지난 검색을 한곳에서.", "이 기기에만 저장됩니다. 언제든 다시 보고, 검토하고, 삭제하세요."],
      privacy: ["건강 데이터는 당신이 관리합니다.", "민감정보는 동의가 있을 때만 처리됩니다. 모든 권한을 여기서 관리하세요."],
    },
    footer: "본 정보는 교육용이며 의학적 진단이 아닙니다. 응급 상황에서는 지역 응급번호로 전화하거나 가까운 응급실을 방문하세요.",
    symptom: {
      disclaimer: "본 도구는 일반 건강 정보를 제공하며 전문 의료 상담을 대체하지 않습니다. 증상이 지속되거나 악화되면 의사나 약사와 상담하세요.",
      symptomsLabel: "증상",
      symptomsPh: "예: 두통, 가벼운 기침, 인후통",
      symptomsVal: "두통, 가벼운 기침, 인후통",
      medsLabel: "복용 중인 약",
      medsPh: "예: 세르트랄린 50mg 매일",
      medsVal: "세르트랄린 50mg 매일",
      analyze: "증상 분석하기",
      resultsOverview: "결과 요약",
      educationalSummary: "교육용 요약",
      findPharmacy: "약국 찾기 열기",
      otcTitle: "상담 전 정리할 정보",
      interactionTitle: "복용 정보 확인",
      exerciseTitle: "일반 생활관리",
      herbalTitle: "피해야 할 행동",
      redFlagTitle: "위험 신호 — 즉시 도움 받기",
      otc: [
        "증상이 시작된 시점, 지속 시간, 악화·완화 요인을 적어 두세요.",
        "현재 복용 중인 약·건강기능식품·알레르기 정보를 그대로 가져가세요.",
        "열, 통증 정도, 호흡 곤란, 발진, 구토 등 동반 증상을 함께 기록하세요.",
        "의사·약사에게 물어볼 질문을 미리 정리하세요.",
      ],
      interaction: "새 약이나 보충제를 시작하기 전에는 현재 복용 중인 모든 제품 목록을 약사 또는 의사에게 보여 주세요. 이 화면은 특정 약품명, 용량, 상호작용 판단을 제공하지 않습니다.",
      exercise: "충분한 휴식, 수분 섭취, 증상 변화 관찰처럼 일반적인 생활관리만 참고하세요. 증상이 지속되거나 악화되면 전문 의료진과 상담하세요.",
      herbal: [
        "스스로 약을 추가하거나 용량을 조절하지 마세요.",
        "어린이, 임신·수유, 고령자, 간·신장질환, 항응고제 복용자는 반드시 전문가에게 먼저 확인하세요.",
        "응급 신호가 있으면 앱 사용을 중단하고 지역 응급번호 또는 응급실을 이용하세요.",
      ],
      redFlags: [
        "흉통, 심한 호흡곤란, 실신 또는 의식 변화",
        "자해·자살 생각 또는 즉각적인 안전 위험",
        "빠르게 악화되는 심한 통증, 마비, 얼굴 처짐, 말이 어눌해짐",
        "심한 알레르기 반응, 빠르게 번지는 발진, 얼굴·입술 부종",
      ],
    },
    interaction: {
      queryLabel: "문의한 약 · 비타민",
      queryPh: "예: 비타민 K, 오메가-3, 칼슘",
      queryVal: "비타민 K, 칼슘",
      currentLabel: "현재 장기 복용 중인 약 · 비타민",
      currentPh: "예: 와파린, 종합비타민, 갑상선약",
      currentVal: "와파린(항응고제), 갑상선약, 종합비타민",
      checkBtn: "중복 · 상호작용 검사",
      findingsTitle: "검사 결과",
      noInput: "위 두 칸을 채우고 검사를 눌러 주세요.",
      verdict: { danger: "주의가 필요해요", caution: "확인이 필요해요", safe: "특이사항이 없어요" },
      sev: { danger: "위험", caution: "주의", duplicate: "중복" },
      safeTitle: "알려진 충돌 없음",
      safeDetail:
        "입력하신 조합에서 알려진 중복·상호작용은 확인되지 않았습니다. 모든 상호작용을 다루지는 않으니, 새 보충제는 약사와 상담 후 시작하세요.",
      disclaimer: "이 검사는 일반 정보이며 전문 상담을 대체하지 않습니다. 복용 전 약사·의사와 확인하세요.",
      count: (n) => `${n}건 해당`,
      rules: {
        vitk_anticoag: ["비타민 K × 항응고제", "비타민 K가 와파린 등 항응고제 효과를 약화시켜 혈전 위험이 커질 수 있습니다. 복용 전 의사와 상담하세요."],
        sjw_ssri: ["세인트존스워트 × 항우울제(SSRI)", "세로토닌 증후군 위험으로 병용은 피해야 합니다. 반드시 의료진과 상담하세요."],
        potassium_ace: ["칼륨 보충제 × ACE 억제제", "리시노프릴 등과 함께 쓰면 고칼륨혈증 위험이 있습니다. 임의 복용을 피하세요."],
        vite_bleed: ["고용량 비타민 E × 항응고제·아스피린", "항혈소판·항응고 작용이 더해져 출혈 위험이 높아질 수 있습니다."],
        omega_anticoag: ["고용량 오메가-3 × 항응고제", "출혈 위험을 약간 높일 수 있어 항응고제 복용 시 주의가 필요합니다."],
        cal_thyroid: ["칼슘 × 갑상선약", "칼슘이 갑상선약(레보티록신) 흡수를 방해합니다. 4시간 이상 간격을 두세요."],
        iron_thyroid: ["철분 × 갑상선약", "철분이 갑상선약 흡수를 줄입니다. 4시간 이상 간격을 두세요."],
        iron_calcium: ["철분 × 칼슘", "동시에 먹으면 서로 흡수를 방해합니다. 시간을 나눠 복용하세요."],
        multivit_dup: ["종합비타민과 성분 중복", "종합비타민에 이미 든 성분을 더하면 과잉 섭취가 될 수 있습니다. 라벨 함량을 확인하세요."],
      },
    },
    pharmacy: {
      useLocation: "내 위치로 찾기",
      enterAddress: "주소 직접 입력",
      within: "반경 1.5km · 2곳 영업 중",
      open: "영업 중",
      closed: "영업 종료",
      directions: "길찾기",
      items: [
        { name: "온누리약국", addr: "서울 강남구 역삼로 152 · 1층", note: "02-538-1004" },
        { name: "역삼365약국", addr: "서울 강남구 테헤란로 211 · 지하 1층", note: "02-501-7942" },
        { name: "강남센트럴약국", addr: "서울 강남구 강남대로 390 · 2층", note: "09:00 오픈" },
      ],
    },
    history: {
      title: "검색 기록",
      clearAll: "전체 삭제",
      empty: "저장된 검색이 없습니다. 기록은 이 기기에만 저장됩니다.",
      items: [
        { text: "3일간 인후통과 기침, 약 37.5°C 미열.", tag: "이비인후과" },
        { text: "오른쪽 아랫배 콕콕 쑤심과 메스꺼움.", tag: "내과" },
        { text: "손목을 접질려 붓고 움직일 때 통증.", tag: "정형외과" },
      ],
    },
    privacy: {
      items: [
        { title: "건강정보 처리 동의", desc: "증상과 약물 분석에 필요합니다. 끄면 분석을 사용할 수 없습니다." },
        { title: "검색 기록 로컬 저장", desc: "기록을 이 기기에만 보관하며 서버로 전송하지 않습니다." },
        { title: "익명 사용 통계 제공", desc: "안내 품질 개선에 도움이 됩니다. 언제든 끌 수 있습니다." },
      ],
      policy: "개인정보처리방침",
      terms: "이용약관",
      deleteAll: "모든 데이터 삭제",
    },
  },

  en: {
    brand: { name: "Medical Curator", tag: "AI WELLNESS GUIDANCE" },
    theme: { auto: "Auto", day: "day", night: "night", light: "Light", dark: "Dark" },
    tabs: {
      symptom: ["Symptom analysis", "Symptoms"],
      interaction: ["Safety check", "Check"],
      pharmacy: ["Find pharmacy", "Pharmacy"],
      history: ["Search history", "History"],
      privacy: ["Privacy", "Privacy"],
    },
    head: {
      symptom: [
        "Tell us your symptoms — get clear, careful next steps.",
        "Organize symptoms, prepare consultation questions, and review red flags. Not a diagnosis or medicine recommendation — a calm starting point.",
      ],
      interaction: [
        "Check your combination is safe first.",
        "We flag whether a new medicine or vitamin duplicates or interferes with what you already take.",
      ],
      pharmacy: ["Find a pharmacy near you.", "Open hours and distance at a glance, so you can pick up what you need without the guesswork."],
      history: ["Your past searches, in one place.", "Saved locally on this device. Revisit, review, or clear them anytime."],
      privacy: ["You control your health data.", "Sensitive information is processed only with your consent. Manage every permission here."],
    },
    footer: "This is educational information only and not a medical diagnosis. In an emergency, call your local emergency number or visit the nearest emergency department.",
    symptom: {
      disclaimer: "This tool offers general health information and does not replace professional medical advice. If symptoms persist or worsen, consult a doctor or pharmacist.",
      symptomsLabel: "Symptoms",
      symptomsPh: "e.g., headache, mild cough, sore throat",
      symptomsVal: "headache, mild cough, sore throat",
      medsLabel: "Current Medications",
      medsPh: "e.g., sertraline 50mg daily",
      medsVal: "sertraline 50mg daily",
      analyze: "Analyze symptoms",
      resultsOverview: "Results overview",
      educationalSummary: "Educational summary",
      findPharmacy: "Open pharmacy finder",
      otcTitle: "Information to prepare before consultation",
      interactionTitle: "Medication information check",
      exerciseTitle: "General self-care",
      herbalTitle: "Actions to avoid",
      redFlagTitle: "Red flags — get help now",
      otc: [
        "Write down when symptoms started, how long they lasted, and what makes them better or worse.",
        "Bring a complete list of medicines, supplements, allergies, and relevant conditions.",
        "Record associated signs such as fever, pain severity, breathing trouble, rash, or vomiting.",
        "Prepare questions for a doctor or pharmacist before the visit.",
      ],
      interaction: "Before starting any medicine or supplement, show your full current product list to a pharmacist or doctor. This screen does not provide specific drug names, doses, or interaction judgments.",
      exercise: "Use only general self-care such as rest, hydration, and monitoring symptom changes. If symptoms persist or worsen, consult a qualified clinician.",
      herbal: [
        "Do not add medicines or change doses on your own.",
        "Children, pregnancy or breastfeeding, older age, liver/kidney disease, and anticoagulant use require professional guidance first.",
        "If a red flag is present, stop using the app and contact local emergency services or an emergency department.",
      ],
      redFlags: [
        "Chest pain, severe shortness of breath, fainting, or altered consciousness",
        "Self-harm or suicidal thoughts, or any immediate safety risk",
        "Rapidly worsening severe pain, paralysis, facial droop, or slurred speech",
        "Severe allergic reaction, rapidly spreading rash, or swelling of the face or lips",
      ],
    },
    interaction: {
      queryLabel: "Medicine / vitamin in question",
      queryPh: "e.g., vitamin K, omega-3, calcium",
      queryVal: "vitamin K, calcium",
      currentLabel: "Currently taken long-term",
      currentPh: "e.g., warfarin, multivitamin, thyroid medication",
      currentVal: "warfarin (anticoagulant), thyroid medication, multivitamin",
      checkBtn: "Check duplicates & interactions",
      findingsTitle: "Findings",
      noInput: "Fill in both fields above, then run the check.",
      verdict: { danger: "Needs caution", caution: "Worth checking", safe: "Nothing notable" },
      sev: { danger: "RISK", caution: "CAUTION", duplicate: "DUPLICATE" },
      safeTitle: "No known conflicts",
      safeDetail:
        "No known duplicates or interactions were found for the combination you entered. This does not cover every interaction — start any new supplement after checking with a pharmacist.",
      disclaimer: "This check is general information and does not replace professional advice. Confirm with a pharmacist or doctor before taking.",
      count: (n) => `${n} issue(s) found`,
      rules: {
        vitk_anticoag: ["Vitamin K × anticoagulant", "Vitamin K can weaken anticoagulants like warfarin, raising clot risk. Consult your doctor before taking."],
        sjw_ssri: ["St. John's Wort × antidepressant (SSRI)", "Risk of serotonin syndrome — avoid combining. Always consult your clinician."],
        potassium_ace: ["Potassium supplement × ACE inhibitor", "Combined with lisinopril and similar, raises the risk of high blood potassium. Avoid taking on your own."],
        vite_bleed: ["High-dose vitamin E × anticoagulant / aspirin", "Antiplatelet and anticoagulant effects can add up, increasing bleeding risk."],
        omega_anticoag: ["High-dose omega-3 × anticoagulant", "May slightly raise bleeding risk, so use caution with anticoagulants."],
        cal_thyroid: ["Calcium × thyroid medication", "Calcium blocks absorption of thyroid medication (levothyroxine). Separate by at least 4 hours."],
        iron_thyroid: ["Iron × thyroid medication", "Iron reduces thyroid medication absorption. Separate by at least 4 hours."],
        iron_calcium: ["Iron × calcium", "Taken together they block each other’s absorption. Space the doses apart."],
        multivit_dup: ["Overlaps with your multivitamin", "Adding a nutrient already in your multivitamin can lead to excess intake. Check the label amounts."],
      },
    },
    pharmacy: {
      useLocation: "Use my location",
      enterAddress: "Enter address manually",
      within: "Within 1.5km · 2 open now",
      open: "OPEN",
      closed: "CLOSED",
      directions: "Directions",
      items: [
        { name: "Onnuri Pharmacy", addr: "152 Yeoksam-ro, Gangnam-gu · 1F", note: "02-538-1004" },
        { name: "Yeoksam 365 Pharmacy", addr: "211 Teheran-ro, Gangnam-gu · B1", note: "02-501-7942" },
        { name: "Gangnam Central Pharmacy", addr: "390 Gangnam-daero, Gangnam-gu · 2F", note: "Opens 09:00" },
      ],
    },
    history: {
      title: "Search history",
      clearAll: "Clear all",
      empty: "No saved searches. Your history stays on this device only.",
      items: [
        { text: "Sore throat and cough for 3 days, mild fever around 37.5°C.", tag: "ENT" },
        { text: "Sharp pain in the lower-right abdomen with nausea.", tag: "Internal Medicine" },
        { text: "Twisted wrist, swollen and painful when moving.", tag: "Orthopedics" },
      ],
    },
    privacy: {
      items: [
        { title: "Health data processing consent", desc: "Required to analyze symptoms and medications. Turning this off disables analysis." },
        { title: "Store search history locally", desc: "History is kept only on this device and never sent to a server." },
        { title: "Share anonymous usage statistics", desc: "Helps improve guidance quality. You can turn this off at any time." },
      ],
      policy: "Privacy Policy",
      terms: "Terms of Service",
      deleteAll: "Delete all data",
    },
  },

  ja: {
    brand: { name: "メディキュレーター", tag: "AIウェルネスガイド" },
    theme: { auto: "自動", day: "昼", night: "夜", light: "ライト", dark: "ダーク" },
    tabs: {
      symptom: ["症状分析", "症状"],
      interaction: ["服用チェック", "確認"],
      pharmacy: ["薬局検索", "薬局"],
      history: ["検索履歴", "履歴"],
      privacy: ["プライバシー", "設定"],
    },
    head: {
      symptom: [
        "症状を入力してください — 明確で慎重な次のステップをご案内します。",
        "症状の整理、相談時の質問、危険な兆候の確認を支援します。診断や薬の推奨ではなく、落ち着いた出発点です。",
      ],
      interaction: [
        "まず組み合わせの安全性を確認。",
        "新しく飲む薬・ビタミンが、今飲んでいるものと重複したり害にならないかを判定します。",
      ],
      pharmacy: ["近くの薬局を探す。", "営業時間と距離をひと目で。必要なものを迷わず受け取れます。"],
      history: ["これまでの検索を一か所に。", "この端末にのみ保存されます。いつでも確認・見直し・削除できます。"],
      privacy: ["健康データはあなたが管理します。", "機微情報は同意がある場合にのみ処理されます。すべての権限をここで管理できます。"],
    },
    footer: "これは教育目的の情報であり、医学的診断ではありません。緊急時は地域の緊急番号に電話するか、最寄りの救急外来を受診してください。",
    symptom: {
      disclaimer: "本ツールは一般的な健康情報を提供するもので、専門的な医療アドバイスに代わるものではありません。症状が続く・悪化する場合は医師または薬剤師に相談してください。",
      symptomsLabel: "症状",
      symptomsPh: "例：頭痛、軽い咳、のどの痛み",
      symptomsVal: "頭痛、軽い咳、のどの痛み",
      medsLabel: "服用中の薬",
      medsPh: "例：セルトラリン50mg 毎日",
      medsVal: "セルトラリン50mg 毎日",
      analyze: "症状を分析",
      resultsOverview: "結果の概要",
      educationalSummary: "教育用の要約",
      findPharmacy: "薬局検索を開く",
      otcTitle: "相談前に整理する情報",
      interactionTitle: "服用情報の確認",
      exerciseTitle: "一般的なセルフケア",
      herbalTitle: "避けるべき行動",
      redFlagTitle: "危険な兆候 — すぐに助けを求める",
      otc: [
        "症状が始まった時期、続いている時間、悪化・軽減する要因を書き留めてください。",
        "服用中の薬、サプリメント、アレルギー、関連する持病の一覧を持参してください。",
        "発熱、痛みの強さ、息苦しさ、発疹、嘔吐などの随伴症状を記録してください。",
        "医師または薬剤師に確認したい質問を事前にまとめてください。",
      ],
      interaction: "新しい薬やサプリメントを始める前に、現在使用している製品の全リストを薬剤師または医師に見せてください。この画面では具体的な薬品名、用量、相互作用判断は提供しません。",
      exercise: "休息、水分補給、症状変化の観察など一般的なセルフケアのみ参考にしてください。症状が続く・悪化する場合は専門職に相談してください。",
      herbal: [
        "自己判断で薬を追加したり用量を変更しないでください。",
        "子ども、妊娠・授乳中、高齢者、肝腎疾患、抗凝固薬使用中の場合は必ず先に専門職へ確認してください。",
        "危険な兆候がある場合はアプリの使用をやめ、地域の緊急番号または救急外来を利用してください。",
      ],
      redFlags: [
        "胸の痛み、激しい息切れ、失神、意識の変化",
        "自傷・自殺の考え、または差し迫った安全上の危険",
        "急速に悪化する強い痛み、麻痺、顔のゆがみ、ろれつが回らない",
        "重いアレルギー反応、急速に広がる発疹、顔や唇の腫れ",
      ],
    },
    interaction: {
      queryLabel: "お問い合わせの薬・ビタミン",
      queryPh: "例：ビタミンK、オメガ3、カルシウム",
      queryVal: "ビタミンK、カルシウム",
      currentLabel: "現在、長期服用中の薬・ビタミン",
      currentPh: "例：ワルファリン、総合ビタミン、甲状腺薬",
      currentVal: "ワルファリン（抗凝固薬）、甲状腺薬、総合ビタミン",
      checkBtn: "重複・相互作用をチェック",
      findingsTitle: "チェック結果",
      noInput: "上の2つを入力してチェックを押してください。",
      verdict: { danger: "注意が必要です", caution: "確認が必要です", safe: "特記事項はありません" },
      sev: { danger: "危険", caution: "注意", duplicate: "重複" },
      safeTitle: "既知の衝突なし",
      safeDetail:
        "入力された組み合わせで、既知の重複・相互作用は確認されませんでした。すべての相互作用を網羅するものではありません。新しいサプリは薬剤師に相談してから始めてください。",
      disclaimer: "このチェックは一般情報であり、専門的な助言に代わるものではありません。服用前に薬剤師・医師にご確認ください。",
      count: (n) => `${n} 件の該当`,
      rules: {
        vitk_anticoag: ["ビタミンK × 抗凝固薬", "ビタミンKがワルファリンなどの抗凝固薬の効果を弱め、血栓リスクが高まる可能性があります。服用前に医師に相談してください。"],
        sjw_ssri: ["セントジョーンズワート × 抗うつ薬（SSRI）", "セロトニン症候群のリスクがあり併用は避けてください。必ず医療者に相談を。"],
        potassium_ace: ["カリウム補充 × ACE阪害薬", "リシノプリルなどと併用すると高カリウム血症のリスクがあります。自己判断での服用は避けてください。"],
        vite_bleed: ["高用量ビタミンE × 抗凝固薬・アスピリン", "抗血小板・抗凝固作用が加わり、出血リスクが高まる可能性があります。"],
        omega_anticoag: ["高用量オメガ3 × 抗凝固薬", "出血リスクをやや高める可能性があり、抗凝固薬との併用は注意が必要です。"],
        cal_thyroid: ["カルシウム × 甲状腺薬", "カルシウムが甲状腺薬（レボチロキシン）の吸収を妨げます。4時間以上あけてください。"],
        iron_thyroid: ["鉄分 × 甲状腺薬", "鉄分が甲状腺薬の吸収を低下させます。4時間以上あけてください。"],
        iron_calcium: ["鉄分 × カルシウム", "同時に摂ると互いの吸収を妨げます。時間をずらして服用してください。"],
        multivit_dup: ["総合ビタミンと成分が重複", "総合ビタミンに既に含まれる成分を足すと過剰摂取になることがあります。ラベルの含有量を確認してください。"],
      },
    },
    pharmacy: {
      useLocation: "現在地で探す",
      enterAddress: "住所を入力",
      within: "半径1.5km・2軒営業中",
      open: "営業中",
      closed: "営業終了",
      directions: "経路",
      items: [
        { name: "オンヌリ薬局", addr: "ソウル江南区 駅三路152・1F", note: "02-538-1004" },
        { name: "駅三365薬局", addr: "ソウル江南区 テヘラン路211・B1", note: "02-501-7942" },
        { name: "江南セントラル薬局", addr: "ソウル江南区 江南大路390・2F", note: "09:00 開店" },
      ],
    },
    history: {
      title: "検索履歴",
      clearAll: "すべて削除",
      empty: "保存された検索はありません。履歴はこの端末にのみ保存されます。",
      items: [
        { text: "3日間のどの痛みと咳、約37.5℃の微熱。", tag: "耳鼻咽喉科" },
        { text: "右下腹部のチクチクする痛みと吐き気。", tag: "内科" },
        { text: "手首をひねって腫れ、動かすと痛い。", tag: "整形外科" },
      ],
    },
    privacy: {
      items: [
        { title: "健康情報の処理に同意", desc: "症状と薬の分析に必要です。オフにすると分析を利用できません。" },
        { title: "検索履歴をローカルに保存", desc: "履歴はこの端末にのみ保管し、サーバーには送信しません。" },
        { title: "匿名の利用統計を提供", desc: "ガイドの品質向上に役立ちます。いつでもオフにできます。" },
      ],
      policy: "プライバシーポリシー",
      terms: "利用規約",
      deleteAll: "すべてのデータを削除",
    },
  },

  zh: {
    brand: { name: "医疗管家", tag: "AI健康指南" },
    theme: { auto: "自动", day: "白天", night: "夜间", light: "浅色", dark: "深色" },
    tabs: {
      symptom: ["症状分析", "症状"],
      interaction: ["用药检查", "检查"],
      pharmacy: ["查找药房", "药房"],
      history: ["搜索记录", "记录"],
      privacy: ["隐私", "隐私"],
    },
    head: {
      symptom: [
        "告诉我们您的症状 — 获取清晰、谨慎的后续建议。",
        "帮助整理症状、准备咨询问题并查看危险信号。不是诊断或药物推荐，而是冷静的起点。",
      ],
      interaction: [
        "先确认您的搭配是否安全。",
        "判断新服用的药物或维生素是否与您正在服用的重复或产生危害。",
      ],
      pharmacy: ["查找您附近的药房。", "一眼掌握营业时间与距离，省去猜测，轻松取药。"],
      history: ["您的历史搜索，集中一处。", "仅保存在本设备。随时回看、查阅或清除。"],
      privacy: ["您的健康数据由您掌控。", "敏感信息仅在您同意后处理。在此管理所有权限。"],
    },
    footer: "本信息仅供教育用途，并非医学诊断。如遇紧急情况，请拨打当地急救电话或前往最近的急诊科。",
    symptom: {
      disclaimer: "本工具提供一般健康信息，不能替代专业医疗建议。若症状持续或加重，请咨询医生或药剂师。",
      symptomsLabel: "症状",
      symptomsPh: "例如：头痛、轻微咳嗽、咽喉痛",
      symptomsVal: "头痛、轻微咳嗽、咽喉痛",
      medsLabel: "正在服用的药物",
      medsPh: "例如：舍曲林50mg每日",
      medsVal: "舍曲林50mg每日",
      analyze: "分析症状",
      resultsOverview: "结果概览",
      educationalSummary: "教育性摘要",
      findPharmacy: "打开药房查找",
      otcTitle: "咨询前需要整理的信息",
      interactionTitle: "用药信息确认",
      exerciseTitle: "一般自我护理",
      herbalTitle: "应避免的行为",
      redFlagTitle: "危险信号 — 立即求助",
      otc: [
        "记录症状何时开始、持续多久，以及哪些因素会加重或缓解。",
        "带上当前药物、补充剂、过敏史和相关疾病的完整清单。",
        "记录发热、疼痛程度、呼吸困难、皮疹、呕吐等伴随表现。",
        "提前整理要咨询医生或药剂师的问题。",
      ],
      interaction: "开始任何新药或补充剂前，请将当前使用的所有产品清单给药剂师或医生查看。本页面不提供具体药名、剂量或相互作用判断。",
      exercise: "仅参考休息、补水、观察症状变化等一般自我护理。若症状持续或加重，请咨询合格医疗人员。",
      herbal: [
        "不要自行添加药物或调整剂量。",
        "儿童、孕期或哺乳期、老年人、肝肾疾病、正在使用抗凝药者，应先获得专业指导。",
        "若出现危险信号，请停止使用应用并联系当地急救服务或急诊科。",
      ],
      redFlags: [
        "胸痛、严重呼吸困难、晕厥或意识改变",
        "自伤或自杀想法，或任何即时安全风险",
        "迅速加重的剧烈疼痛、麻痹、面部下垂或言语不清",
        "严重过敏反应、快速扩散的皮疹或面部/嘴唇肿胀",
      ],
    },
    interaction: {
      queryLabel: "咨询的药物 · 维生素",
      queryPh: "例如：维生素K、欧米伽-3、钙",
      queryVal: "维生素K、钙",
      currentLabel: "目前长期服用的药物 · 维生素",
      currentPh: "例如：华法林、复合维生素、甲状腺药",
      currentVal: "华法林（抗凝药）、甲状腺药、复合维生素",
      checkBtn: "检查重复与相互作用",
      findingsTitle: "检查结果",
      noInput: "请填写以上两栏后点击检查。",
      verdict: { danger: "需要注意", caution: "值得确认", safe: "无特别事项" },
      sev: { danger: "风险", caution: "注意", duplicate: "重复" },
      safeTitle: "未发现已知冲突",
      safeDetail:
        "未发现您所输入组合的已知重复或相互作用。这并不涵盖所有相互作用——开始任何新补充剂前请咨询药剂师。",
      disclaimer: "本检查为一般信息，不能替代专业建议。服用前请向药剂师或医生确认。",
      count: (n) => `发现 ${n} 项`,
      rules: {
        vitk_anticoag: ["维生素K × 抗凝药", "维生素K会削弱华法林等抗凝药的作用，增加血栓风险。服用前请咨询医生。"],
        sjw_ssri: ["圣约翰草 × 抗抑郁药（SSRI）", "存在血清素综合征风险，应避免合用。请务必咨询医务人员。"],
        potassium_ace: ["钾补充剂 × ACE抑制剂", "与赖诺普利等合用会增加高血钾风险。请勿自行服用。"],
        vite_bleed: ["高剂量维生素E × 抗凝药·阿司匹林", "抗血小板与抗凝作用叠加，可能增加出血风险。"],
        omega_anticoag: ["高剂量欧米伽-3 × 抗凝药", "可能略微增加出血风险，与抗凝药同用需谨慎。"],
        cal_thyroid: ["钙 × 甲状腺药", "钙会阻碍甲状腺药（左甲状腺素）的吸收。请间隔至少4小时。"],
        iron_thyroid: ["铁 × 甲状腺药", "铁会降低甲状腺药的吸收。请间隔至少4小时。"],
        iron_calcium: ["铁 × 钙", "同时服用会相互阻碍吸收。请分开时间服用。"],
        multivit_dup: ["与复合维生素成分重复", "补充复合维生素已含的成分可能造成摄入过量。请核对标签含量。"],
      },
    },
    pharmacy: {
      useLocation: "使用我的位置",
      enterAddress: "手动输入地址",
      within: "1.5公里内 · 2家营业中",
      open: "营业中",
      closed: "已打烊",
      directions: "导航",
      items: [
        { name: "温暖药房", addr: "首尔江南区 驿三路152 · 1层", note: "02-538-1004" },
        { name: "驿三365药房", addr: "首尔江南区 德黑兰路211 · 地下1层", note: "02-501-7942" },
        { name: "江南中央药房", addr: "首尔江南区 江南大路390 · 2层", note: "09:00 营业" },
      ],
    },
    history: {
      title: "搜索记录",
      clearAll: "全部清除",
      empty: "暂无保存的搜索。记录仅保存在本设备。",
      items: [
        { text: "咽喉痛和咳嗽3天，低烧约37.5°C。", tag: "耳鼻喉科" },
        { text: "右下腹刺痛伴恶心。", tag: "内科" },
        { text: "手腕扭伤，肿胀且活动时疼痛。", tag: "骨科" },
      ],
    },
    privacy: {
      items: [
        { title: "同意处理健康信息", desc: "用于分析症状和药物。关闭后将无法使用分析功能。" },
        { title: "在本地保存搜索记录", desc: "记录仅保存在本设备，不会发送至服务器。" },
        { title: "提供匿名使用统计", desc: "有助于改进指引质量。可随时关闭。" },
      ],
      policy: "隐私政策",
      terms: "服务条款",
      deleteAll: "删除所有数据",
    },
  },
};

/* ---------------- context ---------------- */
type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: Dict };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    const saved = localStorage.getItem("mc-lang") as Lang | null;
    if (saved && TRANSLATIONS[saved]) {
      setLangState(saved);
      return;
    }
    // No saved preference → respect the device's default language.
    const cands =
      typeof navigator !== "undefined" && navigator.languages && navigator.languages.length
        ? navigator.languages
        : [typeof navigator !== "undefined" ? navigator.language : ""];
    const detect = (): Lang => {
      for (const raw of cands) {
        const c = (raw || "").toLowerCase();
        if (c.startsWith("ko")) return "ko";
        if (c.startsWith("ja")) return "ja";
        if (c.startsWith("zh")) return "zh";
        if (c.startsWith("en")) return "en";
      }
      return "ko";
    };
    setLangState(detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("mc-lang", l);
    setLangState(l);
  };

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t: TRANSLATIONS[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
