// SymptomInput 응급 키워드 분기 — R-005 회귀 보장 (자살예방 109/1577-0199)
import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SymptomInput from '../../src/components/SymptomInput';

vi.mock('../../src/contexts/useLanguage', () => ({
  useLanguage: () => ({
    t: {
      symptomPlaceholder: '현재 증상을 자세히 설명해주세요.',
      medicationPlaceholder: '예: 고혈압약 암로디핀, 당뇨약 메트포르민',
      analyzeButton: 'AI 건강 정보 분석',
      analyzing: '분석 중...',
      minChars: '3자 이상 입력해주세요.',
      voiceInputStart: '음성 입력 시작',
      voiceInputStop: '음성 입력 중지',
      voiceNotSupported: '이 브라우저는 음성 인식을 지원하지 않습니다.',
      emergencyWarning: '응급 상황입니다.',
    },
  }),
}));

function setup(isLoading = false) {
  const onAnalyze = vi.fn();
  render(<SymptomInput onAnalyze={onAnalyze} isLoading={isLoading} />);
  const textarea = screen.getByPlaceholderText(/현재 증상을 자세히/) as HTMLTextAreaElement;
  return { onAnalyze, textarea };
}

afterEach(() => {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe('SymptomInput 응급 분기', () => {
  it('정신 응급(자살) → 109 + 1577-0199 노출', async () => {
    const { textarea } = setup();
    fireEvent.change(textarea, { target: { value: '죽고 싶다는 생각이 들어요' } });
    expect(screen.getByLabelText('자살예방상담전화 109')).toBeInTheDocument();
    expect(screen.getByLabelText('정신건강위기상담 1577-0199')).toBeInTheDocument();
    expect(screen.queryByLabelText('응급의료 119')).toBeNull();
  });

  it('신체 응급(흉통) → 119 노출, 109 없음', async () => {
    const { textarea } = setup();
    fireEvent.change(textarea, { target: { value: '갑자기 가슴통증이 심해요' } });
    expect(screen.getByLabelText('응급의료 119')).toBeInTheDocument();
    expect(screen.queryByLabelText('자살예방상담전화 109')).toBeNull();
  });

  it('일반 증상 → 응급 배너 없음', async () => {
    const { textarea } = setup();
    fireEvent.change(textarea, { target: { value: '콧물이 나요' } });
    expect(screen.queryByLabelText(/응급|상담|위기/)).toBeNull();
  });

  it('3자 미만 입력 → 제출 버튼 비활성', async () => {
    const { textarea, onAnalyze } = setup();
    fireEvent.change(textarea, { target: { value: 'ab' } });
    const submit = screen.getByRole('button', { name: /분석|analyze/i });
    expect(submit).toBeDisabled();
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('정상 입력 제출 → 공백 제거 후 증상과 복용약 전달', async () => {
    const { textarea, onAnalyze } = setup();
    const medication = screen.getByPlaceholderText(/고혈압약|메트포르민/) as HTMLInputElement;

    fireEvent.change(textarea, { target: { value: '  두통과 미열이 있어요  ' } });
    fireEvent.change(medication, { target: { value: '  아세트아미노펜  ' } });
    fireEvent.click(screen.getByRole('button', { name: /분석|analyze/i }));

    expect(onAnalyze).toHaveBeenCalledWith('두통과 미열이 있어요', '아세트아미노펜');
  });

  it('로딩 중에는 입력과 제출을 비활성화하고 분석 중 문구 노출', () => {
    const { textarea } = setup(true);
    const medication = screen.getByPlaceholderText(/고혈압약|메트포르민/) as HTMLInputElement;

    expect(textarea).toBeDisabled();
    expect(medication).toBeDisabled();
    expect(screen.getByRole('button', { name: /분석 중|analyzing/i })).toBeDisabled();
  });

  it('음성 입력 지원 시 시작과 중지를 토글', async () => {
    const start = vi.fn();
    const stop = vi.fn();
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      onresult: SpeechRecognition['onresult'] = null;
      onerror: SpeechRecognition['onerror'] = null;
      onend: SpeechRecognition['onend'] = null;
      start = start;
      stop = stop;
    }
    window.SpeechRecognition = MockSpeechRecognition as unknown as typeof SpeechRecognition;

    setup();
    const voiceButton = screen.getByTitle('음성 입력 시작');

    fireEvent.click(voiceButton);
    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('음성 입력 중지')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('음성 입력 중지'));
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
