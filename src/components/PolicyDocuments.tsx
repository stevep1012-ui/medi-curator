// Policy documents surface (privacy policy, terms, overseas-transfer notice).
// Business-identity fields are placeholders until the operator is registered —
// they mirror config/release-profile.json and the gate:release-readiness check,
// so the app cannot ship policy pages with fabricated business info.
const PLACEHOLDER = '[출시 전 확정 필요]';

export default function PolicyDocuments() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-ink">개인정보처리방침</h2>
        <dl className="mt-3 space-y-2 text-[13.5px] text-ink-2">
          <div className="flex gap-2">
            <dt className="font-semibold">사업자명</dt>
            <dd>{PLACEHOLDER}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">대표자</dt>
            <dd>{PLACEHOLDER}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">사업장 주소</dt>
            <dd>{PLACEHOLDER}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">개인정보 보호책임자</dt>
            <dd>{PLACEHOLDER}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">개인정보 문의 이메일</dt>
            <dd>{PLACEHOLDER}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          본 서비스는 민감정보인 건강정보를 서버에 저장하지 않습니다. 검색 이력은
          이용자 본인의 디바이스에만 보관되며, 분석 요청 시에만 서버에서 일시적으로
          처리됩니다 (PIPA §23).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-ink">국외이전 고지</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          분석 요청은 국외에 위치한 LLM 추론 인프라로 이전되어 처리될 수 있습니다.
          이전 항목·국가·시점·보유기간은 동의 시 별도로 고지합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-ink">이용약관</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          본 서비스는 참고용 건강정보 도구이며 의료 진단·처방을 대체하지 않습니다.
          응급 상황에서는 즉시 119 또는 응급실을 이용하세요.
        </p>
      </section>
    </div>
  );
}
