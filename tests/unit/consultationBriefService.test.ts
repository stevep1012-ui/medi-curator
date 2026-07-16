import { describe, expect, it } from 'vitest';
import { buildConsultationBrief } from '../../src/services/consultationBriefService';

const med = {
  id: 'm-1',
  addedAt: '2026-07-11T00:00:00.000Z',
  name: '비타민 D',
  category: 'vitamin' as const,
  ingredients: ['cholecalciferol'],
  efficacy: '영양 정보',
  cautions: ['고용량 주의'],
  disclaimer: '일반 정보입니다.',
  note: '',
};

const combo = {
  id: 'c-1',
  savedAt: '2026-07-11T00:00:00.000Z',
  title: '칼마디 · 칼슘+마그네슘+D',
  category: 'nutrition',
  summary: '뼈·근육 건강 기본 조합',
  items: [
    { name: '비타민 D', why: '칼슘 이용을 도움' },
    { name: '마그네슘', why: '근육 이완을 도움' },
  ],
  tip: '식후에 확인',
  disclaimer: '일반 정보입니다.',
};

describe('consultationBriefService', () => {
  it('builds a privacy-safe consultation brief with meds, combos, and routine status', () => {
    const text = buildConsultationBrief({
      date: '2026-07-11',
      meds: [med],
      combos: [combo],
      routine: [
        { label: '약 목록 정리', done: true },
        { label: '꿀조합 저장', done: false },
      ],
      disclaimer: '상담 준비용이며 진단이나 처방이 아닙니다.',
    });

    expect(text).toContain('Saved medicines on this device:');
    expect(text).toContain('- 비타민 D');
    expect(text).toContain('Saved supplement/taste combos:');
    expect(text).toContain('칼마디 · 칼슘+마그네슘+D');
    expect(text).toContain('약 목록 정리: done');
    expect(text).toContain('꿀조합 저장: pending');
    expect(text).toContain('진단이나 처방이 아닙니다');
    expect(text).not.toContain('base64');
    expect(text).not.toContain('raw symptoms');
  });

  it('keeps the brief useful when nothing is saved yet', () => {
    const text = buildConsultationBrief({
      date: '2026-07-11',
      meds: [],
      combos: [],
      routine: [],
      disclaimer: 'consultation prep only',
    });

    expect(text).toContain('Saved medicines on this device:\n- none saved');
    expect(text).toContain('Saved supplement/taste combos:\n- none saved');
  });
});
