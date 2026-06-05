// E2E: 핵심 사용자 흐름 — 정상 큐레이션 (Functions 에뮬레이터 또는 모킹된 /api/curate 필요)
// 이 테스트는 GEMINI_API_KEY 없이도 통과하도록 page.route() 로 응답을 가짜로 만든다.
import { test, expect } from '@playwright/test';

test('정상 증상 분석 → 결과 + disclaimer 렌더', async ({ page }) => {
  await page.route('**/api/curate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        cached: false,
        data: {
          recommendedDepartment: '내과',
          aiAdvice: '충분한 휴식과 수분 섭취를 권장합니다.',
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
          folkRemedies: [],
          lifestyleTips: ['7시간 수면'],
          exercisePrescription: { recommended: ['가벼운 산책'], avoid: [], duration: '20분' },
          recoveryTimeline: [{ ageGroup: '성인', expectedDays: '3-5일', notes: '' }],
          redFlags: [],
          disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
        },
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('textbox').first().fill('두통과 가벼운 미열이 있어요');
  await page.getByRole('button', { name: 'AI 건강 정보 분석' }).click();

  await expect(page.getByText('타이레놀정500mg')).toBeVisible();
  await expect(page.getByText(/의료 진단 또는 처방을 대체/)).toBeVisible();
});
