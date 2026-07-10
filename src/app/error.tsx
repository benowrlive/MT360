"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, LogOut } from "lucide-react";

/**
 * Next.js App Router error boundary.
 * Catches runtime errors in any route segment and shows a recovery UI
 * instead of a white screen. `reset()` re-renders the errored segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server console for debugging (could route to Sentry etc.)
    console.error("App error boundary:", error);
  }, [error]);

  const isAuth = error.message.toLowerCase().includes("unauthorized") || error.message.toLowerCase().includes("session");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {isAuth ? "Session expired" : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAuth
              ? "Your session may have expired. Please sign in again to continue."
              : "An unexpected error occurred. You can try again, or reload the page. If the problem persists, contact support."}
          </p>
        </div>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground/70 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
          {isAuth ? (
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" /> Back to sign in
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Reload page
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
