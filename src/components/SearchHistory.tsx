import { useCallback, useEffect, useState } from 'react';
import { Apple, Trash2, ChevronDown, ChevronUp, Loader2, LogIn, AlertCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { getSearchHistory, deleteSearchRecord, deleteAllSearchRecords } from '../services/symptomService';
import type { SearchRecord } from '../types';
import CurationResultComponent from './CurationResult';

export default function SearchHistory() {
  const { user, loginWithProvider } = useAuth();
  const { t } = useLanguage();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async (append = false, cursor?: number | null) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { records: newRecords, lastVisible } = await getSearchHistory(
        user.uid,
        10,
        append ? (cursor ?? 0) : 0,
      );
      setRecords((prev) => (append ? [...prev, ...newRecords] : newRecords));
      setNextOffset(lastVisible);
      setHasMore(lastVisible !== null);
    } catch {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  }, [t.apiError, user]);

  useEffect(() => {
    if (user) loadRecords();
  }, [loadRecords, user]);

  const handleDelete = async (recordId: string) => {
    if (!user || !confirm(t.confirmDelete)) return;
    try {
      await deleteSearchRecord(user.uid, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch {
      setError(t.apiError);
    }
  };

  const handleDeleteAll = async () => {
    if (!user || !confirm(t.confirmDeleteAll)) return;
    try {
      await deleteAllSearchRecords(user.uid);
      setRecords([]);
      setNextOffset(null);
      setHasMore(false);
    } catch {
      setError(t.apiError);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 space-y-4">
        <LogIn className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.loginRequired}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => loginWithProvider('google')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Google
          </button>
          <button
            onClick={() => loginWithProvider('apple')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition-colors"
          >
            <Apple className="w-4 h-4" /> Apple
          </button>
          <button
            onClick={() => loginWithProvider('kakao')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-300 text-slate-900 text-sm font-medium hover:bg-yellow-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Kakao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {records.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {t.searchHistory}
          </h3>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.deleteAll}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Records */}
      {records.length === 0 && !loading && (
        <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">{t.noHistory}</p>
      )}

      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {record.symptoms}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {format(record.createdAt, 'yyyy-MM-dd HH:mm')} · {record.result.recommendedDepartment}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(record.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {expandedId === record.id ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {expandedId === record.id && (
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <CurationResultComponent result={record.result} isProMode={false} />
            </div>
          )}
        </div>
      ))}

      {/* Load More */}
      {hasMore && records.length > 0 && (
        <button
          onClick={() => loadRecords(true, nextOffset)}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '더 보기'}
        </button>
      )}

      {loading && records.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      )}
    </div>
  );
}
