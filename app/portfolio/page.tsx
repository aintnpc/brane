import Link from "next/link";
import type { Metadata } from "next";
import { TRAJECTORY, TIMELINE, STACK, EDUCATION, MARKS, CODE_TOTAL } from "@/lib/portfolio";
import { CASES } from "@/lib/cases";
import { CV } from "@/lib/cv";
import EvidenceLink from "@/components/EvidenceLink";
import AskBrane from "@/components/AskBrane";
import ThemeToggle from "@/components/ThemeToggle";
import WorkView from "@/components/WorkView";

export const metadata: Metadata = {
  title: "Jaewon Kim — Portfolio",
  description: "앱·백오피스·결제·인프라를 혼자 만든다. 판단이 필요했던 세 건과, 그 판단이 만들어진 과정.",
};


function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
      {children}
    </p>
  );
}

export default function PortfolioPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8 sm:py-20" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <nav className="mb-14 flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:underline">← 처음</Link>
        <Link href="/web" className="hover:underline">brane 열기</Link>
        <span className="ml-auto"><ThemeToggle /></span>
      </nav>

      <AskBrane />

      {/* ── marks ────────────────────────────────────────── */}
      <div className="mt-24">
        <Kicker>만든 것</Kicker>
        <p className="mt-3 text-lg leading-relaxed sm:text-xl" style={{ color: "var(--text-primary)" }}>
          앱, 백오피스, 결제, 인프라까지 혼자 만든다.
        </p>
        <p className="mt-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          2022 — 2026 · 저작 코드 {CODE_TOTAL.lines.toLocaleString()}줄 (vendored 제외)
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {MARKS.map((m) => (
          <li key={m.name}>
            <a href={m.href} className="group block">
              <div
                className="flex h-16 items-center justify-center rounded-xl border px-3 transition-colors"
                style={{ borderColor: "var(--panel-border)", background: m.bg }}
              >
                {m.src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.src} alt={m.name} className="max-h-9 max-w-full object-contain" />
                ) : (
                  <span className="font-mono text-[0.7rem] font-semibold tracking-wide" style={{ color: m.fg ?? "#18181b" }}>
                    {m.name.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-[0.7rem] font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</p>
              <p className="truncate text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{m.kicker}</p>
            </a>
          </li>
        ))}
      </ul>

      <WorkView cv={CV} cases={CASES} />

      <hr className="my-20" style={{ borderColor: "var(--panel-border)" }} />

      {/* ── trajectory ───────────────────────────────────── */}
      <section>
        <Kicker>과정</Kicker>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AI와 어떻게 일해왔는가
        </h2>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          위의 판단들이 어디서 왔는지에 대한 기록이다. 2025년 4월부터 2026년 7월까지 IDE 코딩 세션
          96개가 남아 있고(VS Code Copilot 67, Cursor 12, Claude Code 17), 거기서 뽑은 건 코드가 아니라
          일하는 방식의 변화다. 인용은 전부 실제 프롬프트이고 클릭하면 원본 세션이 열린다.
        </p>

        <ol className="mt-10 space-y-9 border-l pl-6" style={{ borderColor: "var(--panel-border)" }}>
          {TRAJECTORY.map((t, i) => (
            <li key={`${t.period}-${i}`} className="relative">
              <span className="absolute -left-[1.68rem] top-1.5 h-2 w-2 rounded-full"
                    style={{ background: "var(--accent-text)" }} aria-hidden />
              <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{t.period}</p>
              <h3 className="mt-1 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.body}</p>
              {t.evidence && <div className="mt-4"><EvidenceLink archiveRef={t.evidence.ref} quote={t.evidence.quote} /></div>}
            </li>
          ))}
        </ol>

        <p className="mt-10 rounded-xl border p-5 text-sm leading-relaxed"
           style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)", color: "var(--text-secondary)" }}>
          규모가 그 자체로 지표다. 2025년 코스워크 세션은 대개{" "}
          <strong style={{ color: "var(--text-primary)" }}>7~11줄</strong>, 오류 한 줄 붙여넣기였다.
          2026년 에이전트 세션은 <strong style={{ color: "var(--text-primary)" }}>1,800~5,300줄</strong>이다.
          <br />
          <Link href="/web?open=identity%2Fai-native-workflow.md"
                className="mt-3 inline-block font-mono text-xs hover:underline" style={{ color: "var(--accent-text)" }}>
            전체 분석 문서 열기 →
          </Link>
        </p>
      </section>

      <hr className="my-20" style={{ borderColor: "var(--panel-border)" }} />

      {/* ── timeline + stack ─────────────────────────────── */}
      <section>
        <Kicker>이력</Kicker>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          어디를 지나왔는가
        </h2>

        <ol className="mt-8">
          {TIMELINE.map((t, i) => (
            <li key={`${t.period}-${i}`}
                className="grid grid-cols-[4.5rem_1fr] gap-4 border-t py-4 sm:grid-cols-[6rem_1fr]"
                style={{ borderColor: "var(--panel-border)" }}>
              <span className="font-mono text-xs" style={{ color: "var(--accent-text)" }}>{t.period}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t.note}</p>
              </div>
            </li>
          ))}
          <li className="grid grid-cols-[4.5rem_1fr] gap-4 border-t border-b py-4 sm:grid-cols-[6rem_1fr]"
              style={{ borderColor: "var(--panel-border)" }}>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>학력</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {EDUCATION.school} · {EDUCATION.major}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>현재 {EDUCATION.status}.</p>
            </div>
          </li>
        </ol>

        <h3 className="mt-12 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>기술 스택</h3>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>위 작업들이 실제로 쓴 것만 적었다.</p>
        <dl className="mt-5 space-y-3">
          {STACK.map((g) => (
            <div key={g.label} className="grid grid-cols-[4.5rem_1fr] gap-4 sm:grid-cols-[6rem_1fr]">
              <dt className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{g.label}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span key={it} className="rounded border px-2 py-0.5 font-mono text-[0.65rem]"
                        style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}>{it}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <hr className="my-20" style={{ borderColor: "var(--panel-border)" }} />

      {/* ── contact ──────────────────────────────────────── */}
      <footer>
        <Kicker>CONTACT</Kicker>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="mailto:kimjaewon.723@gmail.com" className="hover:underline" style={{ color: "var(--text-primary)" }}>
            kimjaewon.723@gmail.com
          </a>
          <a href="https://github.com/aintnpc" target="_blank" rel="noreferrer" className="hover:underline"
             style={{ color: "var(--text-primary)" }}>GitHub · aintnpc</a>
          <Link href="/web" className="hover:underline" style={{ color: "var(--text-primary)" }}>brane · brane.my</Link>
        </div>
        <p className="mt-10 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          코드 지표는 저장소를 직접 세었고 vendored·생성 코드는 제외했다. 프로젝트 상태는 원장 기록 그대로다.
          <br />
          마지막 갱신 2026-08-27
        </p>
      </footer>
    </main>
  );
}
