FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build vars (non-secret, baked into static assets)
ARG AUTH_KEYCLOAK_ISSUER
ENV AUTH_KEYCLOAK_ISSUER=$AUTH_KEYCLOAK_ISSUER
RUN pnpm build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S skillvault && adduser -S skillvault -G skillvault

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Migration scripts need tsx + source files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/tsconfig.json ./

# entrypoint runs migrations then starts the app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER skillvault
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
