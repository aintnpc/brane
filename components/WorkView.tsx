"use client";

import { useState } from "react";
import Link from "next/link";
import type { CVEntry } from "@/lib/cv";
import type { CaseStudy } from "@/lib/cases";

// Two readings of the same record.
//
// Default is the résumé: every project stated the same way, so a stranger learns
// what these things *are* before being asked to judge how they were built. The
// deep view is the same work seen from a product/engineering-judgment angle —
// useful, but incomprehensible to someone who doesn't yet know what Clozet was.
//
// The toggle picks a depth, not an audience. Nothing is rewritten between the
// two; the case studies just have room to say more about three of the entries.

const LINK_DOT: Record<string, string> = { live: "#22c55e", repo: "#a78bfa", gone: "#71717a" };

type LinkItem = { label: string; href?: string; kind: string; note?: string };

function Links({ items }: { items?: LinkItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
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
          <a key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined}
             rel="noreferrer" className={`${cls} hover:underline`} style={{ color: "var(--text-primary)" }}>{inner}</a>
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
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function LedgerLink({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <Link href={`/web?open=${encodeURIComponent(source)}`}
          className="mt-4 inline-block font-mono text-[0.65rem] hover:underline"
          style={{ color: "var(--accent-text)" }}>
      원장에서 열기 →
    </Link>
  );
}

function CVList({ entries }: { entries: CVEntry[] }) {
  return (
    <ol className="mt-12 space-y-16">
      {entries.map((e) => (
        <li key={e.name}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{e.name}</h3>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{e.period}</span>
          </div>

          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{e.summary}</p>

          <dl className="mt-5 space-y-4">
            <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <dt className="pt-0.5 font-mono text-xs" style={{ color: "var(--accent-text)" }}>담당</dt>
              <dd className="text-sm" style={{ color: "var(--text-secondary)" }}>{e.role}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <dt className="pt-0.5 font-mono text-xs" style={{ color: "var(--accent-text)" }}>주요 작업</dt>
              <dd>
                <ul className="space-y-1.5">
                  {e.work.map((w) => (
                    <li key={w} className="flex gap-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span aria-hidden style={{ color: "var(--text-muted)" }}>·</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <dt className="pt-0.5 font-mono text-xs" style={{ color: "var(--accent-text)" }}>결과</dt>
              <dd className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {e.outcome}
                {e.scale && (
                  <span className="mt-1.5 block font-mono text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                    {e.scale}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <Shots shots={e.shots} />
          <Links items={e.links} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {e.stack.map((s) => (
              <span key={s} className="rounded border px-2 py-0.5 font-mono text-[0.65rem]"
                    style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}>{s}</span>
            ))}
          </div>
          <LedgerLink source={e.source} />
        </li>
      ))}
    </ol>
  );
}

const ANCHORS = ["clozet", "share2dm", "green-apple"];

function CaseList({ cases }: { cases: CaseStudy[] }) {
  return (
    <div className="mt-12 space-y-24">
      {cases.map((c, i) => (
        <article key={c.project} id={ANCHORS[i]} className="scroll-mt-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: "var(--panel-border)", background: c.mark ? "#ffffff" : "#111114" }}>
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
                    <pre className="mt-3 overflow-x-auto rounded-lg border px-4 py-3 font-mono text-[0.7rem] leading-relaxed"
                         style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)", color: "var(--text-primary)" }}>
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

          <Shots shots={c.shots} />
          <Links items={c.links} />
          <LedgerLink source={c.source} />
        </article>
      ))}
    </div>
  );
}

export default function WorkView({ cv, cases }: { cv: CVEntry[]; cases: CaseStudy[] }) {
  const [deep, setDeep] = useState(false);

  return (
    <section id="work" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: "var(--accent-text)" }}>
            {deep ? "PM · PO 심층" : "프로젝트"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {deep ? "판단이 필요했던 세 건" : "무엇을 만들었고 무엇을 했는가"}
          </h2>
        </div>

        <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--panel-border)" }}>
          {[
            { label: "전체 이력", on: false },
            { label: "PM · PO 심층", on: true },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setDeep(t.on)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={
                deep === t.on
                  ? { background: "var(--accent-text)", color: "#0b0b0e", fontWeight: 500 }
                  : { color: "var(--text-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {deep
          ? "세 건을 골라 문제·원인·판단 순으로 적었다. 상태 표기는 원장 기록 그대로이고 좋게 고쳐 쓰지 않았다."
          : "만료된 것과 중단된 것을 그대로 적었다. 각 항목의 규모는 저장소를 직접 세었고 vendored 코드는 제외했다."}
      </p>

      {deep ? <CaseList cases={cases} /> : <CVList entries={cv} />}
    </section>
  );
}
