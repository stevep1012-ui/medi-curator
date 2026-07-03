// Commercial usage policy for free members.
// Change the numbers/messages here when the business plan changes.
// This file is the server-side source of truth enforced by Cloud Functions.
export const FREE_USAGE_LIMITS = {
  hourlyAiRequests: 30,
  monthlyAiRequests: 30,
} as const;

export const USAGE_LIMIT_MESSAGES = {
  exceeded: '무료 사용 한도를 초과했습니다. 다음 달에 다시 이용하거나 Plus를 확인해 주세요.',
  unavailable: '요청 한도를 확인할 수 없습니다',
} as const;
