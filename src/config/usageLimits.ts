// Client-facing commercial usage copy.
// Keep these display values in sync with functions/src/usageLimits.ts when pricing changes.
export const FREE_USAGE_COPY = {
  monthlyAiRequests: 30,
  monthlyLabelKo: '월 30회',
  exceededKo: '무료 사용 한도를 초과했습니다. 다음 달에 다시 이용하거나 Plus를 확인해 주세요.',
} as const;

// Plus(유료) 티어가 열리기 전까지 모든 요청은 일반 모드로 나간다.
//
// 서버는 이미 프로 경로를 갖고 있고(functions/src/modelSelection.ts 가 isProMode 일 때
// PRO_MODEL 을 우선 후보로 둔다), ProductGrowthPanel 은 "Plus 관심 등록"으로 수요를
// 모으는 중이다. 즉 이 값은 미완성 배선이 아니라 **아직 켜지 않은 스위치**다.
//
// 호출부마다 false 리터럴을 박아 두면 버그처럼 읽히고 켤 때 빠뜨리기 쉽다.
// 뒤집을 지점을 여기 하나로 모은다 — 티어가 열리면 이 상수를 사용자 구독 상태를
// 읽는 함수로 바꾸면 된다.
export const PRO_MODE_ENABLED = false;
