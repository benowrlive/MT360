# ─── Mindful Therapy 360 — production Docker image ───────────────────
# Multi-stage build using Bun + Next.js standalone output.
# Works with SQLite (mounted volume) or Postgres (env override).

# ── Stage 1: deps ──────────────────────────────────────────────────
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock* yarn.lock* package-lock.json* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile || bun install

# ── Stage 2: build ─────────────────────────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client for the target platform (linux x64/musl)
RUN bunx prisma generate
# Build Next.js (standalone output is set in next.config.ts)
RUN bun run build
# Standalone server doesn't include the prisma schema or db dir; copy them
RUN mkdir -p .next/standalone/db && \
    cp prisma/schema.prisma .next/standalone/prisma/schema.prisma 2>/dev/null || true

# ── Stage 3: runtime ───────────────────────────────────────────────
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Default to SQLite in a mounted volume; override DATABASE_URL for Postgres
ENV DATABASE_URL=file:./db/custom.db

# Install openssl (needed by Prisma engine) and a shell
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy standalone server + static assets + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy prisma schema + client so `prisma db push` works at startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Persistent volume for SQLite (ignored if you use Postgres)
RUN mkdir -p /app/db
VOLUME ["/app/db"]

EXPOSE 3000

# Entrypoint: apply schema then start
CMD ["sh", "-c", "bunx prisma db push --skip-generate && bun server.js"]
