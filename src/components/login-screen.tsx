"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  HeartPulse,
  LogIn,
  Loader2,
  Github,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Glass } from "@/components/ui/glass";

const DEMO_EMAIL = "admin@mindfultherapy360.com";
const DEMO_PASSWORD = "genius123";

// OAuth providers are surfaced via NEXT_PUBLIC flags so the client knows which
// buttons to render without bundling secrets.
const SHOW_GITHUB = process.env.NEXT_PUBLIC_OAUTH_GITHUB === "1";
const SHOW_GOOGLE = process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora backdrop — the colorful content the glass refracts */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-orb aurora-orb--c" />
      </div>

      {/* Foreground — glass panels */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-stretch">
          {/* ── Brand panel (glass) ───────────────────────────────────── */}
          <Glass
            size="lg"
            options={{ scale: -120, chroma: 7, border: 0.06, mapBlur: 14, blur: 4, saturate: 1.6, fallbackBlur: 18 }}
            className="hidden lg:flex flex-col justify-between p-10 text-foreground"
          >
            <div className="flex items-center gap-3">
              <img src="/logo-mark-256.png" alt="Mindful Therapy 360" className="h-20 w-20 rounded-2xl object-contain shrink-0" />
              <div className="leading-tight">
                <div className="text-xl font-bold tracking-tight">Mindful Therapy 360</div>
                <div className="text-xs text-muted-foreground">
                  A Special Education Suite
                </div>
              </div>
            </div>

            <div className="space-y-5 max-w-md py-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                A 360° approach to every child’s growth.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                AI-assisted IEPs, assessments, therapy planning, progress
                monitoring and reporting — uniting psychologists, special
                educators and therapists on one mindful, evidence-based workspace.
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

          {/* ── Login card (glass) ────────────────────────────────────── */}
          <Glass
            size="lg"
            options={{ scale: -96, chroma: 5, border: 0.06, mapBlur: 12, blur: 6, saturate: 1.5, fallbackBlur: 20 }}
            className="flex flex-col justify-center p-7 sm:p-10"
          >
            {/* Mobile brand header (hidden on lg where the brand panel shows) */}
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <img src="/logo-mark-256.png" alt="Mindful Therapy 360" className="h-14 w-14 rounded-xl object-contain shrink-0" />
              <div className="leading-tight">
                <div className="font-bold text-lg">Mindful Therapy 360</div>
                <div className="text-[11px] text-muted-foreground">
                  A Special Education Suite
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Sign in to your special education workspace.
            </p>

            <form onSubmit={handleCredentials} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
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
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
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

            <p className="text-[11px] leading-relaxed text-muted-foreground/80 text-center mt-6">
              Protected health &amp; education data. Authorized users only.
              <br />
              Configure OAuth providers via environment variables.
            </p>
          </Glass>
        </div>
      </div>
    </div>
  );
}
