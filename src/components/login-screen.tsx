"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  HeartPulse,
  LogIn,
  UserPlus,
  Loader2,
  Github,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Glass } from "@/components/ui/glass";

type Mode = "signin" | "signup" | "forgot" | "reset";

const DEMO_EMAIL = "admin@mindfultherapy360.com";
const DEMO_PASSWORD = "genius123";

const SHOW_GITHUB = process.env.NEXT_PUBLIC_OAUTH_GITHUB === "1";
const SHOW_GOOGLE = process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read the reset token from the URL once (lazy initial state — no effect)
  const resetTokenFromUrl = searchParams.get("reset");

  const [mode, setMode] = useState<Mode>(resetTokenFromUrl ? "reset" : "signin");
  const [resetToken, setResetToken] = useState<string | null>(resetTokenFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // ── Sign in ──────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfoMessage(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }
      toast.success("Welcome to Mindful Therapy 360");
      router.refresh();
      window.location.href = "/";
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  // ── Sign up ──────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfoMessage(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Sign-up failed");
        setLoading(false);
        return;
      }
      // Auto-sign-in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        toast.success("Account created! Please sign in.");
        setMode("signin");
        setLoading(false);
      } else {
        toast.success("Welcome to Mindful Therapy 360");
        router.refresh();
        window.location.href = "/";
      }
    } catch {
      toast.error("Sign-up failed. Please try again.");
      setLoading(false);
    }
  }

  // ── Forgot password ──────────────────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfoMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }
      setInfoMessage(
        "If an account with that email exists, a reset link has been sent. Check your inbox (and spam folder).",
      );
      setLoading(false);
    } catch {
      toast.error("Failed to send reset email");
      setLoading(false);
    }
  }

  // ── Reset password ──────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    setInfoMessage(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Password reset failed");
        setLoading(false);
        return;
      }
      toast.success("Password reset! You can now sign in.");
      setInfoMessage("Your password has been reset successfully. You can now sign in with your new password.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
    } catch {
      toast.error("Password reset failed");
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  // ── Render the right card content based on mode ─────────────────
  const cardContent = () => {
    if (mode === "reset") {
      return (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Enter your new password below.
          </p>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                minLength={6}
                className="bg-background/60 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/60 backdrop-blur-sm"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset password
            </Button>
          </form>
        </>
      );
    }

    if (mode === "forgot") {
      return (
        <>
          <button
            onClick={() => { setMode("signin"); setInfoMessage(null); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>
          <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          {infoMessage ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-background/60 backdrop-blur-sm"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send reset link
              </Button>
            </form>
          )}
          {infoMessage && (
            <button
              onClick={() => { setMode("signin"); setInfoMessage(null); }}
              className="w-full text-center text-sm text-primary hover:underline mt-4"
            >
              Back to sign in
            </button>
          )}
        </>
      );
    }

    if (mode === "signup") {
      return (
        <>
          <button
            onClick={() => setMode("signin")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>
          <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Join Mindful Therapy 360 — your AI-assisted special education workspace.
          </p>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Jane Therapist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="bg-background/60 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/60 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/60 backdrop-blur-sm"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create account
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </>
      );
    }

    // Default: sign in
    return (
      <>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Sign in to your special education workspace.
        </p>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@mindfultherapy360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="bg-background/60 backdrop-blur-sm"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setInfoMessage(null); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/60 backdrop-blur-sm"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </Button>
        </form>
        <button
          type="button"
          onClick={fillDemo}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4"
        >
          Demo login —{" "}
          <span className="font-medium text-foreground">{DEMO_EMAIL}</span> /{" "}
          <span className="font-medium text-foreground">{DEMO_PASSWORD}</span>{" "}
          <span className="underline decoration-dotted">click to fill</span>
        </button>
        {(SHOW_GITHUB || SHOW_GOOGLE) && (
          <>
            <div className="relative my-5">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/70 backdrop-blur px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SHOW_GITHUB && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 bg-background/40 backdrop-blur-sm"
                  onClick={() => signIn("github", { callbackUrl: "/" })}
                >
                  <Github className="h-4 w-4" /> GitHub
                </Button>
              )}
              {SHOW_GOOGLE && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 bg-background/40 backdrop-blur-sm"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                >
                  <Mail className="h-4 w-4" /> Google
                </Button>
              )}
            </div>
          </>
        )}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => setMode("signup")}
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </button>
        </p>
      </>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora backdrop */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-orb aurora-orb--c" />
      </div>

      {/* Foreground — glass panels */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-stretch">
          {/* Brand panel (unchanged) */}
          <Glass
            size="lg"
            options={{ scale: -120, chroma: 7, border: 0.06, mapBlur: 14, blur: 4, saturate: 1.6, fallbackBlur: 18 }}
            className="hidden lg:flex flex-col justify-between p-10 text-foreground"
          >
            <div className="flex items-center gap-3">
              <img src="/logo-mark-256.png" alt="Mindful Therapy 360" className="h-20 w-20 rounded-2xl object-contain shrink-0" />
              <div className="leading-tight">
                <div className="text-xl font-bold tracking-tight">Mindful Therapy 360</div>
                <div className="text-xs text-muted-foreground">A Special Education Suite</div>
              </div>
            </div>
            <div className="space-y-5 max-w-md py-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                A 360° approach to every child&rsquo;s growth.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                AI-assisted IEPs, assessments, therapy planning, progress monitoring and reporting — uniting psychologists, special educators and therapists on one mindful, evidence-based workspace.
              </p>
              <ul className="space-y-2.5 text-sm">
                {[
                  "SMART goal generator across 19 domains",
                  "AI assessment summaries & report writer",
                  "Curriculum-aligned (IB, Cambridge, CBSE, more)",
                  "Progress charts, behaviour plans & lesson planner",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              AI assists — never replaces — the professional of record.
            </div>
          </Glass>

          {/* Auth card — content swaps based on mode */}
          <Glass
            size="lg"
            options={{ scale: -96, chroma: 5, border: 0.06, mapBlur: 12, blur: 6, saturate: 1.5, fallbackBlur: 20 }}
            className="flex flex-col justify-center p-7 sm:p-10"
          >
            {/* Mobile brand header */}
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <img src="/logo-mark-256.png" alt="Mindful Therapy 360" className="h-14 w-14 rounded-xl object-contain shrink-0" />
              <div className="leading-tight">
                <div className="font-bold text-lg">Mindful Therapy 360</div>
                <div className="text-[11px] text-muted-foreground">A Special Education Suite</div>
              </div>
            </div>

            {cardContent()}

            <p className="text-[11px] leading-relaxed text-muted-foreground/80 text-center mt-6">
              Protected health &amp; education data. Authorized users only.
            </p>
          </Glass>
        </div>
      </div>
    </div>
  );
}
