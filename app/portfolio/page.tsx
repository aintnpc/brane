import Link from "next/link";
import type { Metadata } from "next";
import {
  PROJECTS,
  TRAJECTORY,
  TIMELINE,
  STACK,
  EDUCATION,
  CODE_TOTAL,
  type Project,
} from "@/lib/portfolio";
import EvidenceLink from "@/components/EvidenceLink";

export const metadata: Metadata = {
  title: "Jaewon Kim — Portfolio",
  description:
    "2022년부터 쌓인 1,082개 AI 대화 로그에서 소화된 포트폴리오. 만든 것과, 만드는 과정.",
};

const STAGE_LABEL: Record<Project["stage"], string> = {
  shipped: "실유저 도달",
  built: "완성",
  design: "설계·분석",
};

const LINK_STYLE: Record<string, { dot: string; label: string }> = {
  live: { dot: "#22c55e", label: "라이브" },
  repo: { dot: "#a78bfa", label: "소스" },
  gone: { dot: "#71717a", label: "종료" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
      {children}
    </p>
  );
}

function Rule() {
  return <hr className="my-16" style={{ borderColor: "var(--panel-border)" }} />;
}

export default function PortfolioPage() {
  const stats = [
    { value: CODE_TOTAL.lines.toLocaleString(), label: "저작 코드 라인" },
    { value: String(CODE_TOTAL.commits), label: "커밋" },
    { value: "1,082", label: "AI 대화 로그" },
    { value: "9", label: "프로젝트" },
  ];

  return (
    <main
      className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8 sm:py-20"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      <nav className="mb-14 flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:underline">← 처음</Link>
        <Link href="/web" className="hover:underline">brane 열기</Link>
      </nav>

      {/* ── hero ───────────────────────────────────────────── */}
      <header>
        <SectionLabel>PORTFOLIO</SectionLabel>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
          김재원
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Jaewon Kim · Solo builder · {EDUCATION.school} {EDUCATION.major} ({EDUCATION.status})
        </p>

        <p className="mt-10 text-xl leading-relaxed sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          AI가 산출물을 대신 만드는 시대에는, 산출물이 더 이상 증거가 되지 못한다.
          <br />
          그래서 과정을 남겼다.
        </p>
        <p className="mt-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          이 페이지의 출처는 2022년부터 쌓인 1,082개의 AI 대화 로그다. 여기 적힌 문장은 전부 그 기록에서
          나왔고, 인용된 프롬프트는 클릭하면 원본 로그가 그대로 열린다. 코드 라인 수는 vendored·생성 코드를
          제외한 저작분만 센 것이다 — 검증되지 않는 숫자는 이 페이지의 논지를 스스로 깨기 때문이다.
        </p>

        <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-mono text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </dd>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </dl>
      </header>

      <Rule />

      {/* ── timeline + stack ───────────────────────────────── */}
      <section>
        <SectionLabel>00 — 이력</SectionLabel>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          어디를 지나왔는가
        </h2>

        <ol className="mt-8 space-y-0">
          {TIMELINE.map((t, i) => (
            <li
              key={`${t.period}-${i}`}
              className="grid grid-cols-[4.5rem_1fr] gap-4 border-t py-4 sm:grid-cols-[6rem_1fr]"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <span className="font-mono text-xs" style={{ color: "var(--accent-text)" }}>{t.period}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t.note}</p>
              </div>
            </li>
          ))}
          <li
            className="grid grid-cols-[4.5rem_1fr] gap-4 border-t border-b py-4 sm:grid-cols-[6rem_1fr]"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>학력</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {EDUCATION.school} · {EDUCATION.major}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                현재 {EDUCATION.status}.
              </p>
            </div>
          </li>
        </ol>

        <h3 className="mt-12 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          기술 스택
        </h3>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          아래 프로젝트들이 실제로 쓴 것만 적었다.
        </p>
        <dl className="mt-5 space-y-3">
          {STACK.map((g) => (
            <div key={g.label} className="grid grid-cols-[4.5rem_1fr] gap-4 sm:grid-cols-[6rem_1fr]">
              <dt className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{g.label}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span
                    key={it}
                    className="rounded border px-2 py-0.5 font-mono text-[0.65rem]"
                    style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}
                  >
                    {it}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Rule />

      {/* ── projects ───────────────────────────────────────── */}
      <section>
        <SectionLabel>01 — 만든 것</SectionLabel>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          지금까지 만든 것
        </h2>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          라이브인 것, 만료된 것, 파킹된 것을 구분해서 적었다. 상태 표기는 원장에 기록된 문장을 그대로
          옮긴 것이고, 좋게 고쳐 쓰지 않았다. 검증할 수 없는 포트폴리오는 애초에 이 작업이 풀려는 문제다.
        </p>

        <ol className="mt-12 space-y-16">
          {PROJECTS.map((p) => (
            <li key={p.name}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{p.year}</span>
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[0.6rem] tracking-wider"
                  style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
                >
                  {STAGE_LABEL[p.stage]}
                </span>
              </div>

              <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.oneLiner}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent-text)" }}>역할</span> · {p.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.detail}</p>
              <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent-text)" }}>상태</span> · {p.status}
              </p>

              {p.code && (
                <div
                  className="mt-4 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }}
                >
                  <p className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                    {p.code.lines.toLocaleString()}줄 · {p.code.files}개 파일
                    {p.code.commits ? ` · 커밋 ${p.code.commits}` : ""} · {p.code.period}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {p.code.breakdown}
                  </p>
                </div>
              )}

              {p.shots && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {p.shots.map((s) => (
                    <figure key={s.src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.src}
                        alt={s.alt}
                        loading="lazy"
                        className="h-40 w-full rounded-lg border object-contain p-1.5 sm:h-44"
                        style={{
                          borderColor: "var(--panel-border)",
                          background: "var(--hover-bg)",
                        }}
                      />
                      <figcaption className="mt-1.5 text-[0.65rem] leading-snug" style={{ color: "var(--text-muted)" }}>
                        {s.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {p.links.map((l) => {
                  const st = LINK_STYLE[l.kind];
                  const inner = (
                    <>
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: st.dot }}
                        aria-hidden
                      />
                      <span>{l.label}</span>
                      {l.note && (
                        <span style={{ color: "var(--text-muted)" }}>({l.note})</span>
                      )}
                    </>
                  );
                  const cls = "flex items-center gap-1.5 font-mono text-[0.65rem]";
                  return l.href ? (
                    <a
                      key={l.label}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className={`${cls} hover:underline`}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {inner}
                    </a>
                  ) : (
                    <span key={l.label} className={cls} style={{ color: "var(--text-muted)" }}>
                      {inner}
                    </span>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded border px-2 py-0.5 font-mono text-[0.65rem]"
                    style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
                  >
                    {s}
                  </span>
                ))}
                {p.source && (
                  <Link
                    href={`/web?open=${encodeURIComponent(p.source)}`}
                    className="ml-1 font-mono text-[0.65rem] hover:underline"
                    style={{ color: "var(--accent-text)" }}
                  >
                    원장에서 열기 →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Rule />

      {/* ── trajectory ─────────────────────────────────────── */}
      <section>
        <SectionLabel>02 — 과정</SectionLabel>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AI와 어떻게 일해왔는가
        </h2>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          2025년 4월부터 2026년 7월까지 96개의 IDE 코딩 세션이 남아 있다. VS Code Copilot 67, Cursor 12,
          Claude Code 17. 여기서 뽑아낸 것은 코드가 아니라 일하는 방식의 변화다. 아래 인용은 전부 실제
          프롬프트이고, 클릭하면 그 세션 원본이 열린다.
        </p>

        <ol className="mt-10 space-y-9 border-l pl-6" style={{ borderColor: "var(--panel-border)" }}>
          {TRAJECTORY.map((t, i) => (
            <li key={`${t.period}-${i}`} className="relative">
              <span
                className="absolute -left-[1.68rem] top-1.5 h-2 w-2 rounded-full"
                style={{ background: "var(--accent-text)" }}
                aria-hidden
              />
              <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{t.period}</p>
              <h3 className="mt-1 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.body}</p>
              {t.evidence && (
                <div className="mt-4">
                  <EvidenceLink archiveRef={t.evidence.ref} quote={t.evidence.quote} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <p
          className="mt-10 rounded-xl border p-5 text-sm leading-relaxed"
          style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)", color: "var(--text-secondary)" }}
        >
          규모 자체가 지표다. 2025년 코스워크 세션은 대개{" "}
          <strong style={{ color: "var(--text-primary)" }}>7~11줄</strong> — 오류 한 줄 붙여넣기였다.
          2026년 에이전트 세션은 <strong style={{ color: "var(--text-primary)" }}>1,800~5,300줄</strong>에 이른다.
          <br />
          <Link
            href="/web?open=identity%2Fai-native-workflow.md"
            className="mt-3 inline-block font-mono text-xs hover:underline"
            style={{ color: "var(--accent-text)" }}
          >
            전체 분석 문서 열기 →
          </Link>
        </p>
      </section>

      <Rule />

      {/* ── method ─────────────────────────────────────────── */}
      <section>
        <SectionLabel>03 — 방법</SectionLabel>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          이 페이지는 어떻게 만들어졌는가
        </h2>

        <ol className="mt-8 space-y-6">
          {[
            {
              n: "1",
              t: "원자료를 넣는다",
              d: "ChatGPT·Claude·Gemini·IDE 어시스턴트의 대화 기록과 프로젝트 파일을 그대로 투입한다. 정리하지 않은 상태로.",
            },
            {
              n: "2",
              t: "소화한다",
              d: "brane이 1,082개 로그를 25개 개념 문서로 압축한다. 모든 문장에 출처 인용이 붙고, 근거가 약한 대목은 '추정'으로 표시된다. 코드 지표는 저장소를 직접 세어 붙인다.",
            },
            {
              n: "3",
              t: "읽는다",
              d: "그 원장 위에서 사람을 읽는 것이 HYRE다. 주장의 층과 증거의 층을 교차 검증한다. 이 포트폴리오가 그 첫 출력물이다.",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="mt-0.5 font-mono text-sm" style={{ color: "var(--accent-text)" }}>{s.n}</span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <p
          className="mt-8 rounded-xl border p-5 text-sm leading-relaxed"
          style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}
        >
          <strong style={{ color: "var(--text-primary)" }}>공개 범위는 골라서 열었다.</strong> 원장에는
          일기와 개인 기록이 함께 들어 있고, 그중 무엇을 누구에게 열지는 기록의 주인이 정한다. 이 사이트에서
          읽히는 것은 25개 중 14개 문서와, 검토를 마친 12개 원본 로그뿐이다. 나머지는 코드 레벨에서 닫혀
          있다 — 전량 공개는 이 작업의 목적이 아니다.
        </p>
      </section>

      <Rule />

      {/* ── contact ────────────────────────────────────────── */}
      <footer>
        <SectionLabel>CONTACT</SectionLabel>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="mailto:kimjaewon.723@gmail.com" className="hover:underline" style={{ color: "var(--text-primary)" }}>
            kimjaewon.723@gmail.com
          </a>
          <a
            href="https://github.com/aintnpc"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            GitHub · aintnpc
          </a>
          <Link href="/web" className="hover:underline" style={{ color: "var(--text-primary)" }}>
            brane · brane.my
          </Link>
        </div>
        <p className="mt-10 text-xs" style={{ color: "var(--text-muted)" }}>
          마지막 갱신 2026-08-27 · 원장 기준 1,082개 로그
        </p>
      </footer>
    </main>
  );
}
