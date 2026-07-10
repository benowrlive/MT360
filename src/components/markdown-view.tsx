"use client";

import * as React from "react";

/**
 * Lightweight, dependency-free Markdown renderer.
 * Supports: #/##/### headings, bullet & numbered lists, blockquotes,
 * horizontal rules, GitHub-flavoured tables, inline `code`, **bold**, *italic*,
 * and paragraphs. Not a full Markdown engine, but enough for AI-generated
 * reports and progress summaries which follow a predictable structure.
 */
export function MarkdownView({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);
  return (
    <div className={className}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Block parser                                                        */
/* ------------------------------------------------------------------ */

type MdBlock =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "hr" }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "p"; text: string };

function parseBlocks(src: string): MdBlock[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: MdBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw ?? "";
    const trimmed = line.trim();

    // blank line
    if (trimmed === "") {
      i++;
      continue;
    }

    // horizontal rule
    if (/^---+\s*$/.test(trimmed) || /^\*\*\*+\s*$/.test(trimmed)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }

    // heading
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4;
      out.push({ kind: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(trimmed)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test((lines[i] ?? "").trim())) {
        buf.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    // table: header + separator
    if (
      /^\|.*\|\s*$/.test(trimmed) &&
      i + 1 < lines.length &&
      /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(
        (lines[i + 1] ?? "").trim(),
      )
    ) {
      const header = splitRow(trimmed);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test((lines[i] ?? "").trim())) {
        rows.push(splitRow((lines[i] ?? "").trim()));
        i++;
      }
      out.push({ kind: "table", header, rows });
      continue;
    }

    // unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      out.push({ kind: "ol", items });
      continue;
    }

    // paragraph: collect until blank line or block starter
    const buf: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (
        next === "" ||
        /^(#{1,4})\s+/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        /^>\s?/.test(next) ||
        /^---+\s*$/.test(next) ||
        /^\|.*\|\s*$/.test(next)
      ) {
        break;
      }
      buf.push(lines[i] ?? "");
      i++;
    }
    out.push({ kind: "p", text: buf.join(" ").trim() });
  }
  return out;
}

function splitRow(line: string): string[] {
  const inner = line.replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((c) => c.trim());
}

/* ------------------------------------------------------------------ */
/* Inline renderer (bold / italic / code)                              */
/* ------------------------------------------------------------------ */

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // regex captures `code`, **bold**, *italic*
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ------------------------------------------------------------------ */
/* Block renderer                                                      */
/* ------------------------------------------------------------------ */

function BlockView({ block }: { block: MdBlock }) {
  switch (block.kind) {
    case "heading": {
      const cls =
        block.level === 1
          ? "mt-5 mb-2 text-xl font-bold tracking-tight text-foreground"
          : block.level === 2
            ? "mt-5 mb-2 text-lg font-semibold tracking-tight text-foreground"
            : block.level === 3
              ? "mt-4 mb-1.5 text-base font-semibold text-foreground"
              : "mt-3 mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground";
      const Tag = (`h${block.level}` as "h1" | "h2" | "h3" | "h4");
      return <Tag className={cls}>{renderInline(block.text)}</Tag>;
    }
    case "p":
      return (
        <p className="mb-2.5 text-sm leading-relaxed text-foreground/90">
          {renderInline(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-2.5 ml-5 list-disc space-y-1 text-sm leading-relaxed text-foreground/90 marker:text-primary">
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mb-2.5 ml-5 list-decimal space-y-1 text-sm leading-relaxed text-foreground/90 marker:text-primary marker:font-semibold">
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="my-3 border-l-2 border-primary/60 bg-primary/5 px-3 py-2 text-sm italic text-foreground/90">
          {renderInline(block.text)}
        </blockquote>
      );
    case "hr":
      return <hr className="my-4 border-border" />;
    case "table":
      return (
        <div className="my-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60">
              <tr>
                {block.header.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-border px-3 py-2 font-semibold text-foreground"
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="odd:bg-background even:bg-muted/30">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border-b border-border/60 px-3 py-2 align-top text-foreground/90"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
