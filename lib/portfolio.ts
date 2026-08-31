import { CV } from "./cv";

// Curated portfolio content.
//
// Two rules govern what may appear here.
//
// 1. Every claim traces to something checkable — a bundle concept (linked via
//    /web?open=…), a raw archive log (gated by lib/visibility.ts), a live URL,
//    a public repo, or a number counted off the filesystem.
// 2. Counts exclude vendored and generated trees — Pods, node_modules, .venv,
//    build output. An inflated number is worse than no number, because the whole
//    argument here is that the record can be checked.
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
  { name: "Clozet", href: "#work", src: "/portfolio/marks/clozet.png", bg: "#ffffff", kicker: "커머스 플랫폼" },
  { name: "Share2DM", href: "#work", src: "/portfolio/marks/share2dm.png", bg: "#f7f7f8", kicker: "DM 자동화" },
  { name: "Green Apple", href: "#work", src: "/portfolio/marks/green-apple.png", bg: "#fafafa", kicker: "다이어트 코치" },
  { name: "Red Apple", href: "#work", src: "/portfolio/marks/red-apple.png", bg: "#0a0a0a", kicker: "웨이트 코치" },
  { name: "brane", href: "#work", src: "/portfolio/marks/brane.png", bg: "#f4f4f5", kicker: "기억 원장" },
  { name: "운동의정석", href: "#work", bg: "#ffffff", fg: "#4a9d6e", kicker: "첫 피트니스 앱 · 2022" },
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

/**
 * Stated in the header, so it has to equal the per-entry figures a reader can
 * add up from the résumé itself — plus the two rewrites that are cited inside
 * case studies but have no entry of their own.
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
    CV.reduce((n, e) => n + (e.lines ?? 0), 0) + REFINE_LINES + LYFE_LINES,
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
