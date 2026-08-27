import Link from "next/link";
import type { Metadata } from "next";
import { PROJECTS, TRAJECTORY, TIMELINE, STACK, EDUCATION, MARKS, CODE_TOTAL } from "@/lib/portfolio";
import { CASES } from "@/lib/cases";
import EvidenceLink from "@/components/EvidenceLink";

export const metadata: Metadata = {
  title: "Jaewon Kim — Portfolio",
  description: "앱·백오피스·결제·인프라를 혼자 만든다. 판단이 필요했던 네 건과, 그 판단이 만들어진 과정.",
};

const LINK_DOT: Record<string, string> = { live: "#22c55e", repo: "#a78bfa", gone: "#71717a" };
const ANCHORS = ["clozet", "pegasus", "share2dm", "green-apple"];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
      {children}
    </p>
  );
}

function Links({ items }: { items?: { label: string; href?: string; kind: string; note?: string }[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((l) => {
        const inner = (
          <>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: LINK_DOT[l.kind] }} aria-hidden />
            <span>{l.label}</span>
            {l.note && <span style={{ color: "var(--text-muted)" }}>({l.note})</span>}
          </>
        );
        const cls = "flex items-center gap-1.5 font-mono text-[0.65rem]";
        return l.href ? (
          <a key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
             className={`${cls} hover:underline`} style={{ color: "var(--text-primary)" }}>{inner}</a>
        ) : (
          <span key={l.label} className={cls} style={{ color: "var(--text-muted)" }}>{inner}</span>
        );
      })}
    </div>
  );
}

function Shots({ shots }: { shots?: { src: string; alt: string; caption: string }[] }) {
  if (!shots?.length) return null;
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {shots.map((s) => (
        <figure key={s.src}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={s.alt} loading="lazy"
               className="h-36 w-full rounded-lg border object-contain p-1.5 sm:h-40"
               style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }} />
          <figcaption className="mt-1.5 text-[0.65rem] leading-snug" style={{ color: "var(--text-muted)" }}>
            {s.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-8 sm:py-20" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <nav className="mb-14 flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:underline">← 처음</Link>
        <Link href="/web" className="hover:underline">brane 열기</Link>
      </nav>

      {/* ── hero ─────────────────────────────────────────── */}
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
          김재원
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Jaewon Kim · {EDUCATION.school} {EDUCATION.major} ({EDUCATION.status})
        </p>

        <p className="mt-9 text-xl leading-relaxed sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          앱, 백오피스, 결제, 인프라까지 혼자 만든다.
          <br />
          2022년부터 {CODE_TOTAL.lines.toLocaleString()}줄.
        </p>
        <p className="mt-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          아래 네 건은 그중 판단이 필요했던 문제다. 정산이 195만원 어긋난 이유를 역추적한 기록,
          eVTOL 형상이 물리적으로 불가능하다는 걸 유도해 스스로 접은 기록, 남이 정한 rate limit 위에서
          멀티테넌트 큐를 돌린 기록, 그리고 잘 만들어놓고 팔지 못한 기록. 마지막 건이 지금 고치고
          있는 문제다.
        </p>
      </header>

      {/* ── marks ────────────────────────────────────────── */}
      <ul className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-6">
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

      {/* ── case studies ─────────────────────────────────── */}
      <section className="mt-20">
        <Kicker>선택 작업</Kicker>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          판단이 필요했던 세 건
        </h2>

        <div className="mt-14 space-y-24">
          {CASES.map((c, i) => (
            <article key={c.project} id={ANCHORS[i]} className="scroll-mt-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: "var(--panel-border)",
                    background: c.mark ? "#ffffff" : "#111114",
                  }}
                >
                  {c.mark ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.mark} alt="" className="max-h-5 max-w-5 object-contain" />
                  ) : (
                    <span className="font-mono text-[0.6rem] font-semibold" style={{ color: "#e4e4e7" }}>
                      {c.project.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs tracking-wider" style={{ color: "var(--accent-text)" }}>
                  {c.project.toUpperCase()}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-semibold leading-snug tracking-tight" style={{ color: "var(--text-primary)" }}>
                {c.title}
              </h3>
              <p className="mt-2 font-mono text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{c.period}</p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.stakes}</p>

              <div className="mt-8 space-y-7">
                {c.sections.map((s) => (
                  <div key={s.h} className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-5">
                    <h4 className="pt-0.5 font-mono text-xs leading-relaxed" style={{ color: "var(--accent-text)" }}>{s.h}</h4>
                    <div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.p}</p>
                      {s.code && (
                        <pre
                          className="mt-3 overflow-x-auto rounded-lg border px-4 py-3 font-mono text-[0.7rem] leading-relaxed"
                          style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)", color: "var(--text-primary)" }}
                        >
                          {s.code}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-l-2 py-1 pl-5" style={{ borderColor: "var(--accent-text)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.capability}</p>
              </div>

              <div
                className="mt-6 rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }}
              >
                <p className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                  {c.code.lines.toLocaleString()}줄 · {c.code.files}개 파일
                  {c.code.commits ? ` · 커밋 ${c.code.commits}` : ""}
                </p>
                <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {c.code.breakdown}
                </p>
              </div>

              <Shots shots={c.shots} />
              <Links items={c.links} />

              <Link
                href={`/web?open=${encodeURIComponent(c.source)}`}
                className="mt-4 inline-block font-mono text-[0.65rem] hover:underline"
                style={{ color: "var(--accent-text)" }}
              >
                원장에서 열기 →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <hr className="my-20" style={{ borderColor: "var(--panel-border)" }} />

      {/* ── index ────────────────────────────────────────── */}
      <section id="others" className="scroll-mt-8">
        <Kicker>그 외</Kicker>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          나머지 작업
        </h2>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          만료된 것과 파킹된 것을 그대로 적었다. 상태는 원장에 기록된 문장이고 좋게 고쳐 쓰지 않았다.
        </p>

        <ol className="mt-10 divide-y" style={{ borderColor: "var(--panel-border)" }}>
          {PROJECTS.map((p) => (
            <li key={p.name} className="py-7 first:pt-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{p.year}</span>
              </div>
              <p className="mt-1.5 text-sm" style={{ color: "var(--text-primary)" }}>{p.oneLiner}</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.detail}</p>
              <p className="mt-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent-text)" }}>{p.role}</span> · {p.status}
                {p.code ? ` · ${p.code.lines.toLocaleString()}줄` : ""}
              </p>
              <Links items={p.links} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.stack.map((s) => (
                  <span key={s} className="rounded border px-2 py-0.5 font-mono text-[0.65rem]"
                        style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}>{s}</span>
                ))}
                {p.source && (
                  <Link href={`/web?open=${encodeURIComponent(p.source)}`}
                        className="ml-1 font-mono text-[0.65rem] hover:underline" style={{ color: "var(--accent-text)" }}>
                    원장에서 열기 →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

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
