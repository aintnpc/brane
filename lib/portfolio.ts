import { CASES } from "./cases";

// Curated portfolio content.
//
// Two rules govern what may appear here.
//
// 1. Every claim traces to something checkable — a bundle concept (linked via
//    /web?open=…), a raw archive log (gated by lib/visibility.ts), a live URL,
//    a public repo, or a number counted off the filesystem.
// 2. Counts exclude vendored code. PEGASUS ships the OpenVSP 3.51.2 toolchain,
//    which alone is ~88k lines of Python; counting it would turn a 3.2k-line
//    project into a 92k-line one. The same applies to Pods, node_modules, and
//    .venv elsewhere. An inflated number is worse than no number, because the
//    whole argument here is that the record can be checked.
//
// Status strings come from each venture doc's own frontmatter, unrewritten.
// "도메인 만료", "App Store 리스팅 만료", "파킹" stay in.


export interface Mark {
  name: string;
  /** anchor on this page */
  href: string;
  /** logo file, when one exists — otherwise the name is set as a wordmark */
  src?: string;
  /**
   * Each mark keeps the background it was drawn for. Clozet's is a white app
   * icon, Red Apple's ships on near-black, the rest are transparent. Forcing one
   * tile colour on all of them made Red Apple read as a black square with a
   * mistake in it. An app-icon shelf is supposed to be many colours.
   */
  bg: string;
  fg?: string;
  kicker: string;
}

/** The strip at the top: what got built, at a glance, before any reading. */
export const MARKS: Mark[] = [
  { name: "Clozet", href: "#clozet", src: "/portfolio/marks/clozet.png", bg: "#ffffff", kicker: "커머스 플랫폼" },
  { name: "PEGASUS", href: "#others", bg: "#111114", fg: "#e4e4e7", kicker: "eVTOL 개념설계" },
  { name: "Share2DM", href: "#share2dm", src: "/portfolio/marks/share2dm.png", bg: "#f7f7f8", kicker: "DM 자동화" },
  { name: "Green Apple", href: "#green-apple", src: "/portfolio/marks/green-apple.png", bg: "#fafafa", kicker: "다이어트 코치" },
  { name: "Red Apple", href: "#green-apple", src: "/portfolio/marks/red-apple.png", bg: "#0a0a0a", kicker: "웨이트 코치" },
  { name: "brane", href: "#others", src: "/portfolio/marks/brane.png", bg: "#f4f4f5", kicker: "기억 원장" },
  { name: "운동의정석", href: "#others", bg: "#ffffff", fg: "#4a9d6e", kicker: "첫 피트니스 앱 · 2022" },
];

export interface ProjectLink {
  label: string;
  href?: string;
  /** live = reachable now · repo = public source · gone = existed, no longer reachable */
  kind: "live" | "repo" | "gone";
  note?: string;
}

export interface CodeStats {
  /** authored lines only — vendored/generated trees excluded */
  lines: number;
  files: number;
  commits?: number;
  period: string;
  breakdown: string;
}

export interface Shot {
  src: string;
  alt: string;
  caption: string;
}

export interface Project {
  name: string;
  year: string;
  oneLiner: string;
  status: string;
  stage: "shipped" | "built" | "design";
  /** what this person actually did — HR reads this before anything else */
  role: string;
  detail: string;
  stack: string[];
  source?: string;
  links: ProjectLink[];
  code?: CodeStats;
  shots?: Shot[];
}

export const PROJECTS: Project[] = [
  {
    name: "PEGASUS",
    year: "2026.08",
    oneLiner: "Fan-in-Wing eVTOL 개념설계 — 자기 시장 가설 5개를 데이터로 기각한 기록.",
    status: "설계·검증 완결 · 결론은 '이 형상으로는 안 된다'",
    stage: "design",
    role: "단독 — 방정식 유도, 파라메트릭 모델, 규제 분석",
    detail:
      "리프트 팬을 날개에 매립하는 형상이 가능한지 판정하려는데 정리된 지배 방정식이 없어 직접 유도했다. " +
      "매립 조건에서 중량이 소거되고 순항 속도가 호버 비출력에 정비례로 묶인다는 결과가 나왔다. " +
      "FAA Part 108 원문 647쪽을 파싱해 규제·원가도 따졌다. 세운 시장 가설 5개가 전부 '경쟁자보다 " +
      "나은가'에서 무너지는 것을 확인하고 프로젝트를 접었다. 성공 사례가 아니라 기각 기록이라 남겼다.",
    stack: ["Python", "OpenVSP", "파라메트릭 설계", "규제 분석"],
    source: "ventures/pegasus.md",
    links: [{ label: "비공개 저장소", kind: "gone", note: "로컬 전용 · 요청 시 열람" }],
    code: {
      lines: 3196,
      files: 22,
      commits: 4,
      period: "2026.08",
      breakdown: "Python 3,196줄(src) + 유도·시장분석 문서 1,416줄 · OpenVSP 툴체인 88k줄 제외",
    },
  },
  {
    name: "brane",
    year: "2026.07 — 진행 중",
    oneLiner: "AI 대화 로그를 소화해 개념 그래프로 만드는 기억 원장.",
    status: "운영 중 — 이 사이트가 그 위에서 돈다",
    stage: "shipped",
    role: "단독 설계·개발 — 읽기/쓰기 경로, 그래프, 공개 경계",
    detail:
      "2022년부터 쌓인 1,082개 대화 로그가 25개 개념 문서로 소화돼 있고, 모든 문장에 원본 인용이 붙는다. " +
      "쓰기 경로는 NEW/UPDATE/REFINE/QUESTION 판정을 내리는 LLM 캐스케이드이고, 읽기 경로는 " +
      "필요할 때만 인용 원본까지 따라 들어간다. 지금 보고 있는 이 포트폴리오도 그 원장에서 나왔다.",
    stack: ["Next.js", "TypeScript", "Anthropic SDK", "Vercel"],
    source: "architecture/brane.md",
    links: [
      { label: "brane.my", href: "/web", kind: "live", note: "지금 이 사이트" },
      { label: "github.com/aintnpc/brane", href: "https://github.com/aintnpc/brane", kind: "repo" },
    ],
    code: {
      lines: 3198,
      files: 32,
      commits: 19,
      period: "2026.07 — 2026.08",
      breakdown: "TSX 1,829줄 · TS 1,308줄 — 원장 데이터는 별도 저장소",
    },
  },
  {
    name: "운동의정석",
    year: "2022",
    oneLiner: "3인 팀으로 만든 첫 피트니스 앱. 모든 헬스 작업의 출발점.",
    status: "군 복무로 중단",
    stage: "shipped",
    role: "팀 리드 (3인)",
    detail:
      "광고비 약 30만원으로 1주일 만에 약 1,000명(759명 언급) 유저를 모았고 피드백은 전원 긍정이었다. " +
      "수익화를 풀지 못한 채 병역으로 중단됐다. 전작 유저가 남긴 개선 요청 중 '증량 수요'가 " +
      "4년 뒤 Red Apple의 착안점이 됐다.",
    stack: ["모바일", "3인 팀"],
    source: "ventures/green-apple.md",
    links: [{ label: "서비스 종료", kind: "gone", note: "2022년 중단" }],
  },
  {
    name: "HYRE",
    year: "2026",
    oneLiner: "채용의 검증 레이어 — 산출물이 아니라 과정을 읽는다.",
    status: "컨셉 단계 · 이 포트폴리오를 만든 방법",
    stage: "design",
    role: "단독 기획",
    detail:
      "AI가 산출물을 대신 만드는 시대에는 산출물의 신호 가치가 죽고 과정만 남는다. brane이 과정의 " +
      "기록계라면 HYRE는 그 기록을 읽는 채용 시장이다. 주장의 층(인터뷰)과 증거의 층(원장)을 교차 " +
      "검증하고, 무엇을 누구에게 열지는 후보자가 고른다. 이 페이지가 그 파이프라인의 첫 출력물이다.",
    stack: ["컨셉", "brane 기반"],
    source: "ventures/hyre.md",
    links: [{ label: "이 페이지", kind: "live", href: "/portfolio" }],
  },
];

/**
 * Aggregate across the case studies and the index — stated in the header, so it
 * has to equal the per-entry figures a reader can add up themselves.
 */
/**
 * Written before the Green Apple rewrite and cited inside that case study, so it
 * has to be in the total too — otherwise a reader adding the figures up lands on
 * a different number than the header claims.
 */
const REFINE_LINES = 37282;

/** The abandoned React Native port of Clozet, cited in that case study. */
const LYFE_LINES = 36211;

export const CODE_TOTAL = {
  lines:
    PROJECTS.reduce((n, p) => n + (p.code?.lines ?? 0), 0) +
    CASES.reduce((n, c) => n + c.code.lines, 0) +
    REFINE_LINES +
    LYFE_LINES,
  commits:
    PROJECTS.reduce((n, p) => n + (p.code?.commits ?? 0), 0) +
    CASES.reduce((n, c) => n + (c.code.commits ?? 0), 0),
};

export interface StackGroup {
  label: string;
  items: string[];
}

/** Derived from what the projects above actually contain, not from aspiration. */
export const STACK: StackGroup[] = [
  { label: "언어", items: ["TypeScript", "Dart", "Python", "SQL", "Swift/Kotlin (연동 수준)"] },
  { label: "프론트·앱", items: ["React", "Next.js", "React Native / Expo", "Flutter"] },
  { label: "백엔드·인프라", items: ["Supabase (Postgres · RLS)", "Cloudflare Workers", "R2", "Vercel"] },
  { label: "연동", items: ["Meta Graph API (공식 승인)", "RevenueCat", "Anthropic API", "Gemini API"] },
  { label: "도구", items: ["Claude Code", "Cursor", "Maestro (디바이스 QA)", "MCP", "OpenVSP"] },
];

export interface TimelineEntry {
  period: string;
  title: string;
  note: string;
  kind: "edu" | "work";
}

export const TIMELINE: TimelineEntry[] = [
  { period: "2022", title: "운동의정석 — 첫 앱, 3인 팀 리드", note: "1주일 만에 약 1,000명. 수익화를 풀지 못한 채 병역으로 중단.", kind: "work" },
  { period: "2025.07", title: "Clozet 착수", note: "Flutter 앱 → 백오피스 → 정산까지 1년간 확장.", kind: "work" },
  { period: "2026.02", title: "Share2DM", note: "Clozet의 유입 엔진이자 독립 SaaS. 2개월 만에 온라인.", kind: "work" },
  { period: "2026.05", title: "Green / Red Apple", note: "모노레포로 앱 2종. Green은 App Store 도달.", kind: "work" },
  { period: "2026.07", title: "brane", note: "4년치 AI 대화 로그를 원장으로. 현재 운영 중.", kind: "work" },
  { period: "2026.08", title: "PEGASUS", note: "eVTOL 물리 한계 정량화. 자기 가설 5개를 기각.", kind: "work" },
];

export const EDUCATION = {
  school: "Stony Brook University",
  major: "Computer Science",
  status: "휴학 중",
};

export interface TrajectoryPoint {
  period: string;
  title: string;
  body: string;
  evidence?: { ref: string; quote: string };
}

/**
 * The behavioural trail behind identity/ai-native-workflow.md, synthesised from
 * 96 IDE assistant sessions (VS Code Copilot 67 + Cursor 12 + Claude Code 17)
 * spanning 2025-04 to 2026-07.
 */
export const TRAJECTORY: TrajectoryPoint[] = [
  {
    period: "2025 · 04",
    title: "붙여넣기",
    body: "Java 자료구조 과제. 컴파일러 오류를 맥락 없이 그대로 붙여넣는다. 세션 하나가 7~11줄.",
    evidence: {
      ref: "archive/2025-04-08-unreachable-code-and-stack-manipulation-fix.md",
      quote: "@workspace /explain Unreachable code",
    },
  },
  {
    period: "2025 · 09",
    title: "한 줄 명령",
    body: "C 코스워크. 포인터, 구조체, 연결 리스트. 목표도 의도도 설명하지 않는 명령형 프롬프트.",
    evidence: {
      ref: "archive/2025-09-25-이거-포인터-쓰는걸로-바꿔줘.md",
      quote: "이거 포인터 쓰는걸로 바꿔줘",
    },
  },
  {
    period: "2025 · 10",
    title: "답 대신 이해를 요구하기 시작",
    body:
      "가장 중요한 전환점. AI가 코드를 고쳐주겠다는데 두 번 연속 거절하고 설명을 요구한다. " +
      "이 습관은 후기에 익힌 세련미가 아니라 코스워크 시절부터 있던 기질이다.",
    evidence: {
      ref: "archive/2025-10-16-어디가-문제-야-코드-고치지-말고-말로-설명해.md",
      quote: "어디가 문제 야 ? 코드 고치지 말고 말로 설명해",
    },
  },
  {
    period: "2025 · 10",
    title: "스코프를 통제하기 시작",
    body: "AI가 코드를 통째로 재작성하는 것을 막고 변경 범위를 좁힌다. 에이전트를 잘 쓰는 사람의 핵심 행동.",
    evidence: {
      ref: "archive/2025-10-16-최소한으로-수정한다면-내-코드-스타일-건들이지-않고-뭐가-추가-되어야해.md",
      quote: "최소한으로 수정한다면, 내 코드 스타일 건들이지 않고, 뭐가 추가 되어야해 ?",
    },
  },
  {
    period: "2025 · 11",
    title: "'왜'를 묻는다 — 그리고 짜증도 남긴다",
    body:
      "오류를 고치는 데서 멈추지 않고 원인을 캔다. 같은 달, 지워도 됐을 문장이 원장에 그대로 남아 있다. " +
      "이 기록계가 정직하다는 증거다.",
    evidence: {
      ref: "archive/2025-11-21-왜-게속-오류는-발생하는건지-너무-짜증난다.md",
      quote: "왜 게속 오류는 발생하는건지 너무 짜증난다.",
    },
  },
  {
    period: "2026 · 01",
    title: "코스워크에서 프로덕트로",
    body: "Flutter 로그인, Supabase 인증, Cursor로 식단 검색·캘린더 기능. 과제가 아니라 제품을 만들기 시작한다.",
  },
  {
    period: "2026 · 06 — 07",
    title: "지휘",
    body:
      "Claude Code로 React Native 모노레포를 프로덕션 수준까지. 다중 에이전트 병렬 위임을 스스로 발의하고, " +
      "MCP·QA 도구를 체이닝하고, 에이전트에 역할 페르소나를 부여한다. 세션 하나가 1,800~5,300줄. " +
      "붙여넣는 사람에서 지휘하는 사람으로.",
  },
  {
    period: "2026 · 07",
    title: "재귀",
    body:
      "AI 코딩 에이전트를 써서, 자신이 AI 코딩 에이전트를 어떻게 쓰는지 기록하는 도구를 만든다. " +
      "그 도구가 brane이고, 그 기록이 이 페이지다.",
  },
];
