// 출하 화면(약관·개인정보처리방침·푸터)이 쓰는 사업자 정보의 단일 출처.
//
// 값은 config/release-profile.json 에 있고 gate:release-readiness 가 바로 그 파일을
// 검사한다. 화면과 게이트가 같은 파일을 보게 해서 "게이트는 PASS 인데 화면에는 위약
// 연락처" 같은 상태가 생기지 않게 한다(P0-007).
import profile from '../../config/release-profile.json';

export const RELEASE_PROFILE = profile;

const PENDING_TOKEN = '[출시 전 확정 필요]';

// 미설정 값을 가짜 연락처로 채우지 않는다. 다만 내부 토큰을 그대로 노출하면 사용자에게
// 고장으로 읽히므로, 언어별 "준비 중" 표기로만 바꿔 보여준다. 게이트는 JSON 원본을
// 읽으므로 이 표시는 판정에 영향이 없다 — 실제 정보가 채워질 때까지 출시는 BLOCK 된다.
const PENDING_LABEL: Record<string, string> = {
  ko: '준비 중',
  en: 'To be announced',
  ja: '準備中',
  zh: '准备中',
};

export function biz(value: string, lang: string): string {
  return value.includes(PENDING_TOKEN) ? (PENDING_LABEL[lang] ?? PENDING_LABEL.en) : value;
}
