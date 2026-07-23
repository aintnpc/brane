import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes read bundle/archive via fs.readFileSync with a path built at
  // runtime (BRANE_DATA_DIR + a query param) — Next's build-time file tracer
  // can't statically see those reads, so without this, serverless functions
  // ship with an incomplete (or empty) copy of data/, and previously-working
  // files can silently start 404ing after any redeploy depending on what the
  // tracer happened to catch. Force the whole data dir into every function.
  outputFileTracingIncludes: {
    "/api/**": ["./data/bundle/**", "./data/archive/**"],
  },
};

export default nextConfig;
