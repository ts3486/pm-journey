# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.11.0
ARG PNPM_VERSION=9.15.4

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat && corepack enable

FROM base AS deps
ARG PNPM_VERSION
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
COPY . .
RUN pnpm run build

FROM base AS runner
ENV PORT=3000 \
    HOSTNAME="0.0.0.0"
RUN addgroup -S nextjs && adduser -S -G nextjs nextjs
USER nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
