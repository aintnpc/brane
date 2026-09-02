import Link from "next/link";
import type { Metadata } from "next";
import AskBrane from "@/components/AskBrane";
import ThemeToggle from "@/components/ThemeToggle";

// The product page, as opposed to the portfolio.
//
// /web opens on a graph and never says what it is; /portfolio opens on a name,
// which reads as a personal site rather than a service. This page opens on the
// problem, demonstrates the answer in place, and states the things a submission
// has to state — AI method and tools — inline rather than in a form field.

export const metadata: Metadata = {
  title: "brane — AI 대화 기록 원장",
  description:
    "ChatGPT·Claude·Cursor에 쌓인 대화를 개념 문서로 압축하고, 모든 문장에 원본 인용을 붙인다. 나중에 질문하면 근거와 함께 답한다.",
};

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
        {label}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const PIPELINE = [
  {
    step: "쓰기",
    body:
      "새 대화를 기존 문서와 대조해 NEW / UPDATE / REFINE / QUESTION 중 하나로 판정하는 LLM 캐스케이드. " +
      "판정이 틀려 기존 문서를 덮어쓰지 않도록 별도 안전 검사를 둔다. 두 출처가 어긋나면 합치지 않고 " +
      "QUESTION으로 남긴다 — 조용히 해소된 모순이 가장 나쁘기 때문이다.",
  },
  {
    step: "읽기",
    body:
      "질문이 오면 먼저 문서 인덱스만 보고 후보를 고른다. 전문을 다 넣지 않는다. 고른 문서의 발췌로 " +
      "답하고, 발췌로 부족할 때만 인용 원본까지 한 번 더 들어간다. 컨텍스트를 예산으로 다루는 구조다.",
  },
  {
    step: "경계",
    body:
      "원장에는 개인 기록이 함께 있다. 허용 목록에 없으면 비공개인 fail-closed 게이트를 두고, 공개분만 " +
      "배포한다. 비공개 문서는 서빙되지 않는 게 아니라 배포본에 존재하지 않는다.",
  },
];

const TOOLS = [
  ["모델", "Claude Haiku 4.5 (Anthropic API) — 판정·선별·합성"],
  ["앱", "Next.js · TypeScript · Tailwind"],
  ["그래프", "react-force-graph (2D/3D, WebGL 없으면 자동 폴백)"],
  ["배포", "Vercel"],
  ["개발", "Claude Code · Cursor — 이 저장소 자체가 에이전트로 만들어졌다"],
];

export default function BranePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8 sm:py-20" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <nav className="mb-12 flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/web" className="hover:underline">그래프 보기</Link>
        <Link href="/portfolio" className="hover:underline">이 원장이 만든 포트폴리오</Link>
        <span className="ml-auto"><ThemeToggle /></span>
      </nav>

      <AskBrane
        minHeight="auto"
        header={
          <>
            <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
              BRANE
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-snug tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              AI와 나눈 대화는 쌓이기만 하고
              <br />
              다시 찾을 수 없다.
            </h1>
            <p className="mt-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              ChatGPT에서 정한 것을 Claude는 모른다. 반년 전에 왜 그렇게 결정했는지 찾으려면 스크롤을 올려야 하고,
              대개 못 찾는다. 새 도구를 쓸 때마다 자신을 처음부터 다시 설명한다.
            </p>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              brane은 그 로그를 개념 문서로 압축하고, <strong>모든 문장에 원본 인용을 붙인다.</strong> 나중에 물으면
              근거와 함께 답한다. 아래에서 직접 해보세요.
            </p>
          </>
        }
      />

      <Section label="어떻게 동작하나" title="AI가 기능이 아니라 공정이다">
        <ol className="space-y-6">
          {PIPELINE.map((p) => (
            <li key={p.step} className="grid gap-2 sm:grid-cols-[4rem_1fr] sm:gap-5">
              <span className="pt-0.5 font-mono text-xs" style={{ color: "var(--accent-text)" }}>{p.step}</span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="사용 도구" title="무엇으로 만들었나">
        <dl className="space-y-2.5">
          {TOOLS.map(([k, v]) => (
            <div key={k} className="grid gap-1 sm:grid-cols-[4rem_1fr] sm:gap-5">
              <dt className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{k}</dt>
              <dd className="text-sm" style={{ color: "var(--text-secondary)" }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label="지금 상태" title="어디까지 됐고 어디가 비었나">
        <div
          className="rounded-xl border p-5 text-sm leading-relaxed"
          style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}
        >
          <p>
            2022년부터의 대화 로그 <strong style={{ color: "var(--text-primary)" }}>1,082개</strong>가 소화돼 있고,
            그중 개념 문서 <strong style={{ color: "var(--text-primary)" }}>14개</strong>를 공개했다. 이 원장으로 만든
            결과물이 <Link href="/portfolio" className="underline" style={{ color: "var(--accent-text)" }}>포트폴리오</Link>이고,
            거기 적힌 문장들은 여기 있는 문서에서 나왔다.
          </p>
          <p className="mt-4">
            비어 있는 것도 적는다. <strong style={{ color: "var(--text-primary)" }}>사용자는 아직 한 명</strong>이다 —
            만든 사람. 남의 로그를 넣는 입구가 없고, 원장에 들어 있는 건 대화지 코드가 아니다. 인용 중 실제로
            열리는 비율도 아직 낮다. 무엇을 열지는 기록의 주인이 고르는 구조라서 그렇고, 그 선별을 자동화하는 게
            다음 일이다.
          </p>
        </div>
      </Section>

      <footer className="mt-20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/web" className="hover:underline" style={{ color: "var(--text-primary)" }}>
          개념 그래프 →
        </Link>
        <a href="https://github.com/aintnpc/brane" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--text-primary)" }}>
          github.com/aintnpc/brane
        </a>
        <a href="mailto:kimjaewon.723@gmail.com" className="hover:underline" style={{ color: "var(--text-primary)" }}>
          kimjaewon.723@gmail.com
        </a>
      </footer>
    </main>
  );
}
