// E2E: 로그인/동의 없이는 분석이 차단되는지 확인한다.
import { test, expect } from '@playwright/test';

test('로그인하지 않으면 분석 버튼이 비활성화된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'AI 건강 정보 분석' })).toBeDisabled();
  await expect(page.getByText(/로그인과 민감정보 동의가 필요합니다/)).toBeVisible();
});

test('푸터에서 개인정보처리방침과 이용약관을 열 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '개인정보처리방침' }).click();

  await expect(page.getByRole('heading', { name: '개인정보처리방침' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '이용약관' })).toBeVisible();
  await expect(page.getByText('[출시 전 확정 필요]').first()).toBeVisible();
});
