"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

// bundle files cite sources as `^[archive/2026-07-04-x.md]` or
// `^[archive/a.md, archive/b.md]` for multiple. Convert each ref into a
// markdown link with a `#cite:` pseudo-protocol so our custom `a` renderer
// can intercept the click instead of navigating.
function preprocess(markdown: string): string {
  return markdown.replace(/\^\[([^\]]+)\]/g, (_match, inner: string) => {
    const refs = inner.split(",").map((r) => r.trim());
    // encode the ref — raw refs can contain Korean text, spaces, or literal
    // parens (duplicate-file exports like "life-plan-young-rich (1).md"),
    // any of which can prematurely close the `[text](url)` markdown link
    // syntax and cause every subsequent 📎 in the document to resolve to
    // whatever ref the parser landed on last, instead of its own ref.
    return refs.map((ref) => `[📎](#cite:${encodeURIComponent(ref)})`).join("");
  });
}

export default function MarkdownWithCitations({
  content,
  onCite,
}: {
  content: string;
  onCite: (ref: string) => void;
}) {
  const components: Components = {
    a: ({ href, children, ...props }) => {
      if (href?.startsWith("#cite:")) {
        const ref = decodeURIComponent(href.replace("#cite:", ""));
        return (
          <button
            type="button"
            onClick={() => onCite(ref)}
            className="inline-flex items-center text-xs align-super text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            title={ref}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} {...props} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm">
      <ReactMarkdown components={components}>{preprocess(content)}</ReactMarkdown>
    </div>
  );
}
