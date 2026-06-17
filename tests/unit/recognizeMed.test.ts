import { describe, it, expect, beforeEach } from 'vitest';
import { getMedFromImageAI } from '../../src/services/aiToolsService';
import { addMed, deleteAllMeds, deleteMed, loadMeds } from '../../src/services/medStore';
import { RecognizedMed } from '../../src/schemas/aiTools';

const IMG = 'aGVsbG8taW1hZ2UtYmFzZTY0LWRhdGE='; // dummy base64 ≥16 chars

describe('recognizeMed service (사진 인식)', () => {
  it('정상 인식 응답을 Zod 검증 후 반환한다', async () => {
    const r = await getMedFromImageAI(IMG, 'image/jpeg', 'ko');
    expect(r.recognized).toBe(true);
    expect(r.name).toBeTruthy();
    expect(r.ingredients.length).toBeGreaterThan(0);
    expect(r.disclaimer).toBeTruthy();
  });

  it('식별 실패 시 recognized=false 를 그대로 반환한다', async () => {
    const r = await getMedFromImageAI(`${IMG}FORCE_UNREC`, 'image/png', 'ko');
    expect(r.recognized).toBe(false);
    expect(r.name).toBe('');
  });

  it('서버 403 을 동의 안내로 변환한다', async () => {
    await expect(getMedFromImageAI(`${IMG}FORCE_403`, 'image/jpeg', 'ko')).rejects.toThrow('민감정보 동의가 필요합니다.');
  });

  it('category 는 정해진 enum 만 허용한다', () => {
    const bad = RecognizedMed.safeParse({
      recognized: true, name: 'x', category: 'drug', ingredients: [], efficacy: '', cautions: [],
      disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
    });
    expect(bad.success).toBe(false);
  });
});

describe('medStore (기기 로컬 저장)', () => {
  const uid = 'test-uid';
  beforeEach(() => deleteAllMeds(uid));

  const rec = {
    recognized: true as const,
    name: '타이레놀정 500mg',
    category: 'medicine' as const,
    ingredients: ['아세트아미노펜 500mg'],
    efficacy: '해열·진통',
    cautions: ['약사 상담'],
    disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
  };

  it('추가하면 목록에 저장되고 다시 읽힌다', () => {
    addMed(uid, rec);
    const meds = loadMeds(uid);
    expect(meds).toHaveLength(1);
    expect(meds[0].name).toBe('타이레놀정 500mg');
    expect(meds[0].id).toBeTruthy();
    expect(meds[0].addedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('개별 삭제와 전체 삭제가 동작한다', () => {
    const a = addMed(uid, rec);
    addMed(uid, { ...rec, name: '비타민 C' });
    deleteMed(uid, a.id);
    expect(loadMeds(uid).map((m) => m.name)).toEqual(['비타민 C']);
    deleteAllMeds(uid);
    expect(loadMeds(uid)).toHaveLength(0);
  });

  it('recognized 플래그는 저장 레코드에 포함되지 않는다(텍스트 정보만)', () => {
    addMed(uid, rec);
    const stored = loadMeds(uid)[0] as Record<string, unknown>;
    expect(stored.recognized).toBeUndefined();
  });
});
