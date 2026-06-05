// PrivacySettings — 설정 패널.
// 동의 항목 표시 / 철회 / DSR 4종 호출 (열람·정정·삭제·이동).
import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { revokeConsent, dsrAccess, dsrErase, dsrExport, clientSideEraseFallback } from '../services/consentService';
import { deleteAllSearchRecords, exportLocalSearchHistory } from '../services/symptomService';
import { CONSENT_VERSION } from '../schemas/consent';
import { Download, Trash2, FileSearch, ShieldOff } from 'lucide-react';

export default function PrivacySettings() {
  const { user, logout, consent } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!user) return null;

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label); setError(''); setMsg('');
    try {
      const r = await fn();
      setMsg(`${label} 완료${r && typeof r === 'object' ? '' : ''}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} 실패`);
    } finally {
      setBusy(null);
    }
  };

  const doAccess = () => run('열람권', async () => {
    let server: unknown = null;
    try {
      const r = (await dsrAccess()) as { data?: unknown };
      server = r?.data ?? null;
    } catch (e) {
      server = { unavailable: true, message: e instanceof Error ? e.message : 'server DSR unavailable' };
    }
    const localSearchHistory = await exportLocalSearchHistory(user.uid);
    const data = { server, localSearchHistory };
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `medi-curator-access-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    }
  });

  const doExport = () => run('이동권 (다운로드)', async () => {
    let server: unknown = null;
    try {
      const r = (await dsrExport()) as { data?: unknown };
      server = r?.data ?? null;
    } catch (e) {
      server = { unavailable: true, message: e instanceof Error ? e.message : 'server DSR unavailable' };
    }
    const localSearchHistory = await exportLocalSearchHistory(user.uid);
    const data = { server, localSearchHistory };
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `medi-curator-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    }
  });

  const doErase = () => {
    if (!confirm('모든 데이터가 영구 삭제되고 계정에서 로그아웃됩니다. 진행하시겠습니까?')) return;
    return run('삭제권 (탈퇴)', async () => {
      try {
        await dsrErase();
      } catch {
        // 서버 미배포 시 클라 폴백
        await clientSideEraseFallback(user.uid);
      }
      await deleteAllSearchRecords(user.uid);
      await logout();
    });
  };

  const doRevoke = () => {
    if (!confirm('동의를 철회하면 검색 이력 저장과 AI 큐레이션 이용이 중단됩니다.')) return;
    return run('동의 철회', async () => {
      await revokeConsent(user.uid);
      await deleteAllSearchRecords(user.uid);
    });
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-100 dark:border-slate-700 space-y-4">
      <header>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">개인정보 관리</h3>
        <p className="text-xs text-slate-500 mt-1">
          동의 버전: <span className="font-mono">{consent?.version ?? '미동의'}</span>
          {consent && consent.version !== CONSENT_VERSION && <span className="ml-2 text-amber-600">최신 버전 재동의 필요</span>}
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-2">
        <button onClick={doAccess} disabled={!!busy} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50">
          <FileSearch className="w-4 h-4 text-teal-600" /> 열람권 (PIPA §35)
        </button>
        <button onClick={doExport} disabled={!!busy} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50">
          <Download className="w-4 h-4 text-blue-600" /> 이동권 다운로드 (PIPA §35-2)
        </button>
        <button onClick={doRevoke} disabled={!!busy} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-50">
          <ShieldOff className="w-4 h-4" /> 동의 철회
        </button>
        <button onClick={doErase} disabled={!!busy} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50">
          <Trash2 className="w-4 h-4" /> 삭제권 / 탈퇴 (PIPA §36)
        </button>
      </div>

      {busy && <p className="text-xs text-slate-500">{busy} 처리 중…</p>}
      {msg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <p className="text-[10px] text-slate-400 leading-relaxed">
        검색 이력은 이 브라우저의 로컬 저장소에만 저장됩니다. 정정권(PIPA §36)은 화면에서 직접 항목을 삭제 후 재생성하시면 반영됩니다. 추가 문의: privacy@medi-curator.example · 분쟁조정: 개인정보분쟁조정위원회(1833-6972).
      </p>
    </section>
  );
}
