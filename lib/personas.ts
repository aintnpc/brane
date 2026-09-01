// Synthetic users for the simulation harness.
//
// The write path has never had an evaluation. Its quality claims — "chatter
// gets filtered", "a state change REFINEs instead of duplicating", "a real
// reversal becomes a QUESTION instead of a silent overwrite" — were verified
// once by hand against three made-up conversations and then trusted. That is
// not enough to tune prompts against, and it is nowhere near enough to hand
// the engine to a stranger with a free-tier model behind it.
//
// Each persona is an ordered stream of conversations, written so that the
// correct behaviour is unambiguous and mechanically checkable. Order matters:
// a later source is meant to land on what an earlier one wrote.

import { SourceDoc } from "./ingest-core";

export interface PersonaExpectation {
  /** Total distinct concept files this persona's whole stream should produce. */
  minConcepts?: number;
  maxConcepts?: number;
  /** The stream contains a genuine values/strategy reversal. */
  expectsQuestion?: boolean;
  /** At least one later source must land on an earlier file rather than making a new one. */
  expectsMerge?: boolean;
  /** Nothing here survives the six-month test. */
  expectsNothing?: boolean;
}

export interface Persona {
  id: string;
  label: string;
  /** What this persona is probing about the engine. */
  probes: string;
  sources: SourceDoc[];
  expects: PersonaExpectation;
}

function convo(name: string, tool: string, turns: [string, string][]): SourceDoc {
  const body = turns
    .map(([u, a]) => `## User\n${u}\n\n## Assistant\n${a}`)
    .join("\n\n");
  return {
    name,
    text: `# ${name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")}\n\n_source: ${tool} · synthetic_\n\n${body}\n`,
  };
}

// ---------------------------------------------------------------------------
// 1. The founder — topic evolution. The failure mode is duplication.
// ---------------------------------------------------------------------------

const founder: Persona = {
  id: "founder",
  label: "창업자 — 같은 주제가 4주에 걸쳐 진행됨",
  probes:
    "동일 주제의 상태 변화를 REFINE/UPDATE로 병합하는가, 아니면 매번 새 파일을 만들어 번들을 부풀리는가.",
  sources: [
    convo("2026-03-02-pricing-decision.md", "Claude", [
      [
        "우리 SaaS 가격을 정해야 해. 지금 후보가 월 29달러 단일 요금제랑, 19/49 두 단계야. 어떻게 생각해?",
        "두 단계를 권합니다. 단일 요금제는 가격 실험 여지가 없고, 상위 티어가 없으면 확장 매출(expansion revenue)이 구조적으로 막힙니다. 19달러를 진입점으로 두되 팀 기능을 49달러에 묶는 방식이 일반적입니다.",
      ],
      [
        "좋아, 19/49로 간다. 무료 체험은 14일로 하고 신용카드는 안 받는 걸로 결정했어.",
        "카드 없는 14일 체험은 가입 전환율은 높지만 체험→유료 전환율은 낮아집니다. 그 트레이드오프를 감수한다는 뜻으로 기록해두면 나중에 숫자를 볼 때 기준이 생깁니다.",
      ],
    ]),
    convo("2026-03-19-pricing-revisit.md", "ChatGPT", [
      [
        "가격 19/49로 3주 굴려봤는데 49달러 티어로 올라오는 팀이 거의 없어. 19달러에서 다 멈춰.",
        "상위 티어에 팀이 실제로 아쉬워하는 기능이 묶여 있는지 확인해야 합니다. 좌석 수 제한만으로는 업그레이드 동기가 약합니다.",
      ],
      [
        "그래서 49달러 티어에 감사 로그랑 SSO를 넣기로 했어. 가격 단계 자체는 19/49 유지.",
        "합리적입니다. 가격 구조는 그대로 두고 상위 티어의 내용물만 바꾸는 것이므로, 이건 가격 전략의 번복이 아니라 같은 전략의 실행 조정입니다.",
      ],
    ]),
    convo("2026-04-08-pricing-annual.md", "Claude", [
      [
        "연간 결제를 추가할까 해. 2개월 할인으로.",
        "연간 결제는 현금흐름과 리텐션 양쪽에 도움이 됩니다. 2개월 할인(약 17%)은 시장 표준 범위입니다.",
      ],
      [
        "연간 옵션 추가하기로 확정. 19/49 월간은 그대로 두고 연간만 얹는 거야.",
        "기존 가격 구조를 유지한 채 결제 주기를 추가하는 것이므로 이전 결정과 충돌하지 않습니다.",
      ],
    ]),
  ],
  expects: { minConcepts: 1, maxConcepts: 3, expectsMerge: true },
};

// ---------------------------------------------------------------------------
// 2. The student — pure chatter. The failure mode is hoarding.
// ---------------------------------------------------------------------------

const student: Persona = {
  id: "student",
  label: "학생 — 전부 일회성 디버깅 잡담",
  probes: "6개월 테스트를 통과 못 하는 내용을 실제로 버리는가, 아니면 전부 개념으로 승격시키는가.",
  sources: [
    convo("2026-05-04-segfault.md", "Claude", [
      ["이 코드 왜 segfault 나?\n\n```c\nint *p; *p = 5;\n```", "`p`가 초기화되지 않은 포인터라 임의의 주소에 쓰고 있습니다. `int v; int *p = &v;`처럼 유효한 대상을 가리키게 하세요."],
      ["아 맞다 고마워", "천만에요."],
    ]),
    convo("2026-05-06-npm-error.md", "ChatGPT", [
      ["npm run dev 하면 EADDRINUSE 떠", "3000 포트를 이미 다른 프로세스가 쓰고 있습니다. `lsof -i :3000`으로 찾아서 종료하거나 다른 포트로 실행하세요."],
      ["됐다 ㅋㅋ", "다행입니다."],
    ]),
    convo("2026-05-09-git-oops.md", "Claude", [
      ["방금 커밋 되돌리고 싶어", "`git reset --soft HEAD~1`이면 커밋만 취소되고 변경사항은 남습니다."],
      ["ㅇㅋ", "네."],
    ]),
  ],
  expects: { maxConcepts: 1, expectsNothing: true },
};

// ---------------------------------------------------------------------------
// 3. The reversal — the death test. The failure mode is a silent overwrite.
// ---------------------------------------------------------------------------

const reversal: Persona = {
  id: "reversal",
  label: "번복 — 전략 철학이 정면으로 뒤집힘 (죽음의 테스트)",
  probes:
    "진짜 가치관 번복을 QUESTION으로 잡아 사람에게 되묻는가, 아니면 조용히 덮어써서 이전 판단의 근거를 지우는가.",
  sources: [
    convo("2026-02-10-open-source-stance.md", "Claude", [
      [
        "엔진 코드를 오픈소스로 공개할지 고민 중인데, 나는 공개하는 쪽이 맞다고 봐. 신뢰가 이 카테고리의 전부고, 닫힌 기억 엔진은 아무도 안 믿을 거야.",
        "일관된 입장입니다. 데이터 주권을 파는 제품이 엔진을 닫아두면 메시지가 자기모순에 빠집니다.",
      ],
      [
        "확정할게. 엔진은 오픈소스, 번들은 영원히 프라이빗. 이게 우리 원칙이야.",
        "원칙으로 기록해둘 만한 결정입니다.",
      ],
    ]),
    convo("2026-06-21-closed-source-turn.md", "ChatGPT", [
      [
        "생각이 완전히 바뀌었어. 엔진 오픈소스는 안 하는 걸로. 경쟁사가 그대로 베낄 거고, 신뢰는 코드 공개가 아니라 제품 품질로 얻는 거라고 지금은 생각해.",
        "이전 원칙과 정면으로 배치되는 판단입니다. 실행 조정이 아니라 전략 철학 자체의 번복이라는 점을 분명히 해두는 게 좋겠습니다.",
      ],
      [
        "응, 오픈소스 원칙은 폐기야. 클로즈드로 간다.",
        "기록상 이전 원칙과 충돌하므로 어느 쪽이 유효한지 명시적으로 확인이 필요합니다.",
      ],
    ]),
  ],
  expects: { minConcepts: 1, expectsQuestion: true },
};

export const PERSONAS: Persona[] = [founder, student, reversal];

export function getPersona(id: string): Persona | null {
  return PERSONAS.find((p) => p.id === id) ?? null;
}
