// Admin console configuration.
// Keep operational numbers and access policy here while the backend admin API is being built.
// Later, replace static snapshot values with Firestore/Analytics/Payments reads.
export const ADMIN_ACCESS = {
  entryPath: '/admin',
  superuserEmails: [] as string[],
  setupHintKo: 'src/config/admin.ts의 ADMIN_ACCESS.superuserEmails에 운영자 이메일을 추가하세요.',
} as const;

export const ADMIN_SNAPSHOT = {
  generatedAtKo: '실시간 연동 전 운영 샘플',
  activeUsersToday: 0,
  monthlyAiUsed: 0,
  monthlyAiLimitPerFreeUser: 30,
  paidUsers: 0,
  monthlyRevenueKrw: 0,
  conversionRate: '0.0%',
} as const;

export const ADMIN_REVENUE_PLANS = [
  { name: 'Free', users: 0, priceKrw: 0, revenueKrw: 0 },
  { name: 'Plus', users: 0, priceKrw: 9900, revenueKrw: 0 },
  { name: 'Family', users: 0, priceKrw: 14900, revenueKrw: 0 },
] as const;
