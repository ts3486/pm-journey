# pm-journey Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-18

## Active Technologies
- TypeScript (Next.js 16.1, React 19, Tailwind CSS 4) + Rust 1.75+ (Axum 0.7) + Next.js app router, Tailwind CSS 4, TanStack Query 5, Axios/fetch clients, Vitest/Testing Library/Playwright, Axum + utoipa, tokio, tracing (001-scenario-selection)
- Client-side localStorage/IndexedDB by default; optional Axum REST API with HTTPS for multi-device sync (001-scenario-selection)

- TypeScript (Next.js 14+), Rust 1.75+ (Axum) + Next.js (app router), Tailwind CSS, TanStack Query; Axum + utoipa for API contracts; client persistence via localStorage/IndexedDB (001-pm-simulation-web)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style

TypeScript (Next.js 14+), Rust 1.75+ (Axum): Follow standard conventions

## Recent Changes
- 001-scenario-selection: Added TypeScript (Next.js 16.1, React 19, Tailwind CSS 4) + Rust 1.75+ (Axum 0.7) + Next.js app router, Tailwind CSS 4, TanStack Query 5, Axios/fetch clients, Vitest/Testing Library/Playwright, Axum + utoipa, tokio, tracing

- 001-pm-simulation-web: Added TypeScript (Next.js 14+), Rust 1.75+ (Axum) + Next.js (app router), Tailwind CSS, TanStack Query; Axum + utoipa for API contracts; client persistence via localStorage/IndexedDB

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
