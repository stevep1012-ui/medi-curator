// MSW 핸들러 — /api/curate 서버 프록시 모킹
import { http, HttpResponse } from 'msw';
import type { CurationResult } from '../../src/types';

export const VALID_RESULT: CurationResult = {
  recommendedDepartment: '내과',
  aiAdvice: '충분한 수분 섭취와 휴식이 도움이 됩니다.',
  otcMedications: [
    {
      name: '타이레놀정500mg',
      purpose: '해열·진통',
      dosage: '성인 1정 1일 3~4회',
      warnings: ['간질환 환자 주의'],
      interactions: [],
      riskLevel: 'low',
    },
  ],
  folkRemedies: ['따뜻한 차 섭취'],
  lifestyleTips: ['7시간 이상 수면'],
  exercisePrescription: {
    recommended: ['가벼운 산책'],
    avoid: ['고강도 운동'],
    duration: '하루 20분',
  },
  recoveryTimeline: [
    { ageGroup: '성인', expectedDays: '3-5일', notes: '증상 지속 시 내원' },
  ],
  redFlags: ['지속되는 고열'],
  disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
};

export const handlers = [
  http.post('/api/curate', async ({ request }) => {
    const body = (await request.json()) as { symptoms?: string };
    if (!body?.symptoms || body.symptoms.length < 3) {
      return HttpResponse.json({ ok: false, code: 'BAD_INPUT', message: 'too short' }, { status: 400 });
    }
    if (body.symptoms.includes('FORCE_FORBIDDEN')) {
      return HttpResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '금지 표현 감지: 진단됩니다' },
        { status: 422 },
      );
    }
    if (body.symptoms.includes('FORCE_500')) {
      return HttpResponse.json({ ok: false, code: 'EXCEPTION', message: 'boom' }, { status: 500 });
    }
    return HttpResponse.json({ ok: true, data: VALID_RESULT, cached: false });
  }),
];
