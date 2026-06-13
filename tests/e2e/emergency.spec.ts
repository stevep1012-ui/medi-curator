// E2E: 응급 키워드 분기. R-005 회귀 보장.
// Functions 에뮬레이터 없이도 동작 — 입력 단계에서만 검증 (LLM 호출 전).
import { test, expect } from '@playwright/test';

test.describe('emergency triage UI', () => {
  test('정신 응급: "죽고 싶" → 109 + 1577-0199 두 버튼', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox').first().fill('요즘 죽고 싶다는 생각이 자주 들어요');
    await expect(page.getByLabel('자살예방상담전화 109')).toBeVisible();
    await expect(page.getByLabel('정신건강위기상담 1577-0199')).toBeVisible();
    await expect(page.getByLabel('응급의료 119')).toHaveCount(0);
  });

  test('신체 응급: "가슴통증" → 119만 노출', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox').first().fill('갑자기 가슴통증이 심하고 식은땀이 나요');
    await expect(page.getByLabel('응급의료 119')).toBeVisible();
    await expect(page.getByLabel('자살예방상담전화 109')).toHaveCount(0);
  });

  test('일반 증상: 응급 배너 없음', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox').first().fill('콧물이 나오고 가벼운 기침이 있어요');
    await expect(page.getByLabel('자살예방상담전화 109')).toHaveCount(0);
    await expect(page.getByLabel('응급의료 119')).toHaveCount(0);
  });
});
