import type { MetadataRoute } from "next";

// /api/ask bills tokens on every call, so a crawler walking it is a bill, not
// just traffic. The content pages stay indexable; the endpoints don't.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    host: "https://brane.my",
  };
}
