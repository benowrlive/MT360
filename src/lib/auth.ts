import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import bcrypt from "bcryptjs";

// Demo admin credentials (fallback when no DB users exist yet — first signup
// or the demo admin). Override via env.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mindfultherapy360.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "genius123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Mindful Therapy 360 Administrator";

function envSet(...vals: (string | undefined)[]): boolean {
  return vals.every((v) => !!v && v.trim().length > 0);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();

        // 1. Try DB user lookup (real registered users)
        try {
          const user = await db.user.findUnique({ where: { email } });
          if (user && user.passwordHash) {
            const ok = await bcrypt.compare(credentials.password, user.passwordHash);
            if (ok) {
              return { id: user.id, email: user.email, name: user.name };
            }
            return null; // wrong password — don't fall through to demo admin
          }
        } catch {
          // DB not connected yet — fall through to demo admin
        }

        // 2. Fallback: demo admin from env (backward compat, first-run)
        if (
          email === ADMIN_EMAIL.toLowerCase() &&
          credentials.password === ADMIN_PASSWORD
        ) {
          return { id: "admin", email: ADMIN_EMAIL, name: ADMIN_NAME };
        }
        return null;
      },
    }),
    ...(envSet(process.env.GITHUB_ID, process.env.GITHUB_SECRET)
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
    ...(envSet(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session) {
        session.user = {
          ...(session.user ?? {}),
          email: token.email ?? session.user?.email ?? "",
          name: token.name ?? session.user?.name ?? "User",
        };
      }
      return session;
    },
  },
};

export const ENABLED_OAUTH = {
  github: envSet(process.env.NEXT_PUBLIC_OAUTH_GITHUB),
  google: envSet(process.env.NEXT_PUBLIC_OAUTH_GOOGLE),
};
