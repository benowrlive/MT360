import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protects all API routes except /api/auth/*.
 * The "/" page itself is intentionally left public so the login screen can
 * render for unauthenticated visitors (client-side gating takes over there).
 *
 * Unauthenticated API calls receive a 401 JSON response instead of a redirect,
 * so client fetch() handlers fail cleanly.
 *
 * Note: Next.js 16 renamed the "middleware" file convention to "proxy".
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Shouldn't reach here given the matcher, but keep "/" accessible.
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  // Match every /api/* route EXCEPT those under /api/auth/*
  matcher: ["/api/((?!auth).*)"],
};
