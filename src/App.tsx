import { useState } from 'react';
import { Activity, MapPin, History, ShieldCheck } from 'lucide-react';
import Header from './components/Header';
import SymptomInput from './components/SymptomInput';
import CurationResult from './components/CurationResult';
import PharmacyFinder from './components/PharmacyFinder';
import SearchHistory from './components/SearchHistory';
import DisclaimerBanner from './components/DisclaimerBanner';
import ConsentGate from './components/ConsentGate';
import PrivacySettings from './components/PrivacySettings';
import { useAuth } from './contexts/useAuth';
import { useLanguage } from './contexts/useLanguage';
import { getCurationFromGemini } from './services/geminiService';
import { saveSearchRecord } from './services/symptomService';
import { saveConsent } from './services/consentService';
import { CONSENT_VERSION, type ConsentItems } from './schemas/consent';
import type { CurationResult as CurationResultType } from './types';

type Tab = 'symptom' | 'pharmacy' | 'history' | 'privacy';

export default function App() {
  const { user, consent, refreshConsent, logout } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('symptom');
  const [isProMode, setIsProMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CurationResultType | null>(null);
  const [error, setError] = useState('');

  // 로그인했지만 최신 버전 동의가 없으면 ConsentGate 노출 (INV-2 강제)
  const needsConsent = !!user && (!consent || consent.version !== CONSENT_VERSION);

  const handleAccept = async (items: ConsentItems, isAdult: boolean) => {
    if (!user) return;
    await saveConsent(user.uid, items, isAdult);
    await refreshConsent();
  };

  const handleAnalyze = async (symptoms: string, medications: string) => {
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getCurationFromGemini(symptoms, medications, isProMode, language);
      setResult(data);

      // PIPA §23: 민감정보 저장은 해당 동의 (sensitiveHealth) 가 활성일 때만.
      if (user && consent?.items.sensitiveHealth && consent.version === CONSENT_VERSION) {
        try {
          await saveSearchRecord(user.uid, symptoms, medications, data, language);
        } catch {
          // 로컬 저장소가 차단될 수도 있음 — 사용자 흐름은 방해하지 않음
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: 'symptom', label: t.symptomTab, icon: Activity },
    { id: 'pharmacy', label: t.pharmacyTab, icon: MapPin },
    { id: 'history', label: t.historyTab, icon: History },
    { id: 'privacy', label: '개인정보', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header isProMode={isProMode} onToggleProMode={() => setIsProMode(!isProMode)} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Tabs */}
        <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'symptom' && (
          <div className="space-y-6">
            <SymptomInput onAnalyze={handleAnalyze} isLoading={isLoading} />

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            {result && <CurationResult result={result} isProMode={isProMode} />}
          </div>
        )}

        {activeTab === 'pharmacy' && <PharmacyFinder />}
        {activeTab === 'history' && <SearchHistory />}
        {activeTab === 'privacy' && <PrivacySettings />}
      </main>

      {needsConsent && user && (
        <ConsentGate
          email={user.email ?? user.uid}
          onAccept={handleAccept}
          onDecline={() => { void logout(); }}
        />
      )}

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-slate-200 dark:border-slate-700 mt-8">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t.disclaimer}
        </p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2">
          &copy; 2025 Medi-Curator. 개인정보 처리방침 | 이용약관
        </p>
      </footer>
    </div>
  );
}
