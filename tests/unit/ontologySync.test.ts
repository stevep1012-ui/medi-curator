// ONTOLOGY.md ↔ 코드 동기화 가드.
//
// 온톨로지가 실효를 잃었던 이유는 검증이 "사람이 읽는 문서"로만 존재했기 때문이다.
// 문서가 코드보다 오래되면 잘못된 안심을 준다(실제로 진료과 화이트리스트·약국
// 제공자·응급번호·렌더 필드 수가 모두 어긋나 있었다). 기계적으로 확인 가능한
// 항목은 여기서 잠근다. /ontology-check 커맨드가 이 테스트를 먼저 실행한다.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const exists = (p: string) => existsSync(resolve(process.cwd(), p));

const ontology = read('docs/ontology/ONTOLOGY.md');
const emergencySource = read('src/lib/emergency.ts');
const curationSchema = read('src/schemas/curation.ts');
const serverIndex = read('functions/src/index.ts');

describe('ONTOLOGY §2.5 Surface — 적힌 컴포넌트가 실재하는가', () => {
  // 삭제·개명된 컴포넌트가 문서에 남으면 다음 사람이 없는 파일을 찾게 된다.
  const surfaces = ['Chrome', 'Legal', 'LegalModal', 'SymptomAnalysis', 'PharmacyFinder', 'SearchHistory', 'TabNav'];

  it.each(surfaces)('%s.tsx 가 src/app/components 에 존재', (name) => {
    expect(exists(`src/app/components/${name}.tsx`)).toBe(true);
  });

  it('삭제된 사본 컴포넌트를 Surface 로 되살리지 않는다', () => {
    expect(exists('src/components/SymptomInput.tsx')).toBe(false);
  });
});

describe('INV-4a — 응급 연락처', () => {
  it('코드는 109 + 1577-0199(정신) / 119(신체) 를 쓴다', () => {
    expect(emergencySource).toContain("tel: '109'");
    expect(emergencySource).toContain("tel: '1577-0199'");
    expect(emergencySource).toContain("tel: '119'");
  });

  it('1393 은 2024년 109 로 통합됐다 — 코드에 남아 있으면 안 된다', () => {
    expect(emergencySource).not.toContain('1393');
  });
});

describe('INV-1 — disclaimer 강제 지점', () => {
  it('클라이언트 스키마가 비어 있지 않은 disclaimer 를 요구한다', () => {
    expect(curationSchema).toMatch(/disclaimer:\s*z\.string\(\)\.min\(\d+\)/);
  });
});

describe('INV-6 — LLM 호출은 서버 경유', () => {
  it.each(['src/services/geminiService.ts', 'src/services/aiToolsService.ts'])(
    '%s 가 Gemini 엔드포인트를 직접 부르지 않는다',
    (path) => {
      expect(read(path)).not.toContain('generativelanguage.googleapis.com');
    },
  );
});

describe('CurationResult — 전달되는 필드와 비워지는 필드', () => {
  // ONTOLOGY 는 "9개 선언 / 4개 전달" 이라고 적고 있다. safeResult() 가 비우는
  // 목록이 바뀌면 문서도 함께 고쳐야 한다.
  const alwaysEmptied = [
    'otcMedications',
    'folkRemedies',
    'lifestyleTips',
    'exercisePrescription',
    'recoveryTimeline',
  ];

  it.each(alwaysEmptied)('safeResult() 가 %s 를 비운다', (field) => {
    const body = /function safeResult\([\s\S]*?\n}/.exec(serverIndex)?.[0] ?? '';
    expect(body).toContain(field);
  });

  it('프롬프트는 비워질 필드를 모델에게 요구하지 않는다 (토큰 낭비 방지)', () => {
    const prompt = /function buildSystemPrompt\([\s\S]*?\n}/.exec(serverIndex)?.[0] ?? '';
    // 정규식이 빗나가면 not.toContain 이 공허하게 통과한다. 먼저 실제로 잡았는지 확인.
    expect(prompt, 'buildSystemPrompt 본문을 찾지 못했다 — 이 테스트의 정규식을 고쳐라').toContain(
      '"recommendedDepartment"',
    );
    expect(prompt).not.toContain('"otcMedications"');
    expect(prompt).not.toContain('"recoveryTimeline"');
  });
});

describe('INV-4b — 위기 상태에서 약국 경로 안전장치', () => {
  const pharmacy = read('src/app/components/PharmacyFinder.tsx');
  const page = read('src/app/page.tsx');
  const symptom = read('src/app/components/SymptomAnalysis.tsx');

  it('증상 화면이 위기 신호를 상위로 올린다', () => {
    expect(symptom).toContain('onCrisisChange');
  });

  it('page 가 위기 상태를 보관해 탭을 옮겨도 유지된다', () => {
    // SymptomAnalysis 는 탭 전환 시 언마운트되므로 상태가 부모에 있어야 한다.
    expect(page).toContain('setCrisisKind');
    expect(page).toContain('crisisKind={crisisKind}');
  });

  it('약국 화면이 위기 시 응급 연락처를 노출한다', () => {
    expect(pharmacy).toContain('crisisKind');
    expect(pharmacy).toContain('HOTLINES');
    expect(pharmacy).toContain('role="alert"');
  });
});

describe('INV-7 — 복용약 입력 시 약사 확인 권고', () => {
  const symptom = read('src/app/components/SymptomAnalysis.tsx');

  it('currentMedication 이 있으면 상호작용 안내 블록을 렌더한다', () => {
    expect(symptom).toMatch(/currentMedication\.trim\(\)\s*!==\s*""[\s\S]{0,300}s\.interaction/);
  });
});

describe('정적 안전 문구가 실제로 렌더된다 (번역만 쓰이고 안 보이던 문제)', () => {
  const symptom = read('src/app/components/SymptomAnalysis.tsx');

  it.each(['s.otc', 's.herbal', 's.exercise', 's.redFlags'])('%s 를 렌더한다', (key) => {
    expect(symptom).toContain(key);
  });

  it('한국어 otcTitle 이 의약품 추천을 암시하지 않는다', () => {
    // 내용은 상담 준비 목록이고 영/일/중 제목도 그렇다. 옛 제목("일반의약품 선택지")을
    // 되살리면 하지도 않는 OTC 추천을 암시한다(약사법 §50).
    expect(read('src/app/components/i18n.tsx')).not.toContain('otcTitle: "일반의약품 선택지"');
  });
});

describe('미구현 불변식은 미구현이라고 적혀 있어야 한다', () => {
  // 구현이 생기면 이 테스트가 깨져 문서를 갱신하게 만든다 — 반대 방향 드리프트 방지.
  it('INV-3: 식약처 마스터가 없는 동안 문서는 미구현으로 표기한다', () => {
    expect(
      exists('assets/mfds-otc.json'),
      'assets/mfds-otc.json 이 생겼다. ONTOLOGY INV-3 상태를 갱신하라.',
    ).toBe(false);
    expect(ontology).toMatch(/\*\*INV-3\*\*[\s\S]{0,200}미구현/);
  });
});
