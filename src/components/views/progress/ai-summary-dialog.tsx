"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { MarkdownView } from "@/components/markdown-view";

import type { AISummaryDialogProps } from "./types";

/* ------------------------------------------------------------------ */
/* AISummaryDialog                                                     */
/* ------------------------------------------------------------------ */

/**
 * "AI Progress Summary" dialog. On open (and once per student), POSTs
 * to `/api/ai/progress-summary` and renders the returned Markdown via
 * `<MarkdownView>`. Provides Regenerate + Copy buttons.
 *
 * Behaviour is identical to the previous in-file `SummaryDialog`:
 *   - fetches once per student (cached by `fetchedFor`).
 *   - Regenerate clears the cache so the effect re-fetches.
 *   - Copy writes the summary to the clipboard with a Sonner toast.
 */
export function AISummaryDialog({
  open,
  onOpenChange,
  studentId,
}: AISummaryDialogProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  // Fetch on open (only once per student)
  useEffect(() => {
    if (!open || !studentId) return;
    if (fetchedFor === studentId && summary) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/ai/progress-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to generate summary");
        }
        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary ?? "");
          setFetchedFor(studentId);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to generate summary");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, studentId, fetchedFor, summary]);

  function copySummary() {
    navigator.clipboard.writeText(summary).then(
      () => toast.success("Summary copied to clipboard"),
      () => toast.error("Could not copy to clipboard"),
    );
  }

  function regenerate() {
    setFetchedFor(null);
    setSummary("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Progress Summary
          </DialogTitle>
          <DialogDescription>
            Evidence-based overview generated from recent progress records and goals.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto iep-scroll rounded-lg border border-border bg-muted/20 p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing progress data…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={regenerate}>
                Try again
              </Button>
            </div>
          ) : (
            <MarkdownView
              content={summary}
              className="text-sm leading-relaxed"
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={regenerate}
            disabled={loading}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={copySummary}
            disabled={loading || !summary}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
