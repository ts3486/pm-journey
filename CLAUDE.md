# pm-journey - Project Management Simulation Platform

## Project Overview
A full-stack web application for project management simulation and learning, featuring scenario-based challenges with AI-powered guidance and evaluation.

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **UI**: React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query 5
- **Testing**: Vitest, Testing Library, Playwright (E2E)
- **Validation**: Zod

### Backend
- **Language**: Rust 1.88+
- **Framework**: Axum 0.7
- **API Docs**: utoipa (OpenAPI)
- **Async Runtime**: tokio
- **Logging**: tracing
- **AI Integration**: Mastra agents + Gemini LLM

### Data Storage
- Client-side: localStorage/IndexedDB (default)
- Optional: Axum REST API with HTTPS for multi-device sync

## Project Structure

```
pm-journey/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── config/        # Configuration files
│   │   ├── services/      # API clients, data services
│   │   └── types/         # TypeScript type definitions
│   ├── app/               # Next.js app router pages
│   └── package.json
├── backend/
│   ├── src/               # Rust source code
│   ├── tests/             # Rust tests
│   ├── Cargo.toml
│   └── .env.example
├── specs/                 # Project specifications
├── AGENTS.md              # Auto-generated development guidelines
└── docker-compose.yml
```

## Development Commands

### Frontend
```bash
cd frontend
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run Vitest tests
pnpm e2e          # Run Playwright E2E tests
pnpm lint         # Run ESLint
```

### Backend
```bash
cd backend
cargo build       # Build project
cargo test        # Run tests
cargo clippy      # Run linter
cargo run         # Run server
```

### Docker
```bash
docker-compose up # Start all services
```

## Code Conventions

### TypeScript/React
- Use functional components with hooks
- Follow Next.js App Router conventions
- Use TanStack Query for server state
- Validate data with Zod schemas
- Test with Vitest and Testing Library
- Use Tailwind CSS utility classes

### Rust
- Follow standard Rust conventions
- Use async/await with tokio
- Document public APIs
- Use utoipa for OpenAPI specs
- Use tracing for logging

## Key Features

### Scenario System
- Scenario selection and management
- AI-powered scenario evaluation
- History tracking
- Multi-step challenge flows

### AI Integration
- Mastra agents for intelligent guidance
- Gemini LLM integration
- Real-time feedback and evaluation

## Testing Strategy

### Frontend
- **Unit**: Vitest + Testing Library for components
- **E2E**: Playwright for user flows
- Test files: `*.test.ts`, `*.spec.ts`

### Backend
- **Unit**: Cargo test
- **Integration**: Tests in `tests/` directory
- Test files: `*_test.rs`, `tests/*.rs`

## TDD Workflow

Follow TDD for all new implementations to prevent breaking existing tests.

### Before Starting Any Implementation

1. Run existing tests to establish a baseline:
   ```bash
   cd frontend && pnpm test run    # Unit tests
   cd frontend && pnpm e2e         # E2E tests (for UI/user-facing changes)
   cd backend && cargo test        # Backend tests
   ```
2. For new features, write the failing test(s) first, verify they fail, then implement code to make them pass.

### After Implementation

3. Run all relevant tests and confirm they pass before considering the task done.
4. Add E2E tests for new user-facing flows if none exist.

### Rules (enforce strictly)

- NEVER delete or modify existing tests to make an implementation pass — fix the implementation instead.
- NEVER skip tests with `.skip`, `xit`, `test.only` (unless debugging), or Rust `#[ignore]` to work around failures — fix the root cause.
- If an implementation genuinely requires changing an existing test's expected behavior, explain why and confirm with the user before changing the test.

## API Patterns
- REST API with Axum
- OpenAPI documentation via utoipa
- Type-safe client-server communication
- HTTPS for production sync

## Environment Variables
See `backend/.env.example` for required configuration.

## Skills and Agents
This project is configured to work with Claude Code skills and agents. Custom skills can be added to `.claude/skills/` directory.

## Recent Changes
See AGENTS.md for auto-generated development guidelines and recent feature additions.
