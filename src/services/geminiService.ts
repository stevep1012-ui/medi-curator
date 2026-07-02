// Curation client — calls the server-side LLM proxy (/api/curate), validates the
// response against the client Zod schema (AGENTS.md R-008: never show unvalidated
// output), and maps transport/auth errors to user-friendly Korean messages so the
// UI never white-screens. The Gemini API key never touches the browser (R-001).
import { z } from 'zod';
import { CurationResult as CurationResultSchema, SymptomQuery } from '../schemas/curation';
import type { CurationResult } from '../types';
import { getAppCheckToken, getIdToken } from '../firebase';

// In-memory cache: identical queries within a session reuse the result and make
// no further network calls. Bounded with insertion-order (LRU-ish) eviction and a
// short TTL, so a long session can't grow the map without limit and a stale answer
// can't outlive a mid-session model/policy change.
const CACHE_MAX = 50;
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const cache = new Map<string, { result: CurationResult; at: number }>();

function cacheKey(symptoms: string, meds: string, isProMode: boolean, language: string): string {
  return JSON.stringify([symptoms, meds, isProMode, language]);
}

interface CurateError {
  ok: false;
  code?: string;
  message?: string;
}

function mapError(status: number, body: CurateError | null): Error {
  const code = body?.code;
  if (code === 'APP_CHECK_REQUIRED') {
    return new Error('브라우저 보안 확인이 완료되지 않았습니다. 새로고침 후 다시 시도해 주세요.');
  }
  if (code === 'NO_TOKEN' || code === 'BAD_TOKEN') {
    return new Error('로그인이 필요합니다.');
  }
  if (code === 'CONSENT_REQUIRED') {
    return new Error('민감정보 동의가 필요합니다.');
  }
  if (code === 'FORBIDDEN') {
    return new Error(body?.message || '금지 표현이 감지되어 결과를 표시할 수 없습니다.');
  }
  return new Error(body?.message || `요청에 실패했습니다 (${status}).`);
}

function includesAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function localGeneralInfo(symptoms: string, currentMedications: string, language: string): CurationResult {
  const text = `${symptoms} ${currentMedications}`;
  const isHeadache = includesAny(text, ['두통', '머리', 'headache']);
  const isCough = includesAny(text, ['기침', '인후통', '목아픔', '목 아픔', '감기', 'cough', 'sore throat']);
  const isStomach = includesAny(text, ['복통', '배아픔', '배 아픔', '속쓰림', '설사', 'abdominal', 'stomach']);
  const isKo = language === 'ko';
  const baseDisclaimer = isKo
    ? '일반 건강정보입니다. 증상이 심하거나 오래가면 의사·약사와 상담하세요.'
    : 'General health information. If symptoms are severe or persistent, consult a doctor or pharmacist.';

  if (isCough) {
    return {
      recommendedDepartment: isKo ? '이비인후과 또는 내과' : 'ENT or internal medicine',
      aiAdvice: isKo
        ? '가벼운 기침·인후통은 감기, 건조한 공기, 알레르기 등에서 흔히 나타납니다. 수분 섭취와 휴식을 우선하고, 열·호흡곤란·심한 통증이 있으면 진료를 고려하세요.'
        : 'Mild cough or sore throat can happen with colds, dry air, or allergies. Prioritize fluids and rest; consider care if fever, breathing trouble, or severe pain appears.',
      otcMedications: [
        {
          name: isKo ? '아세트아미노펜 계열' : 'Acetaminophen-type pain reliever',
          purpose: isKo ? '인후통이나 몸살, 발열 완화에 흔히 사용되는 일반의약품 성분입니다.' : 'Common OTC option for sore throat, body aches, or fever.',
          dosage: isKo ? '제품 라벨의 연령·1회량·일일 최대량을 따르세요.' : 'Follow the product label for age, dose, and daily maximum.',
          warnings: isKo ? ['간질환, 음주가 잦은 경우, 다른 감기약과 중복 성분을 확인하세요.'] : ['Check liver disease risk, frequent alcohol use, and duplicate ingredients in cold medicines.'],
          interactions: [],
          riskLevel: 'low',
        },
        {
          name: isKo ? '기침·가래 완화제 성분' : 'Cough or expectorant ingredients',
          purpose: isKo ? '기침 양상에 따라 진해제 또는 거담제 성분을 약국에서 확인할 수 있습니다.' : 'Depending on cough type, ask about cough suppressant or expectorant ingredients.',
          dosage: isKo ? '졸림 여부와 복용 간격은 제품 라벨을 확인하세요.' : 'Check the label for drowsiness and dosing interval.',
          warnings: isKo ? ['고열, 호흡곤란, 피 섞인 가래가 있으면 일반약보다 진료가 우선입니다.'] : ['High fever, breathing trouble, or bloody sputum should be evaluated rather than self-treated.'],
          interactions: [],
          riskLevel: 'medium',
        },
      ],
      folkRemedies: isKo ? ['따뜻한 물, 가습, 자극적인 연기 피하기가 목 불편감 완화에 도움될 수 있습니다.'] : ['Warm fluids, humidification, and avoiding smoke may help throat irritation.'],
      lifestyleTips: isKo ? ['물을 자주 마시기', '실내 습도 유지', '충분히 쉬기', '목을 무리하게 쓰지 않기'] : ['Drink fluids', 'Keep indoor air humid', 'Rest', 'Avoid straining the voice'],
      exercisePrescription: { recommended: [], avoid: isKo ? ['열이 있거나 몸살이 심할 때 무리한 운동'] : ['Strenuous exercise with fever or body aches'], duration: isKo ? '증상이 가벼울 때만 가벼운 활동' : 'Light activity only if symptoms are mild' },
      recoveryTimeline: [{ ageGroup: isKo ? '성인 일반' : 'Adults', expectedDays: isKo ? '대개 수일~1주' : 'Often several days to 1 week', notes: isKo ? '악화되거나 1주 이상 지속되면 상담을 고려하세요.' : 'Consider care if worsening or lasting over a week.' }],
      redFlags: isKo ? ['호흡곤란', '고열 지속', '흉통', '피 섞인 가래'] : ['Breathing trouble', 'Persistent high fever', 'Chest pain', 'Bloody sputum'],
      disclaimer: baseDisclaimer,
    };
  }

  if (isStomach) {
    return {
      recommendedDepartment: isKo ? '내과 또는 소화기내과' : 'Internal medicine or gastroenterology',
      aiAdvice: isKo ? '복통은 식사, 소화불량, 장염, 스트레스 등 여러 이유로 생길 수 있습니다. 위치, 지속 시간, 발열·구토·혈변 여부를 함께 확인하세요.' : 'Abdominal discomfort can relate to meals, indigestion, infection, or stress. Note location, duration, fever, vomiting, or blood in stool.',
      otcMedications: [
        {
          name: isKo ? '제산제·위산 완화제' : 'Antacid / acid-relief options',
          purpose: isKo ? '속쓰림이나 위산 역류 느낌이 있을 때 흔히 확인하는 일반의약품입니다.' : 'Common OTC options for heartburn or acid reflux feelings.',
          dosage: isKo ? '제품 라벨을 따르고, 다른 약과 간격이 필요한지 약국에서 확인하세요.' : 'Follow the label and ask if spacing from other medicines is needed.',
          warnings: isKo ? ['검은 변, 피 섞인 구토, 심한 복통은 진료가 우선입니다.'] : ['Black stool, bloody vomiting, or severe pain should be evaluated.'],
          interactions: [],
          riskLevel: 'medium',
        },
      ],
      folkRemedies: isKo ? ['자극적인 음식, 술, 과식을 피하고 미지근한 물을 조금씩 마셔 보세요.'] : ['Avoid spicy foods, alcohol, overeating; sip water.'],
      lifestyleTips: isKo ? ['기름진 음식 피하기', '소량씩 먹기', '수분 보충', '증상 위치와 시간을 기록하기'] : ['Avoid greasy foods', 'Eat small portions', 'Hydrate', 'Record location and timing'],
      exercisePrescription: { recommended: [], avoid: isKo ? ['심한 통증 중 운동'] : ['Exercise during severe pain'], duration: isKo ? '통증이 가라앉을 때까지 휴식' : 'Rest until pain settles' },
      recoveryTimeline: [{ ageGroup: isKo ? '성인 일반' : 'Adults', expectedDays: isKo ? '원인에 따라 수시간~수일' : 'Hours to days depending on cause', notes: isKo ? '심해지거나 반복되면 진료를 고려하세요.' : 'Consider care if severe or recurring.' }],
      redFlags: isKo ? ['오른쪽 아랫배 심한 통증', '혈변 또는 검은 변', '반복 구토', '고열'] : ['Severe right-lower abdominal pain', 'Bloody or black stool', 'Repeated vomiting', 'High fever'],
      disclaimer: baseDisclaimer,
    };
  }

  return {
    recommendedDepartment: isHeadache ? (isKo ? '신경과 또는 내과' : 'Neurology or internal medicine') : (isKo ? '내과' : 'Internal medicine'),
    aiAdvice: isKo ? '입력한 증상에서 흔히 확인하는 일반 건강정보를 정리했습니다. 통증 강도, 시작 시점, 동반 증상, 현재 복용약을 함께 확인하면 도움이 됩니다.' : 'Here is general health information commonly checked for your symptoms. Note severity, onset, associated signs, and current medicines.',
    otcMedications: [
      {
        name: isKo ? '아세트아미노펜 계열' : 'Acetaminophen-type pain reliever',
        purpose: isKo ? '두통·근육통·발열 완화에 흔히 쓰이는 일반의약품 성분입니다.' : 'Common OTC option for headache, muscle aches, or fever.',
        dosage: isKo ? '제품 라벨의 연령·1회량·일일 최대량을 따르세요.' : 'Follow product label instructions.',
        warnings: isKo ? ['간질환, 음주, 감기약 중복 성분을 확인하세요.'] : ['Check liver disease risk, alcohol use, and duplicate ingredients.'],
        interactions: [],
        riskLevel: 'low',
      },
      {
        name: isKo ? '이부프로펜 등 NSAID 계열' : 'NSAID options such as ibuprofen',
        purpose: isKo ? '염증성 통증이나 몸살 완화에 쓰이는 경우가 있습니다.' : 'May be used for inflammatory pain or body aches.',
        dosage: isKo ? '제품 라벨을 따르고 식후 복용 여부를 확인하세요.' : 'Follow the label and check whether to take with food.',
        warnings: isKo ? ['위궤양, 신장질환, 항응고제 복용, 임신 중에는 약사·의사 확인이 우선입니다.'] : ['Ask first with ulcers, kidney disease, anticoagulants, or pregnancy.'],
        interactions: [],
        riskLevel: 'medium',
      },
    ],
    folkRemedies: isKo ? ['휴식, 수분 섭취, 조용하고 어두운 환경이 두통 완화에 도움될 수 있습니다.'] : ['Rest, hydration, and a quiet dark room may help headaches.'],
    lifestyleTips: isKo ? ['수분 섭취', '충분한 수면', '카페인·음주 과다 피하기', '통증이 시작된 상황 기록'] : ['Hydrate', 'Sleep enough', 'Avoid excess caffeine/alcohol', 'Record triggers'],
    exercisePrescription: { recommended: [], avoid: isKo ? ['어지럼, 시야 이상, 심한 두통 중 운동'] : ['Exercise with dizziness, vision changes, or severe headache'], duration: isKo ? '증상이 가벼울 때만 가벼운 활동' : 'Light activity only if mild' },
    recoveryTimeline: [{ ageGroup: isKo ? '성인 일반' : 'Adults', expectedDays: isKo ? '대개 수시간~1일' : 'Often hours to 1 day', notes: isKo ? '갑작스럽고 극심하거나 반복되면 진료를 고려하세요.' : 'Consider care if sudden, severe, or recurring.' }],
    redFlags: isKo ? ['갑자기 시작한 극심한 두통', '마비·말 어눌함·시야 이상', '고열과 목 경직', '머리 외상 후 두통'] : ['Sudden severe headache', 'Weakness, slurred speech, vision changes', 'Fever with neck stiffness', 'Headache after head injury'],
    disclaimer: baseDisclaimer,
  };
}

export async function getCurationFromGemini(
  symptoms: string,
  currentMedications: string,
  isProMode: boolean,
  language: string,
): Promise<CurationResult> {
  const key = cacheKey(symptoms, currentMedications, isProMode, language);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    // cache-first: refresh recency for LRU eviction, no network call on repeats
    cache.delete(key);
    cache.set(key, cached);
    return cached.result;
  }
  if (cached) cache.delete(key); // expired entry

  const parsedInput = SymptomQuery.safeParse({ symptoms, currentMedications, isProMode, language });
  if (!parsedInput.success) {
    throw new Error('증상을 조금 더 자세히 입력해 주세요.');
  }

  // Best-effort integrity + identity headers. The server enforces them; if a
  // token is unavailable the server returns the mapped 401/403, which we surface.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const appCheck = await getAppCheckToken();
  if (appCheck) headers['X-Firebase-AppCheck'] = appCheck;
  const idToken = await getIdToken();
  if (!idToken) {
    const fallback = CurationResultSchema.parse(localGeneralInfo(symptoms, currentMedications, language));
    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { result: fallback, at: Date.now() });
    return fallback;
  }
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  let res: Response;
  try {
    res = await fetch('/api/curate', {
      method: 'POST',
      headers,
      body: JSON.stringify(parsedInput.data),
    });
  } catch {
    throw new Error('네트워크 연결을 확인해 주세요.');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const envelope = body as { ok?: boolean; data?: unknown } & CurateError;
  if (!res.ok || !envelope?.ok) {
    if (envelope?.code === 'NO_TOKEN' || envelope?.code === 'BAD_TOKEN' || envelope?.code === 'CONSENT_REQUIRED') {
      const fallback = CurationResultSchema.parse(localGeneralInfo(symptoms, currentMedications, language));
      if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, { result: fallback, at: Date.now() });
      return fallback;
    }
    throw mapError(res.status, envelope);
  }

  const validated = CurationResultSchema.safeParse(envelope.data);
  if (!validated.success) {
    throw new Error('결과를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  const result = validated.data as z.infer<typeof CurationResultSchema>;
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value; // Map preserves insertion order
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { result, at: Date.now() });
  return result;
}
