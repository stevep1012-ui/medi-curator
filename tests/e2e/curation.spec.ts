// E2E: 설계 의도(react-handoff, 카드-우선 홈) 기준 인증/정책 접근성 검증.
import { test, expect } from '@playwright/test';

test('비로그인 시 로그인 게이트가 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '로그인', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '로그인 없이 둘러보기' })).toBeVisible();
});

test('푸터에서 개인정보처리방침을 열 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '로그인 없이 둘러보기' }).click();
  await page.getByText('개인정보처리방침', { exact: true }).click();
  await expect(page.getByRole('heading', { name: '개인정보처리방침' })).toBeVisible();
});
