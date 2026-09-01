#!/usr/bin/env node
// CLI front end for /api/simulate — the RLM loop's driver.
//
// Deliberately a thin fetch client rather than its own runtime: the suite has
// to exercise the exact code path the app runs, and reimplementing module
// loading here is how a harness quietly starts testing a different engine
// than the one that ships.
//
//   node scripts/simulate.mjs                      # default provider, all personas
//   node scripts/simulate.mjs --provider groq      # compare a provider
//   node scripts/simulate.mjs --persona reversal   # one scenario
//   node scripts/simulate.mjs --json > run.json    # machine-readable, for diffing runs

const BASE = process.env.BRANE_LOCAL_ORIGIN ?? "http://localhost:3100";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);

const provider = flag("provider");
const personas = flag("persona") ? [flag("persona")] : undefined;
const asJson = has("json");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

async function main() {
  let meta;
  try {
    meta = await (await fetch(`${BASE}/api/simulate`)).json();
  } catch {
    console.error(`dev 서버에 연결할 수 없습니다 (${BASE}) — 'npm run dev' 먼저 실행하세요.`);
    process.exit(1);
  }
  if (meta.error) {
    console.error(`simulate 엔드포인트 사용 불가: ${meta.error}`);
    process.exit(1);
  }

  if (has("list")) {
    console.log(c.bold("\nproviders"));
    for (const p of meta.providers) {
      console.log(`  ${p.id.padEnd(10)} ${p.label}${p.real ? "" : c.dim("  (stub)")}`);
    }
    console.log(c.bold("\npersonas"));
    for (const p of meta.personas) {
      console.log(`  ${p.id.padEnd(10)} ${p.label}`);
      console.log(`  ${" ".repeat(10)} ${c.dim(p.probes)}`);
    }
    console.log();
    return;
  }

  if (!asJson) {
    console.log(c.dim(`\n실행 중 — provider=${provider ?? "(기본값)"} personas=${personas ?? "all"}\n`));
  }

  const res = await fetch(`${BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, personas }),
  });
  const suite = await res.json();

  if (!res.ok) {
    console.error(suite.detail ?? suite.error ?? "unknown error");
    process.exit(1);
  }

  if (asJson) {
    console.log(JSON.stringify(suite, null, 2));
    return;
  }

  console.log(c.bold(`brane write-path simulation — ${suite.provider}`));
  console.log(c.dim(suite.startedAt));

  for (const r of suite.runs) {
    console.log("");
    console.log(c.bold(`  ${r.personaId}`) + c.dim(` — ${r.label}`));

    if (!r.ok) {
      console.log(`    ${c.red("✗ 실행 실패")} ${r.error}`);
      continue;
    }

    const m = r.metrics;
    const mix = Object.entries(m.judgments)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ") || "—";
    console.log(
      c.dim(
        `    소스 ${m.sources} → 개념 ${m.concepts} | ${mix} | 오판교정 ${m.overrides} | ` +
          `그래프 ${m.graphNodes}노드/${m.graphLinks}엣지(고립 ${m.isolatedNodes})`,
      ),
    );
    console.log(
      c.dim(
        `    콜 ${m.calls} | 입력 ${m.inputTokens.toLocaleString()}tok | ` +
          `출력 ${m.outputTokens.toLocaleString()}tok | ${(m.durationMs / 1000).toFixed(1)}s`,
      ),
    );

    for (const ch of r.checks) {
      const mark = ch.passed ? c.green("✓") : c.red("✗");
      console.log(`    ${mark} ${ch.name} ${c.dim("— " + ch.detail)}`);
    }
    for (const p of r.produced) {
      console.log(c.dim(`      · ${p.relPath}  ${p.chars}자  ${p.title}`));
    }
    for (const q of r.questions) {
      console.log(`      ${c.yellow("?")} ${q.concept} ${c.dim("— " + q.report)}`);
    }
    for (const n of r.notes) {
      console.log(c.dim(`      note: ${n}`));
    }
  }

  const s = suite.summary;
  const allPassed = s.checksPassed === s.checksTotal;
  console.log("");
  console.log(
    c.bold("  총계  ") +
      (allPassed ? c.green(`${s.checksPassed}/${s.checksTotal} 통과`) : c.red(`${s.checksPassed}/${s.checksTotal} 통과`)) +
      c.dim(
        `  |  콜 ${s.totalCalls}  |  입력 ${s.totalInputTokens.toLocaleString()}tok  ` +
          `|  출력 ${s.totalOutputTokens.toLocaleString()}tok  |  ${(s.totalDurationMs / 1000).toFixed(1)}s`,
      ),
  );
  console.log("");
  if (!allPassed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
