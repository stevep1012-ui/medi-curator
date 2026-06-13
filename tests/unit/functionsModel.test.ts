import { describe, expect, it } from 'vitest';
import { modelCandidates } from '../../functions/src/modelSelection';

describe('Cloud Functions Gemini model selection', () => {
  it('uses Flash for standard mode', () => {
    expect(modelCandidates(false)).toEqual(['gemini-3-flash-preview']);
  });

  it('falls back to Flash when Pro mode has no API quota', () => {
    expect(modelCandidates(true)).toEqual([
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
    ]);
  });
});
