// PIPA 별도 동의 화면 — 로그인 직후 1회 노출.
// 동의 없이는 로컬 검색 이력 저장 불가 (INV-2). 필수 4개 + 선택 2개.
// 14세 미만 차단 (PIPA §22-2).
import { useState, useId } from 'react';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { CONSENT_VERSION, isAdult, type ConsentItems } from '../schemas/consent';

interface Props {
  email: string;
  onAccept: (items: ConsentItems, adult: boolean) => Promise<void> | void;
  onDecline: () => void;
}

interface DetailRow { key: keyof ConsentItems; label: string; required: boolean; basis: string; detail: string; }

const ROWS: DetailRow[] = [
  {
    key: 'pii',
    label: '일반 개인정보 (이메일, 표시 이름)',
    required: true,
    basis: 'PIPA §15 ① 동의',
    detail: '계정 식별·로그인·서비스 제공 목적. 탈퇴 시 즉시 파기.',
  },
  {
    key: 'sensitiveHealth',
    label: '민감정보 (증상, 복용 약물, 검색 이력)',
    required: true,
    basis: 'PIPA §23 ① 별도 동의',
    detail: 'AI 큐레이션 생성 및 사용자 본인의 로컬 검색 이력 제공 목적. 검색 이력은 이 브라우저의 로컬 저장소에만 보관됩니다.',
  },
  {
    key: 'overseasTransfer',
    label: '개인정보 국외 이전 (Google Gemini · Firebase, 미국)',
    required: true,
    basis: 'PIPA §28-8 국외이전 동의',
    detail: '이전 항목: 증상·약물 텍스트, 이메일. 이전국: 미국. 이전받는자: Google LLC. 이용목적: AI 추론·데이터 저장. 보관기간: 본 서비스와 동일.',
  },
  {
    key: 'location',
    label: '위치정보 (현재 위치)',
    required: true,
    basis: '위치정보법 §15 별도 동의',
    detail: '인근 약국 검색 시에만 사용. 메모리 상에서 처리하며 저장하지 않음.',
  },
  {
    key: 'marketing',
    label: '마케팅 정보 수신 (선택)',
    required: false,
    basis: 'PIPA §22 선택 동의',
    detail: '신규 기능·서비스 안내. 거부해도 서비스 이용 가능.',
  },
  {
    key: 'analytics',
    label: '익명 통계 수집 (선택)',
    required: false,
    basis: 'PIPA §22 선택 동의',
    detail: '집계 통계용 비식별 행동 데이터. 거부해도 서비스 이용 가능.',
  },
];

export default function ConsentGate({ email, onAccept, onDecline }: Props) {
  const formId = useId();
  const [items, setItems] = useState<Record<keyof ConsentItems, boolean>>({
    pii: false, sensitiveHealth: false, overseasTransfer: false, location: false,
    marketing: false, analytics: false,
  });
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const requiredOk = ROWS.filter(r => r.required).every(r => items[r.key]);
  const dobOk = year.length === 4 && month && day && isAdult(+year, +month, +day);
  const canSubmit = requiredOk && dobOk && !submitting;

  const toggleAll = (checked: boolean) => {
    setItems({ pii: checked, sensitiveHealth: checked, overseasTransfer: checked, location: checked, marketing: checked, analytics: checked });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!dobOk) { setError('만 14세 미만은 가입할 수 없습니다 (PIPA §22-2).'); return; }
    if (!requiredOk) { setError('필수 동의 항목을 모두 체크해 주세요.'); return; }
    setSubmitting(true);
    try {
      await onAccept(items as ConsentItems, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '동의 저장 실패');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        id={formId}
        onSubmit={submit}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
        aria-labelledby={`${formId}-title`}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h2 id={`${formId}-title`} className="text-lg font-bold text-slate-800 dark:text-slate-100">
            개인정보 수집·이용 동의
          </h2>
          <span className="ml-auto text-[10px] text-slate-400">v{CONSENT_VERSION}</span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {email} 계정으로 서비스를 이용하기 전, 아래 항목에 동의가 필요합니다. 본 서비스는 의료 진단을 대체하지 않습니다.
        </p>

        {/* 생년월일 */}
        <fieldset className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
          <legend className="px-2 text-xs font-semibold text-slate-500">생년월일 (PIPA §22-2 만 14세 확인)</legend>
          <div className="flex gap-2">
            <input
              type="number" inputMode="numeric" min={1900} max={new Date().getFullYear()} placeholder="YYYY"
              value={year} onChange={(e) => setYear(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              aria-label="출생 연도"
            />
            <input
              type="number" inputMode="numeric" min={1} max={12} placeholder="MM"
              value={month} onChange={(e) => setMonth(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              aria-label="출생 월"
            />
            <input
              type="number" inputMode="numeric" min={1} max={31} placeholder="DD"
              value={day} onChange={(e) => setDay(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              aria-label="출생 일"
            />
          </div>
          {(year && month && day && !dobOk) && (
            <p className="text-xs text-red-600 dark:text-red-400">만 14세 미만은 본 서비스를 이용할 수 없습니다.</p>
          )}
        </fieldset>

        {/* 전체 선택 */}
        <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            onChange={(e) => toggleAll(e.target.checked)}
            checked={Object.values(items).every(Boolean)}
            className="w-4 h-4 accent-teal-600"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">전체 동의 (선택 항목 포함)</span>
        </label>

        {/* 항목별 */}
        <ul className="space-y-2">
          {ROWS.map((row) => (
            <li key={row.key} className="border border-slate-200 dark:border-slate-700 rounded-xl">
              <label className="flex items-start gap-3 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={items[row.key]}
                  onChange={(e) => setItems((s) => ({ ...s, [row.key]: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-teal-600"
                  aria-describedby={`${formId}-${row.key}-detail`}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{row.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.required ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {row.required ? '필수' : '선택'}
                    </span>
                    <span className="text-[10px] text-slate-400">{row.basis}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setOpen((s) => ({ ...s, [row.key]: !s[row.key] })); }}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={`${row.label} 상세보기`}
                  aria-expanded={!!open[row.key]}
                >
                  {open[row.key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </label>
              {open[row.key] && (
                <p id={`${formId}-${row.key}-detail`} className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {row.detail}
                </p>
              )}
            </li>
          ))}
        </ul>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            거부하고 로그아웃
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중…' : '동의하고 계속'}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          철회: 언제든 설정 → 개인정보 → 동의 철회. 정보주체의 권리(열람·정정·삭제·이동)는 설정 메뉴에서 직접 행사하실 수 있습니다. 문의: privacy@medi-curator.example
        </p>
      </form>
    </div>
  );
}
