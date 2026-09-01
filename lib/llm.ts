// The seam between brane's engine and whatever model happens to be running it.
//
// brane's thesis is that models are bulk — interchangeable background — and
// the bundle is the only fixed point. Until now that was a claim in a design
// doc while the code imported Anthropic directly in two places. This module
// makes it structural: the engine asks for a completion, and which vendor
// serves it is a runtime choice, including a choice the *visitor* gets to
// make.
//
// Deliberately not an SDK-per-vendor arrangement. Every serious provider now
// speaks the OpenAI chat-completions shape, so one fetch-based adapter covers
// Groq, Gemini (via its OpenAI-compatible endpoint), OpenRouter, Together,
// Cerebras, and a self-hosted vLLM without adding a dependency. Anthropic
// keeps its own path because the personal brane still runs on it.

import Anthropic from "@anthropic-ai/sdk";

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
}

export interface TokenCount {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  usage: TokenCount;
}

export interface Provider {
  id: string;
  /** Shown in the model picker. Vendor + model, since that's what a visitor is choosing between. */
  label: string;
  model: string;
  /** False for the offline stub — the UI shouldn't offer it as a real choice. */
  real: boolean;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

class ProviderError extends Error {
  constructor(
    readonly providerId: string,
    readonly kind: "credit" | "rate_limit" | "auth" | "unavailable" | "unknown",
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Map a raw vendor error into something the caller can act on (degrade, retry, or surface). */
export function classifyError(err: unknown): ProviderError["kind"] {
  if (err instanceof ProviderError) return err.kind;
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  if (msg.includes("credit balance") || msg.includes("insufficient_quota") || msg.includes("quota"))
    return "credit";
  if (msg.includes("rate limit") || msg.includes("rate_limit") || msg.includes("429"))
    return "rate_limit";
  if (msg.includes("authentication") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("api key"))
    return "auth";
  if (msg.includes("overloaded") || msg.includes("503") || msg.includes("502")) return "unavailable";
  return "unknown";
}

export { ProviderError };

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

function anthropicProvider(model: string): Provider {
  return {
    id: "anthropic",
    label: `Claude (${model})`,
    model,
    real: true,
    async complete({ system, user, maxTokens }) {
      const client = new Anthropic(); // reads ANTHROPIC_API_KEY
      let resp: Anthropic.Message;
      try {
        resp = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        });
      } catch (err) {
        throw new ProviderError("anthropic", classifyError(err), String(err));
      }
      return {
        text: resp.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join(""),
        usage: {
          inputTokens: resp.usage.input_tokens,
          outputTokens: resp.usage.output_tokens,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// OpenAI-compatible (Groq, Gemini, OpenRouter, Together, vLLM, ...)
// ---------------------------------------------------------------------------

function openAICompatible(opts: {
  id: string;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}): Provider {
  return {
    id: opts.id,
    label: opts.label,
    model: opts.model,
    real: true,
    async complete({ system, user, maxTokens }) {
      let res: Response;
      try {
        res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            model: opts.model,
            max_tokens: maxTokens,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
        });
      } catch (err) {
        throw new ProviderError(opts.id, "unavailable", `network error: ${String(err)}`);
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          opts.id,
          classifyError(`${res.status} ${body}`),
          `${res.status} ${body.slice(0, 400)}`,
        );
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Offline stub
// ---------------------------------------------------------------------------

// Exists so the whole pipeline — upload, plan, compile, graph, MCP — can be
// exercised end to end with no key and no spend. That is not a convenience:
// when this was written the Anthropic key was out of credit, so without an
// offline path there was no way to tell a plumbing bug from a billing one.
// It answers in the engine's own output formats, never pretending to reason.
function mockProvider(): Provider {
  return {
    id: "mock",
    label: "Offline stub (테스트용)",
    model: "mock",
    real: false,
    async complete({ system, user }) {
      const isPlan = system.includes("write-path planner");
      if (isPlan) {
        const title = (user.match(/SOURCE \(([^)]+)\)/)?.[1] ?? "source").replace(/\.md$/, "");
        // Two concepts, at stable paths across sources: enough to exercise
        // multi-file batching, and to make a later source land on an earlier
        // file so the merge path and the NEW-over-existing safety net both run.
        return {
          text: JSON.stringify([
            {
              title: `Mock concept A from ${title}`,
              judgment: "NEW",
              targetRelPath: "notes/mock-concept-a.md",
              category: "notes",
              reasoning: "offline stub — no model was called",
            },
            {
              title: `Mock concept B from ${title}`,
              judgment: "NEW",
              targetRelPath: "notes/mock-concept-b.md",
              category: "notes",
              reasoning: "offline stub — no model was called",
            },
          ]),
          usage: { inputTokens: 0, outputTokens: 0 },
        };
      }
      const sourceName = user.match(/SOURCE DOCUMENTS?[^\n]*\(([^)]+)\)/)?.[1] ?? "source.md";
      const file = (relPath: string) =>
        [
          "---",
          "type: Concept",
          `title: Mock concept (${relPath})`,
          "description: offline stub output — no model was called",
          "tags: [mock]",
          `timestamp: ${new Date().toISOString().slice(0, 10)}`,
          "---",
          "",
          "# Mock",
          "",
          `이 파일은 오프라인 스텁이 생성했습니다. ^[archive/${sourceName}]`,
        ].join("\n");

      // Honour the multi-file contract when it's asked for. A stub that always
      // replied in single-file shape meant every batched compile silently fell
      // back to per-concept calls — so the batch parser, which is the whole
      // cost saving, was never once exercised by the harness.
      if (system.includes("BRANE_FILE")) {
        const targets = [...user.matchAll(/TARGET PATH:\s*(\S+)/g)].map((m) => m[1]);
        const blocks = (targets.length ? targets : ["notes/mock-concept.md"]).map(
          (t) => `<<<BRANE_FILE: ${t} >>>\n${file(t)}\n<<<BRANE_END>>>`,
        );
        return { text: blocks.join("\n\n"), usage: { inputTokens: 0, outputTokens: 0 } };
      }

      const single = user.match(/TARGET PATH:\s*(\S+)/)?.[1] ?? "notes/mock-concept.md";
      return { text: file(single), usage: { inputTokens: 0, outputTokens: 0 } };
    },
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Providers this deployment can actually reach, cheapest-intent first.
 *
 * Order matters: it's both the visitor-facing menu order and the fallback
 * chain. Anthropic sits last on purpose — the personal brane runs on it, but
 * a public endpoint that bills a metered vendor per visitor is exactly how
 * the credit balance hit zero the first time.
 */
export function listProviders(): Provider[] {
  const out: Provider[] = [];

  if (process.env.GROQ_API_KEY) {
    out.push(
      openAICompatible({
        id: "groq",
        label: `Groq (${process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"})`,
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      }),
    );
  }

  if (process.env.GEMINI_API_KEY) {
    out.push(
      openAICompatible({
        id: "gemini",
        label: `Gemini (${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"})`,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      }),
    );
  }

  // Escape hatch for anything else that speaks the same shape — OpenRouter,
  // Together, Cerebras, a self-hosted vLLM — without another code change.
  if (process.env.OPENAI_COMPAT_BASE_URL && process.env.OPENAI_COMPAT_API_KEY) {
    const model = process.env.OPENAI_COMPAT_MODEL ?? "unknown";
    out.push(
      openAICompatible({
        id: "compat",
        label: process.env.OPENAI_COMPAT_LABEL ?? `Custom (${model})`,
        baseUrl: process.env.OPENAI_COMPAT_BASE_URL,
        apiKey: process.env.OPENAI_COMPAT_API_KEY,
        model,
      }),
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    out.push(anthropicProvider(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5"));
  }

  // Never offered in production: a visitor being silently served canned text
  // by a page claiming to digest their conversations would be a lie, not a
  // fallback.
  if (process.env.NODE_ENV !== "production" || process.env.BRANE_ALLOW_MOCK_LLM === "1") {
    out.push(mockProvider());
  }

  return out;
}

export function getProvider(id?: string | null): Provider {
  const available = listProviders();
  if (available.length === 0) {
    throw new Error(
      "no LLM provider configured — set one of GROQ_API_KEY, GEMINI_API_KEY, " +
        "OPENAI_COMPAT_BASE_URL+OPENAI_COMPAT_API_KEY, or ANTHROPIC_API_KEY",
    );
  }
  if (id) {
    const found = available.find((p) => p.id === id);
    if (found) return found;
  }
  const preferred = process.env.BRANE_LLM_PROVIDER;
  if (preferred) {
    const found = available.find((p) => p.id === preferred);
    if (found) return found;
  }
  return available[0];
}

/** Menu payload for the visitor-facing model picker. */
export function providerMenu(): { id: string; label: string; real: boolean }[] {
  return listProviders().map((p) => ({ id: p.id, label: p.label, real: p.real }));
}
