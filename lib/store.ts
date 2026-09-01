// Where a visitor's brane lives between the moment it's built and the moment
// their other AI asks for it.
//
// This is the concession the MCP story forces. "We store nothing" was a clean
// promise and a cheap implementation, but it cannot survive the demo that
// matters: talk to Claude today, have ChatGPT read the same brane tomorrow.
// Something has to persist, so the honest claim shifts from absence to
// ownership — you can take the whole thing, and you can destroy the whole
// thing, at any time.
//
// Consequences of that shift, all deliberate:
//   - the token IS the credential. No accounts, no passwords, no login wall
//     between a curious visitor and a working brane.
//   - an email address is optional and single-purpose: getting the link back.
//     It is never required to use the product.
//   - everything expires on its own. A demo that quietly accumulates
//     strangers' private conversations forever is a liability, not a feature.

import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface StoredConcept {
  relPath: string;
  raw: string;
}

export interface StoredSource {
  name: string;
  text: string;
}

export interface BraneSnapshot {
  token: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  /** Present only if the visitor asked for a recovery link. */
  email?: string;
  /** Free-text name so a person with two branes can tell them apart. */
  label: string;
  provider: string;
  concepts: StoredConcept[];
  /** Kept so `^[archive/...]` citations resolve — a bundle whose evidence is gone is just assertions. */
  sources: StoredSource[];
}

export interface Store {
  put(snapshot: BraneSnapshot): Promise<void>;
  get(token: string): Promise<BraneSnapshot | null>;
  remove(token: string): Promise<void>;
  /** Tokens registered to an email, for the recovery link. */
  tokensForEmail(email: string): Promise<string[]>;
}

export const RETENTION_DAYS = 30;

/** Archive text kept per brane. Enough for citations to resolve; not an invitation to upload a corpus. */
const MAX_SOURCE_CHARS = 400_000;

export function newToken(): string {
  // 32 bytes of CSPRNG output. This is the only thing standing between a
  // stranger and someone's brane, so it is not a short id, and it is never
  // derived from anything guessable like an email or a timestamp.
  return crypto.randomBytes(32).toString("base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function expiryFrom(created: Date): string {
  const d = new Date(created);
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d.toISOString();
}

export function isExpired(s: BraneSnapshot): boolean {
  return new Date(s.expiresAt).getTime() < Date.now();
}

/** Trim a snapshot to the storage caps before it's written. */
export function capSnapshot(s: BraneSnapshot): BraneSnapshot {
  let budget = MAX_SOURCE_CHARS;
  const sources: StoredSource[] = [];
  for (const src of s.sources) {
    if (budget <= 0) break;
    const text = src.text.length > budget ? src.text.slice(0, budget) : src.text;
    budget -= text.length;
    sources.push({ name: src.name, text });
  }
  return { ...s, sources };
}

// ---------------------------------------------------------------------------
// Filesystem store — local development
// ---------------------------------------------------------------------------

function fsStore(root: string): Store {
  const dir = path.join(root, "branes");
  const emailDir = path.join(root, "emails");

  const ensure = () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(emailDir, { recursive: true });
  };
  // Tokens are base64url, so they're filename-safe, but a caller-supplied
  // string must never be trusted to stay inside the directory.
  const fileFor = (token: string) => {
    const safe = crypto.createHash("sha256").update(token).digest("hex");
    return path.join(dir, `${safe}.json`);
  };
  const emailFile = (email: string) => {
    const safe = crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex");
    return path.join(emailDir, `${safe}.json`);
  };

  return {
    async put(snapshot) {
      ensure();
      fs.writeFileSync(fileFor(snapshot.token), JSON.stringify(snapshot), "utf-8");
      if (snapshot.email) {
        const f = emailFile(snapshot.email);
        const existing: string[] = fs.existsSync(f)
          ? JSON.parse(fs.readFileSync(f, "utf-8"))
          : [];
        if (!existing.includes(snapshot.token)) existing.push(snapshot.token);
        fs.writeFileSync(f, JSON.stringify(existing), "utf-8");
      }
    },
    async get(token) {
      const f = fileFor(token);
      if (!fs.existsSync(f)) return null;
      const snapshot = JSON.parse(fs.readFileSync(f, "utf-8")) as BraneSnapshot;
      if (isExpired(snapshot)) {
        fs.rmSync(f, { force: true });
        return null;
      }
      return snapshot;
    },
    async remove(token) {
      fs.rmSync(fileFor(token), { force: true });
    },
    async tokensForEmail(email) {
      const f = emailFile(email);
      if (!fs.existsSync(f)) return [];
      return JSON.parse(fs.readFileSync(f, "utf-8")) as string[];
    },
  };
}

// ---------------------------------------------------------------------------
// Upstash Redis over REST — deployed
// ---------------------------------------------------------------------------

// REST rather than a client library on purpose: it's one fetch per operation,
// it works unchanged on Vercel's serverless runtime and on Cloudflare Workers,
// and it keeps the dependency list at zero. TTL is enforced by the store
// itself, so an expired brane is unreachable even if a cleanup job never runs.
function upstashStore(url: string, token: string): Store {
  const call = async (cmd: (string | number)[]): Promise<unknown> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
    });
    if (!res.ok) throw new Error(`store error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return ((await res.json()) as { result?: unknown }).result;
  };

  const key = (t: string) => `brane:snapshot:${t}`;
  const emailKey = (e: string) => `brane:email:${normalizeEmail(e)}`;
  const ttlSeconds = RETENTION_DAYS * 24 * 60 * 60;

  return {
    async put(snapshot) {
      await call(["SET", key(snapshot.token), JSON.stringify(snapshot), "EX", ttlSeconds]);
      if (snapshot.email) {
        await call(["SADD", emailKey(snapshot.email), snapshot.token]);
        await call(["EXPIRE", emailKey(snapshot.email), ttlSeconds]);
      }
    },
    async get(t) {
      const raw = (await call(["GET", key(t)])) as string | null;
      if (!raw) return null;
      const snapshot = JSON.parse(raw) as BraneSnapshot;
      return isExpired(snapshot) ? null : snapshot;
    },
    async remove(t) {
      await call(["DEL", key(t)]);
    },
    async tokensForEmail(email) {
      const members = (await call(["SMEMBERS", emailKey(email)])) as string[] | null;
      return members ?? [];
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    cached = upstashStore(url, token);
    return cached;
  }
  if (process.env.NODE_ENV === "production") {
    // Failing loudly beats a deployed page that cheerfully hands out MCP
    // links to branes that evaporate on the next cold start.
    throw new Error(
      "no visitor store configured — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
    );
  }
  cached = fsStore(path.join(process.cwd(), ".brane-visitors"));
  return cached;
}
