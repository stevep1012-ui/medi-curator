"use client";

import { useEffect } from "react";
import { useI18n, type Lang } from "./i18n";

export type LegalKey = "about" | "terms" | "privacy" | "faq" | "support" | "notices";
type Doc = { title: string; sections: [string, string][] };
type LangLegal = { updated: string; about: Doc; terms: Doc; privacy: Doc; faq: Doc; support: Doc; notices: Doc };

/** Standard service Terms / Privacy boilerplate (original wording, common clauses). */
export const LEGAL: Record<Lang, LangLegal> = {
  ko: {
    updated: "시행일: 2026년 1월 1일",
    terms: {
      title: "이용약관",
      sections: [
        ["제1조 (목적)", "이 약관은 메디큐레이터(이하 \"회사\")가 제공하는 건강 정보 안내 서비스(이하 \"서비스\")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 이용 조건 및 절차를 규정함을 목적으로 합니다."],
        ["제2조 (정의)", "① \"서비스\"란 증상 분석, 복용 안전 검사, 비타민 궁합 안내, 약국 찾기 등 회사가 제공하는 일체의 건강 정보 기능을 의미합니다.\n② \"이용자\"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.\n③ \"콘텐츠\"란 서비스에서 제공되는 모든 텍스트, 이미지, 정보 및 자료를 의미합니다."],
        ["제3조 (의료 행위가 아님)", "서비스가 제공하는 모든 정보는 일반적인 건강·의약 정보로서 참고용이며, 의학적 진단·처방·치료를 대체하지 않습니다. 질병의 진단 및 치료가 필요한 경우 반드시 의사·약사 등 전문가와 상담하시기 바랍니다. 응급 상황에서는 즉시 119 또는 가까운 의료기관에 연락하십시오."],
        ["제4조 (약관의 효력 및 변경)", "① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.\n② 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 변경 시 적용일자 및 개정 사유를 명시하여 최소 7일 전부터 공지합니다."],
        ["제5조 (서비스의 제공 및 변경)", "① 회사는 연중무휴, 1일 24시간 서비스를 제공함을 원칙으로 합니다.\n② 시스템 점검, 증설, 고장, 통신 두절 등 운영상 필요한 경우 서비스의 전부 또는 일부를 제한하거나 중지할 수 있으며, 사전 또는 사후에 이를 공지합니다."],
        ["제6조 (이용자의 의무)", "이용자는 서비스 이용 시 관계 법령과 이 약관을 준수해야 하며, 타인의 정보를 도용하거나 서비스의 운영을 고의로 방해하는 행위, 회사 또는 제3자의 권리를 침해하는 행위를 하여서는 안 됩니다."],
        ["제7조 (책임의 제한)", "① 회사는 천재지변 또는 이에 준하는 불가항력으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.\n② 회사는 이용자가 서비스의 정보에 기초하여 행한 판단 및 결과에 대하여 법령이 허용하는 범위 내에서 책임을 지지 않습니다."],
        ["제8조 (준거법 및 관할)", "이 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생할 경우 민사소송법상의 관할 법원을 제1심 관할 법원으로 합니다."],
      ],
    },
    privacy: {
      title: "개인정보처리방침",
      sections: [
        ["1. 총칙", "회사는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 회사가 어떤 정보를 수집·이용하며, 이를 어떻게 보호하는지를 안내합니다."],
        ["2. 수집하는 개인정보 항목", "① 회원가입·로그인: 소셜 로그인 제공자가 전달하는 식별자, 닉네임(선택).\n② 서비스 이용 과정에서 이용자가 직접 입력하는 증상·복용 약물 정보(건강 관련 정보).\n③ 자동 수집: 서비스 이용 기록, 접속 로그, 기기·브라우저 정보.\n검색 기록 및 환경설정은 이용자의 기기(로컬 저장소)에 저장되며 회사 서버로 전송되지 않습니다."],
        ["3. 개인정보의 이용 목적", "수집한 정보는 ① 서비스 제공 및 맞춤 안내, ② 본인 확인 및 회원 관리, ③ 서비스 개선과 통계 분석, ④ 법령상 의무 이행의 목적으로만 이용합니다."],
        ["4. 민감정보의 처리", "이용자가 입력하는 증상·복용 약물 등 건강 관련 정보는 민감정보로 분류되며, 이용자가 동의한 범위 내에서 안내 기능 제공에만 사용됩니다. 별도 동의 없이 제3자에게 제공하지 않습니다."],
        ["5. 보유 및 이용 기간", "개인정보는 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다."],
        ["6. 제3자 제공", "회사는 이용자의 개인정보를 본 방침에서 고지한 범위를 초과하여 이용하거나 제3자에게 제공하지 않습니다. 다만 법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우는 예외로 합니다."],
        ["7. 이용자의 권리", "이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 기기에 저장된 검색 기록은 서비스 내에서 직접 삭제할 수 있습니다."],
        ["8. 개인정보 보호책임자", "성명: 개인정보 보호책임자 · 연락처: privacy@mediq.health · 고객센터 1577-0000. 개인정보와 관련한 문의·불만·피해구제는 위 연락처로 접수하실 수 있습니다."],
      ],
    },
    about: {
      title: "서비스 소개",
      sections: [
        ["메디큐레이터란", "메디큐레이터는 증상 정리, 상담 질문 준비, 일반 생활정보, 독립 약국 검색을 한곳에서 제공하는 건강 정보 도구입니다. 의료 판단이나 약품 추천이 아닌 참고용 정보 제공을 목표로 합니다."],
        ["우리가 지키는 원칙", "① 진단이 아닌 안내 — 전문가 상담을 대체하지 않습니다. ② 투명성 — 정보의 근거와 한계를 분명히 합니다. ③ 프라이버시 우선 — 검색 기록은 기기에 저장되며 서버로 전송하지 않습니다."],
        ["이용 대상", "증상을 정리해 전문가 상담을 준비하거나 가까운 약국 위치를 중립적으로 확인하려는 분에게 적합합니다."],
      ],
    },
    faq: {
      title: "자주 묻는 질문",
      sections: [
        ["진단을 받을 수 있나요?", "아니요. 메디큐레이터는 일반적인 건강·의약 정보를 안내할 뿐 의학적 진단을 제공하지 않습니다. 정확한 진단·처방은 의사·약사와 상담하세요."],
        ["입력한 정보는 안전한가요?", "증상·복용 정보는 분석 요청 시 서버를 거쳐 처리될 수 있으며, 검색 기록 저장은 이용자 설정에 따릅니다. 개인정보처리방침에서 처리 목적과 보관 범위를 확인할 수 있습니다."],
        ["복용 안전 검사는 어떻게 동작하나요?", "복용 정보를 정리하고 전문가에게 확인할 항목을 보여주는 참고 기능입니다. 모든 상호작용을 판정하거나 복용 가능 여부를 보장하지 않습니다."],
        ["처방전 사진 인식이 되나요?", "출시 전에는 처방전·약봉투 사진 인식을 의료 판단에 사용하지 않습니다. 약품명 확인은 반드시 약사·의사에게 직접 확인하세요."],
        ["무료인가요?", "핵심 안내 기능은 무료로 제공됩니다. 향후 추가되는 프리미엄 기능은 별도로 안내해 드립니다."],
      ],
    },
    support: {
      title: "고객센터",
      sections: [
        ["문의 방법", "이메일 help@mediq.health 또는 고객센터 1577-0000(평일 09:00–18:00, 공휴일 휴무)으로 문의해 주세요."],
        ["자주 묻는 질문 먼저 확인", "문의 전 자주 묻는 질문(FAQ)을 확인하시면 더 빠르게 답을 찾으실 수 있습니다."],
        ["응급 상황", "메디큐레이터는 응급 의료를 제공하지 않습니다. 응급 상황에서는 즉시 119 또는 가까운 응급실로 연락하세요."],
      ],
    },
    notices: {
      title: "공지사항",
      sections: [
        ["[업데이트] 비타민 궁합 기능 추가 — 2026.01.05", "목표(피로 회복·수면·면역 등)를 고르면 함께 먹으면 좋은 영양제 조합을 안내하는 기능이 추가되었습니다."],
        ["[업데이트] 4개 언어 지원 — 2026.01.03", "한국어·영어·일본어·중국어를 지원합니다. 헤더의 지구본 아이콘에서 언어를 바꿀 수 있습니다."],
        ["[안내] 서비스 점검 안내 — 2026.01.01", "보다 안정적인 서비스 제공을 위해 정기 점검을 진행합니다. 점검 중 일부 기능 이용이 제한될 수 있습니다."],
      ],
    },
  },
  en: {
    updated: "Effective: January 1, 2026",
    terms: {
      title: "Terms of Service",
      sections: [
        ["1. Purpose", "These Terms govern the rights, obligations and responsibilities between MediQ (\"Company\") and users regarding the use of the health-information guidance service (\"Service\")."],
        ["2. Definitions", "\"Service\" means all health-information features the Company provides, including symptom analysis, drug-safety checks, vitamin pairing and pharmacy finder. \"User\" means any member or non-member who uses the Service under these Terms."],
        ["3. Not Medical Care", "All information provided is general health and medication information for reference only and does not replace medical diagnosis, prescription or treatment. Always consult a physician or pharmacist when diagnosis or treatment is needed. In an emergency, contact local emergency services or the nearest medical facility immediately."],
        ["4. Effect and Amendment", "These Terms take effect when posted within the Service. The Company may amend these Terms within the limits of applicable law, giving notice of the effective date and reasons at least 7 days in advance."],
        ["5. Provision and Changes", "The Service is in principle available 24 hours a day, year-round. The Company may restrict or suspend all or part of the Service for maintenance, upgrades, failures or interruptions, with prior or subsequent notice."],
        ["6. User Obligations", "Users must comply with applicable laws and these Terms, and must not misappropriate others’ information, intentionally disrupt the Service, or infringe the rights of the Company or third parties."],
        ["7. Limitation of Liability", "The Company is exempt from liability where the Service cannot be provided due to force majeure. To the extent permitted by law, the Company is not liable for decisions or outcomes based on information from the Service."],
        ["8. Governing Law", "These Terms are interpreted under the laws of the Republic of Korea, and any dispute shall be subject to the competent court under the Civil Procedure Act as the court of first instance."],
      ],
    },
    privacy: {
      title: "Privacy Policy",
      sections: [
        ["1. General", "The Company values your privacy and complies with applicable data-protection laws. This policy explains what information we collect and use, and how we protect it."],
        ["2. Information We Collect", "(i) Sign-up/login: identifier from your social login provider and optional nickname. (ii) Health information you enter (symptoms, medications). (iii) Automatically: usage records, access logs, device/browser information. Search history and preferences are stored on your device (local storage) and are not sent to our servers."],
        ["3. Purpose of Use", "We use collected information only to (i) provide and personalize the Service, (ii) verify identity and manage accounts, (iii) improve the Service and run statistical analysis, and (iv) meet legal obligations."],
        ["4. Sensitive Information", "Health-related information you enter is treated as sensitive data and used solely to provide guidance features within the scope of your consent. It is not provided to third parties without separate consent."],
        ["5. Retention", "Personal information is destroyed without delay once its purpose is achieved, except where retention is required by law for the relevant period."],
        ["6. Third-Party Disclosure", "We do not use or disclose your personal information beyond the scope stated here, except where required by law or upon a lawful request by an investigative authority."],
        ["7. Your Rights", "You may request access, correction, deletion or suspension of processing of your personal information at any time, and you can delete locally stored search history directly within the Service."],
        ["8. Privacy Officer", "Privacy Officer · privacy@mediq.health · Support 1577-0000. Please direct privacy inquiries, complaints and remedies to the contact above."],
      ],
    },
    about: {
      title: "About",
      sections: [
        ["What is MediQ", "MediQ provides symptom organization, consultation preparation, general self-care information, and an independent pharmacy finder. It is for reference only and does not provide medical judgment or medicine recommendations."],
        ["Our principles", "(i) Guidance, not diagnosis — we never replace a professional consultation. (ii) Transparency — we make the basis and limits of information clear. (iii) Privacy first — search history is stored on your device, never sent to our servers."],
        ["Who it’s for", "People who want to organize symptoms before professional consultation or neutrally locate nearby pharmacies."],
      ],
    },
    faq: {
      title: "FAQ",
      sections: [
        ["Can I get a diagnosis?", "No. MediQ provides general health and medication information only and does not offer a medical diagnosis. For an accurate diagnosis or prescription, consult a physician or pharmacist."],
        ["Is my information safe?", "Symptom and medication entries may be processed through the server when you request analysis, and search-history storage depends on your settings. See the Privacy Policy for details."],
        ["How does the safety check work?", "This feature helps organize medication information and items to verify with a professional. It does not determine every interaction or guarantee that a product is safe to take."],
        ["Does prescription photo scanning work?", "Prescription or medication-bag photo recognition is not used for medical judgment before release. Always verify medicine names directly with a pharmacist or doctor."],
        ["Is it free?", "The core guidance features are free. Any premium features added in the future will be announced separately."],
      ],
    },
    support: {
      title: "Support",
      sections: [
        ["How to reach us", "Email help@mediq.health or call 1577-0000 (weekdays 09:00–18:00, closed on public holidays)."],
        ["Check the FAQ first", "Checking the FAQ before contacting us is often the fastest way to find an answer."],
        ["Emergencies", "MediQ does not provide emergency care. In an emergency, contact local emergency services or the nearest ER immediately."],
      ],
    },
    notices: {
      title: "Notices",
      sections: [
        ["[Update] Vitamin pairing added — Jan 5, 2026", "Pick a goal (fatigue recovery, sleep, immunity, etc.) and get a recommended supplement combo."],
        ["[Update] Four languages — Jan 3, 2026", "Korean, English, Japanese and Chinese are supported. Switch languages from the globe icon in the header."],
        ["[Notice] Scheduled maintenance — Jan 1, 2026", "We perform regular maintenance for a more stable service. Some features may be limited during maintenance."],
      ],
    },
  },
  ja: {
    updated: "施行日：2026年1月1日",
    terms: {
      title: "利用規約",
      sections: [
        ["第1条（目的）", "本規約は、MediQ（以下「当社」）が提供する健康情報案内サービス（以下「本サービス」）の利用に関し、当社と利用者の権利・義務および責任事項を定めることを目的とします。"],
        ["第2条（定義）", "「本サービス」とは、症状分析、服用安全チェック、ビタミンの相性案内、薬局検索など当社が提供する健康情報機能をいいます。「利用者」とは本規約に従い本サービスを利用する会員・非会員をいいます。"],
        ["第3条（医療行為ではないこと）", "本サービスが提供する情報は一般的な健康・医薬情報であり参考用です。医学的な診断・処方・治療に代わるものではありません。診断や治療が必要な場合は必ず医師・薬剤師にご相談ください。緊急時は直ちに救急機関または最寄りの医療機関へご連絡ください。"],
        ["第4条（規約の効力および変更）", "本規約は本サービス上に掲示することで効力を生じます。当社は関係法令の範囲内で規約を改定でき、変更時は適用日と理由を明示し7日前から告知します。"],
        ["第5条（提供および変更）", "本サービスは原則年中無休・24時間提供します。点検、増設、故障、通信障害などの場合は、事前または事後の告知をもって全部または一部を制限・中止できます。"],
        ["第6条（利用者の義務）", "利用者は関係法令および本規約を遵守し、他人の情報の盗用、本サービスの運営妨害、当社または第三者の権利侵害を行ってはなりません。"],
        ["第7条（責任の制限）", "天災等の不可抗力により提供できない場合、当社は責任を免れます。法令が許容する範囲で、本サービスの情報に基づく判断や結果について当社は責任を負いません。"],
        ["第8条（準拠法）", "本規約は大韓民国の法令に従って解釈され、紛争が生じた場合は民事訴訟法上の管轄裁判所を第一審の管轄とします。"],
      ],
    },
    privacy: {
      title: "プライバシーポリシー",
      sections: [
        ["1. 総則", "当社は利用者の個人情報を重視し、関連する個人情報保護法令を遵守します。本方針は当社が収集・利用する情報とその保護方法を説明します。"],
        ["2. 収集する個人情報", "①登録・ログイン：ソーシャルログイン提供者の識別子、ニックネーム（任意）。②利用者が入力する症状・服用薬情報（健康関連情報）。③自動収集：利用記録、アクセスログ、端末・ブラウザ情報。検索履歴と設定は端末（ローカル保存）に保存され、当社サーバーには送信されません。"],
        ["3. 利用目的", "収集情報は①サービス提供と案内、②本人確認と会員管理、③サービス改善と統計分析、④法令上の義務履行のためにのみ利用します。"],
        ["4. 機微情報の取扱い", "入力される症状・服用薬などの健康関連情報は機微情報として扱い、同意の範囲内で案内機能の提供にのみ使用します。別途同意なく第三者へ提供しません。"],
        ["5. 保有期間", "個人情報は目的達成後、遅滞なく破棄します。ただし法令により保存が必要な場合は当該期間保管します。"],
        ["6. 第三者提供", "本方針で告知した範囲を超えて利用・提供しません。ただし法令に根拠がある場合や捜査機関の適法な要請がある場合を除きます。"],
        ["7. 利用者の権利", "利用者はいつでも個人情報の閲覧・訂正・削除・処理停止を請求でき、端末に保存された検索履歴はサービス内で直接削除できます。"],
        ["8. 個人情報保護責任者", "個人情報保護責任者 · privacy@mediq.health · サポート 1577-0000。個人情報に関するお問い合わせは上記までご連絡ください。"],
      ],
    },
    about: {
      title: "サービス紹介",
      sections: [
        ["メディキュレーターとは", "メディキュレーターは、症状整理、相談準備、一般的なセルフケア情報、独立した薬局検索を提供する健康情報ツールです。医療判断や薬の推奨ではなく、参考情報の提供を目的とします。"],
        ["私たちの原則", "①診断ではなく案内 — 専門家への相談に代わるものではありません。②透明性 — 情報の根拠と限界を明確にします。③プライバシー優先 — 検索履歴は端末に保存し、サーバーには送信しません。"],
        ["対象となる方", "専門職への相談前に症状を整理したい方、または近くの薬局を中立的に探したい方に適しています。"],
      ],
    },
    faq: {
      title: "よくある質問",
      sections: [
        ["診断は受けられますか？", "いいえ。メディキュレーターは一般的な健康・医薬情報を案内するのみで、医学的な診断は行いません。正確な診断・処方は医師・薬剤師にご相談ください。"],
        ["入力した情報は安全ですか？", "症状・服用薬の情報は、分析を依頼する際にサーバーを通じて処理される場合があります。検索履歴の保存は設定によります。詳細はプライバシーポリシーをご覧ください。"],
        ["服用安全チェックの仕組みは？", "服用情報を整理し、専門職に確認する項目を示す参考機能です。すべての相互作用を判定したり、服用可否を保証するものではありません。"],
        ["処方箋の写真認識はできますか？", "リリース前は処方箋・薬袋の写真認識を医療判断に使用しません。薬品名は必ず薬剤師または医師に直接確認してください。"],
        ["無料ですか？", "主要な案内機能は無料です。今後追加されるプレミアム機能は別途ご案内します。"],
      ],
    },
    support: {
      title: "サポート",
      sections: [
        ["お問い合わせ方法", "メール help@mediq.health またはサポート 1577-0000（平日 09:00–18:00、祝日休み）までご連絡ください。"],
        ["まずFAQをご確認ください", "お問い合わせの前によくある質問をご確認いただくと、より早く解決できます。"],
        ["緊急時", "メディキュレーターは救急医療を提供しません。緊急時は直ちに救急機関または最寄りの救急外来へご連絡ください。"],
      ],
    },
    notices: {
      title: "お知らせ",
      sections: [
        ["[更新] ビタミンの相性機能を追加 — 2026.01.05", "目標（疲労回復・睡眠・免疫など）を選ぶと、一緒に摂ると良いサプリの組み合わせを案内します。"],
        ["[更新] 4言語対応 — 2026.01.03", "日本語・韓国語・英語・中国語に対応。ヘッダーの地球アイコンから言語を切り替えられます。"],
        ["[お知らせ] メンテナンス — 2026.01.01", "より安定したサービス提供のため定期メンテナンスを実施します。メンテナンス中は一部機能の利用が制限される場合があります。"],
      ],
    },
  },
  zh: {
    updated: "生效日期：2026年1月1日",
    terms: {
      title: "使用条款",
      sections: [
        ["第一条（目的）", "本条款旨在规定MediQ（以下称\"公司\"）所提供的健康信息向导服务（以下称\"本服务\"）使用过程中，公司与用户之间的权利、义务与责任。"],
        ["第二条（定义）", "\"本服务\"指公司提供的症状分析、用药安全检查、维生素搭配、查找药房等全部健康信息功能。\"用户\"指依据本条款使用本服务的会员及非会员。"],
        ["第三条（非医疗行为）", "本服务提供的信息为一般健康与用药信息，仅供参考，不能替代医学诊断、处方或治疗。如需诊断或治疗，请务必咨询医生或药师。紧急情况下请立即联系急救机构或就近医疗机构。"],
        ["第四条（条款效力与变更）", "本条款经在服务内公示即生效。公司可在不违反相关法律的范围内修订条款，变更时将提前7日公告生效日期与理由。"],
        ["第五条（提供与变更）", "本服务原则上全年无休、每日24小时提供。因检修、扩容、故障或通信中断等情况，可在事先或事后公告后限制或中止全部或部分服务。"],
        ["第六条（用户义务）", "用户应遵守相关法律及本条款，不得盗用他人信息、故意妨碍服务运营或侵害公司及第三方的权利。"],
        ["第七条（责任限制）", "因不可抗力导致无法提供服务时，公司免除责任。在法律允许的范围内，公司对用户基于本服务信息所作判断及结果不承担责任。"],
        ["第八条（准据法）", "本条款依据大韩民国法律解释，如发生争议，以《民事诉讼法》规定的管辖法院为第一审管辖法院。"],
      ],
    },
    privacy: {
      title: "隐私政策",
      sections: [
        ["1. 总则", "公司重视用户的个人信息，并遵守相关个人信息保护法律。本政策说明公司收集、使用哪些信息以及如何保护。"],
        ["2. 收集的个人信息", "①注册/登录：社交登录提供方的标识符、昵称（可选）。②用户输入的症状、在服药物信息（健康相关信息）。③自动收集：使用记录、访问日志、设备/浏览器信息。搜索记录与偏好设置保存在用户设备（本地存储），不会发送至公司服务器。"],
        ["3. 使用目的", "所收集信息仅用于①提供与个性化服务，②身份验证与会员管理，③服务改进与统计分析，④履行法定义务。"],
        ["4. 敏感信息处理", "用户输入的症状、用药等健康相关信息按敏感信息处理，仅在用户同意范围内用于提供向导功能，未经单独同意不向第三方提供。"],
        ["5. 保存期限", "个人信息在达成目的后将立即销毁。但依法律需保存的，按相应期限保管。"],
        ["6. 第三方提供", "公司不会超出本政策告知范围使用或向第三方提供您的个人信息，但法律有依据或侦查机关合法要求的情形除外。"],
        ["7. 用户权利", "用户可随时要求查阅、更正、删除或停止处理其个人信息，并可在服务内直接删除设备上保存的搜索记录。"],
        ["8. 个人信息保护负责人", "个人信息保护负责人 · privacy@mediq.health · 客服 1577-0000。与个人信息相关的咨询与投诉可通过上述方式提交。"],
      ],
    },
    about: {
      title: "关于服务",
      sections: [
        ["什么是MediQ", "MediQ提供症状整理、咨询准备、一般自我护理信息和独立药房查找。它仅供参考，不提供医疗判断或药物推荐。"],
        ["我们的原则", "①向导而非诊断——不替代专业咨询。②透明——明确信息的依据与局限。③隐私优先——搜索记录保存在设备上，不发送至服务器。"],
        ["适用人群", "适合希望在专业咨询前整理症状，或中立查找附近药房的人。"],
      ],
    },
    faq: {
      title: "常见问题",
      sections: [
        ["可以获得诊断吗？", "不能。MediQ仅提供一般健康与用药信息，不提供医学诊断。准确的诊断与处方请咨询医生或药师。"],
        ["我输入的信息安全吗？", "症状和用药信息在请求分析时可能通过服务器处理，搜索记录保存取决于用户设置。详见隐私政策。"],
        ["用药安全检查如何运作？", "此功能帮助整理用药信息和需要向专业人员确认的项目，并不判断所有相互作用或保证某产品可以安全服用。"],
        ["支持拍照识别处方吗？", "发布前，处方或药袋照片识别不会用于医疗判断。药品名称请务必直接向药师或医生确认。"],
        ["是免费的吗？", "核心向导功能免费提供。未来新增的高级功能将另行通知。"],
      ],
    },
    support: {
      title: "客户支持",
      sections: [
        ["联系方式", "请发送邮件至 help@mediq.health 或致电客服 1577-0000（工作日 09:00–18:00，节假日休息）。"],
        ["请先查看常见问题", "联系我们之前查看常见问题，往往能更快找到答案。"],
        ["紧急情况", "MediQ不提供急救医疗。紧急情况下请立即联系急救机构或就近急诊。"],
      ],
    },
    notices: {
      title: "公告",
      sections: [
        ["[更新] 新增维生素搭配功能 — 2026.01.05", "选择目标（缓解疲劳、睡眠、免疫等），即可获得适合一起服用的营养组合建议。"],
        ["[更新] 支持四种语言 — 2026.01.03", "支持中文、韩语、英语、日语。可在页眉的地球图标处切换语言。"],
        ["[公告] 系统维护通知 — 2026.01.01", "为提供更稳定的服务，我们将进行定期维护。维护期间部分功能可能受限。"],
      ],
    },
  },
};

export function LegalModal({ docKey, onClose }: { docKey: LegalKey | null; onClose: () => void }) {
  const { lang } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!docKey) return null;
  const doc = LEGAL[lang][docKey];
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(8,18,17,.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-[0_30px_90px_-24px_rgba(0,0,0,0.6)] sm:max-h-[86vh] sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold tracking-tight text-ink">{doc.title}</h2>
            {(docKey === "terms" || docKey === "privacy") && (
              <p className="mt-1 text-[12px] text-ink-4">{LEGAL[lang].updated}</p>
            )}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-ink-3 transition hover:text-ink" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-[13.5px] leading-relaxed text-ink-2">
          {doc.sections.map(([h, b], i) => (
            <section key={i}>
              <h3 className="mb-1.5 text-[14.5px] font-bold tracking-tight text-ink">{h}</h3>
              <p className="whitespace-pre-line text-ink-2">{b}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
