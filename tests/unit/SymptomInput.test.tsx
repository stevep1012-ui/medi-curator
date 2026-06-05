// SymptomInput 응급 키워드 분기 — R-005 회귀 보장 (자살예방 1393/1577-0199)
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SymptomInput from '../../src/components/SymptomInput';
import { LanguageProvider } from '../../src/contexts/LanguageProvider';

function setup(isLoading = false) {
  const onAnalyze = vi.fn();
  render(
    <LanguageProvider>
      <SymptomInput onAnalyze={onAnalyze} isLoading={isLoading} />
    </LanguageProvider>,
  );
  const textarea = screen.getByPlaceholderText(/현재 증상을 자세히/) as HTMLTextAreaElement;
  return { onAnalyze, textarea, user: userEvent.setup() };
}

afterEach(() => {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe('SymptomInput 응급 분기', () => {
  it('정신 응급(자살) → 1393 + 1577-0199 노출', async () => {
    const { user, textarea } = setup();
    await user.type(textarea, '죽고 싶다는 생각이 들어요');
    expect(screen.getByLabelText('자살예방상담전화 1393')).toBeInTheDocument();
    expect(screen.getByLabelText('정신건강위기상담 1577-0199')).toBeInTheDocument();
    expect(screen.queryByLabelText('응급의료 119')).toBeNull();
  });

  it('신체 응급(흉통) → 119 노출, 1393 없음', async () => {
    const { user, textarea } = setup();
    await user.type(textarea, '갑자기 가슴통증이 심해요');
    expect(screen.getByLabelText('응급의료 119')).toBeInTheDocument();
    expect(screen.queryByLabelText('자살예방상담전화 1393')).toBeNull();
  });

  it('일반 증상 → 응급 배너 없음', async () => {
    const { user, textarea } = setup();
    await user.type(textarea, '콧물이 나요');
    expect(screen.queryByLabelText(/응급|상담|위기/)).toBeNull();
  });

  it('3자 미만 입력 → 제출 버튼 비활성', async () => {
    const { user, textarea, onAnalyze } = setup();
    await user.type(textarea, 'ab');
    const submit = screen.getByRole('button', { name: /분석|analyze/i });
    expect(submit).toBeDisabled();
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('정상 입력 제출 → 공백 제거 후 증상과 복용약 전달', async () => {
    const { user, textarea, onAnalyze } = setup();
    const medication = screen.getByPlaceholderText(/고혈압약|메트포르민/) as HTMLInputElement;

    await user.type(textarea, '  두통과 미열이 있어요  ');
    await user.type(medication, '  아세트아미노펜  ');
    await user.click(screen.getByRole('button', { name: /분석|analyze/i }));

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

    const { user } = setup();
    const voiceButton = screen.getByTitle('음성 입력 시작');

    await user.click(voiceButton);
    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('음성 입력 중지')).toBeInTheDocument();

    await user.click(screen.getByTitle('음성 입력 중지'));
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
