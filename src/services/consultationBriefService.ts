import type { ComboVaultItem } from './comboVaultService';
import type { StoredMedT } from '../schemas/aiTools';

export type ConsultationRoutineStatus = {
  label: string;
  done: boolean;
};

export type ConsultationBriefInput = {
  date: string;
  meds: Pick<StoredMedT, 'name'>[];
  combos: Pick<ComboVaultItem, 'title' | 'items' | 'tip'>[];
  routine: ConsultationRoutineStatus[];
  disclaimer: string;
};

export function buildConsultationBrief({ date, meds, combos, routine, disclaimer }: ConsultationBriefInput): string {
  const medNames = meds.map((m) => m.name.trim()).filter(Boolean);
  const comboLines = combos.length
    ? combos.flatMap((combo) => [
        `- ${combo.title}`,
        ...combo.items.slice(0, 4).map((item) => `  • ${item.name}: ${item.why}`),
        combo.tip ? `  Tip: ${combo.tip}` : '',
      ]).filter(Boolean)
    : ['- none saved'];

  return [
    'MediQ consultation brief',
    `Date: ${date}`,
    '',
    'Saved medicines on this device:',
    medNames.length ? medNames.map((name) => `- ${name}`).join('\n') : '- none saved',
    '',
    'Saved supplement/taste combos:',
    comboLines.join('\n'),
    '',
    "Today's routine:",
    routine.map((item) => `- ${item.label}: ${item.done ? 'done' : 'pending'}`).join('\n'),
    '',
    disclaimer,
  ].join('\n');
}
