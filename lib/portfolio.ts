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
    period: "2026 · 01",
    title: "과제에서 제품으로",
    body:
      "Flutter 로그인과 Supabase 인증을 붙이고, Cursor로 식단 검색·캘린더를 만든다. " +
      "받은 문제를 푸는 데서 만들 것을 정하는 쪽으로 넘어간 지점.",
  },
  {
    period: "2026 · 07",
    title: "지휘",
    body:
      "모노레포 구조를 현업 수준으로 재편하면서 ADR 도입과 브랜드 자산의 LFS 분리까지 지시한다. " +
      "그러다 한 프로젝트로는 부족하다고 판단하고, 여러 에이전트에 병렬로 맡기는 것을 스스로 제안한다. " +
      "세션 하나가 1,800~5,300줄.",
    evidence: {
      ref: "archive/2026-07-14-현재-brix-폴더를-분석한-결과-앱-코드-apps-packages-는-이미-모노레포.md",
      quote: "이런 작업을 새로운 여러 에이전트로, 해줄수 있어 ? /Users/jw/JW_Projects 안에 있는 모든 프로젝트들 ?",
    },
  },
  {
    period: "2026 · 07",
    title: "재귀",
    body:
      "AI 코딩 에이전트를 써서, 자신이 AI 코딩 에이전트를 어떻게 쓰는지 기록하는 도구를 만든다. " +
      "그 도구가 brane이고, 그 기록이 이 페이지다.",
  },
];

