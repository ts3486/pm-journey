# pm-journey Frontend Workspace

This directory now uses a pnpm workspace to host both the legacy Next.js application and the new React SPA that will replace it.

## Structure

- `apps/next-legacy` – current production Next.js App Router experience (reference during migration).
- `apps/app` – Vite-powered React SPA (work in progress).
- `packages/*` – shared UI primitives, hooks, and types consumed by both apps.

## Commands

Run all commands from this directory:

```bash
pnpm install            # install workspace deps
pnpm dev:next           # legacy Next.js app
pnpm dev:app            # new React SPA
pnpm build:next         # build legacy app
pnpm build:app          # build SPA
pnpm lint && pnpm test  # run workspace lint/tests
```
