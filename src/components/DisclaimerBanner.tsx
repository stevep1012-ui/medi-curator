import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

export default function DisclaimerBanner() {
  const { t } = useLanguage();

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
        {t.disclaimer}
      </p>
    </div>
  );
}
