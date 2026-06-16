// MSW 핸들러 — /api/curate 서버 프록시 모킹
import { http, HttpResponse } from 'msw';
import type { CurationResult } from '../../src/types';

export const VALID_RESULT: CurationResult = {
  recommendedDepartment: '내과',
  aiAdvice: '충분한 수분 섭취와 휴식이 도움이 됩니다.',
  otcMedications: [],
  folkRemedies: [],
  lifestyleTips: [],
  exercisePrescription: {
    recommended: [],
    avoid: [],
    duration: '',
  },
  recoveryTimeline: [],
  redFlags: ['지속되는 고열'],
  disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
};

export const handlers = [
  http.get('/__/firebase/init.json', () => {
    return HttpResponse.json({
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'demo-medi-curator',
      storageBucket: 'demo-medi-curator.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:test',
    });
  }),
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
    if (body.symptoms.includes('FORCE_401')) {
      return HttpResponse.json({ ok: false, code: 'NO_TOKEN', message: '인증이 필요합니다' }, { status: 401 });
    }
    if (body.symptoms.includes('FORCE_403')) {
      return HttpResponse.json({ ok: false, code: 'CONSENT_REQUIRED', message: '동의가 필요합니다' }, { status: 403 });
    }
    if (body.symptoms.includes('FORCE_APPCHECK')) {
      return HttpResponse.json({ ok: false, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인이 필요합니다' }, { status: 401 });
    }
    return HttpResponse.json({ ok: true, data: VALID_RESULT, cached: false });
  }),
  http.post('/api/interaction', async ({ request }) => {
    const body = (await request.json()) as { query?: string };
    const q = body?.query ?? '';
    if (!q) return HttpResponse.json({ ok: false, code: 'BAD_INPUT', message: 'empty' }, { status: 400 });
    if (q.includes('FORCE_FORBIDDEN')) {
      return HttpResponse.json({ ok: false, code: 'FORBIDDEN', message: '금지 표현 감지: 진단됩니다' }, { status: 422 });
    }
    if (q.includes('FORCE_401')) {
      return HttpResponse.json({ ok: false, code: 'NO_TOKEN', message: '인증이 필요합니다' }, { status: 401 });
    }
    if (q.includes('FORCE_403')) {
      return HttpResponse.json({ ok: false, code: 'CONSENT_REQUIRED', message: '동의가 필요합니다' }, { status: 403 });
    }
    return HttpResponse.json({
      ok: true,
      cached: false,
      data: {
        topics: [{ pair: '비타민 K + 와파린', topic: '함께 복용 시 약효 변화를 약사와 확인해 보세요.', severity: 'caution' }],
        generalNote: '새 제품을 시작하기 전 약사와 상의하세요.',
        disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
      },
    });
  }),
  http.post('/api/pairing', async ({ request }) => {
    const body = (await request.json()) as { goal?: string };
    const g = body?.goal ?? '';
    if (!g) return HttpResponse.json({ ok: false, code: 'BAD_INPUT', message: 'empty' }, { status: 400 });
    if (g.includes('FORCE_500')) {
      return HttpResponse.json({ ok: false, code: 'EXCEPTION', message: 'boom' }, { status: 500 });
    }
    return HttpResponse.json({
      ok: true,
      cached: false,
      data: {
        goalLabel: '눈 피로 완화',
        summary: '눈의 피로를 덜어주는 데 도움을 줄 수 있는 조합입니다.',
        items: [{ name: '루테인', why: '망막 황반 색소 밀도 유지에 도움을 줄 수 있어요.' }],
        tip: '식후에 지용성 성분과 함께 드세요.',
        disclaimer: '일반적인 영양 정보이며 의학적 조언이 아닙니다.',
      },
    });
  }),
];
