import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jaewon Kim",
  description:
    "지금까지 만든 것들, 그리고 그것을 만든 과정. 1,082개 AI 대화 로그에서 소화된 포트폴리오.",
};

const doors = [
  {
    href: "/portfolio",
    label: "PORTFOLIO",
    title: "포트폴리오",
    blurb: "지금까지 만든 것들 — 그리고 그것을 만든 과정.",
    meta: "9개 프로젝트 · 2022 → 2026",
  },
  {
    href: "/web",
    label: "ENGINE",
    title: "brane",
    blurb: "이 포트폴리오가 나온 곳. 대화 로그를 소화해 개념 그래프로 만드는 원장.",
    meta: "1,082개 로그 · 25개 개념",
  },
];

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col justify-between px-6 py-10 sm:px-10 sm:py-14"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          김재원
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Jaewon Kim · Solo builder
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-4 py-14 sm:grid-cols-2 sm:gap-6">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="group relative flex flex-col justify-between rounded-2xl border p-7 transition-colors duration-200 sm:min-h-[19rem] sm:p-9"
            style={{
              borderColor: "var(--panel-border)",
              background: "var(--panel-bg)",
            }}
          >
            <span
              className="font-mono text-[0.65rem] tracking-[0.2em]"
              style={{ color: "var(--accent-text)" }}
            >
              {door.label}
            </span>

            <div className="mt-10 sm:mt-0">
              <h2
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                {door.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {door.blurb}
              </p>
            </div>

            <div
              className="mt-8 flex items-center justify-between border-t pt-4 text-xs"
              style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
            >
              <span className="font-mono">{door.meta}</span>
              <span
                className="transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: "var(--accent-text)" }}
                aria-hidden
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <footer className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        오른쪽이 왼쪽을 만들었습니다 — 포트폴리오의 모든 문장은 실제 대화 로그에서 나왔고,
        <br className="hidden sm:block" />
        문장마다 그 원본을 열어볼 수 있습니다.
      </footer>
    </main>
  );
}
