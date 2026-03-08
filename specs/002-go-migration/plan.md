# Go Migration Plan for pm-journey Backend

**Input**: Current Rust/Axum backend in `/backend/`
**Target**: New Go backend in `/backend-go/`
**Strategy**: Parallel implementation, side-by-side validation, then cutover

---

## Current State Summary

The Rust/Axum backend is a multi-tenant SaaS with:

- **17 feature modules**: scenarios, sessions, messages, evaluations, comments, outputs, organizations, users, entitlements, credits, billing, imports, health, product_config, test_cases, feature_flags
- **Layered architecture**: Handlers -> Services -> Repositories
- **PostgreSQL** with sqlx migrations (12 migration files)
- **Auth0 JWT** authentication with JWKS validation
- **Stripe** billing, **Resend** email, **Gemini** AI integration
- **OpenAPI** documentation via utoipa + Swagger UI
- **RBAC**: Owner, Admin, Manager, Reviewer roles with per-resource authorization

---

## Recommended Go Stack

### Core Libraries

| Concern | Library | Rationale |
|---------|---------|-----------|
| **HTTP Router** | [chi](https://github.com/go-chi/chi) v5 | Lightweight, idiomatic, stdlib `net/http` compatible. Middleware-first design matches current layered architecture. |
| **Database** | [sqlx](https://github.com/jmoiron/sqlx) | Extends `database/sql` with struct scanning. Mirrors current Rust sqlx usage. |
| **Migrations** | [goose](https://github.com/pressly/goose) | SQL-based migrations. Existing `.sql` files can be reused with minimal changes. |
| **Validation** | [validator](https://github.com/go-playground/validator) v10 | Struct tag validation for request payloads. |
| **OpenAPI** | [swaggo/swag](https://github.com/swaggo/swag) | Comment-based OpenAPI generation. Closest to utoipa's derive-macro approach. |
| **JWT/Auth** | [golang-jwt/jwt](https://github.com/golang-jwt/jwt) v5 + [keyfunc](https://github.com/MicahParks/keyfunc) | JWT validation with JWKS fetching from Auth0. |
| **Config** | [envconfig](https://github.com/kelseyhightower/envconfig) | Simple env-only config. Matches current `.env` pattern. |
| **Logging** | [slog](https://pkg.go.dev/log/slog) (stdlib) | Go 1.21+ structured logging. No external dep needed. Replaces tracing. |
| **Stripe** | [stripe-go](https://github.com/stripe/stripe-go) v81 | Official Stripe SDK. |
| **Testing** | stdlib `testing` + [testify](https://github.com/stretchr/testify) | Assertions, require, test suites. |

### Why chi?

| Alternative | Verdict |
|-------------|---------|
| **chi** | Best fit -- idiomatic, middleware-first, stdlib-compatible, great for layered architectures |
| **Gin** | Popular but uses custom `Context` type that deviates from stdlib |
| **Echo** | Good but less ecosystem adoption than chi |
| **stdlib only** (Go 1.22+ enhanced mux) | Viable but requires rebuilding middleware, route groups manually |
| **Connect/gRPC** | Overkill -- frontend speaks REST/JSON |

---

## Project Structure

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go                # Entry point, dependency wiring
├── internal/
│   ├── config/
│   │   └── config.go              # Env vars -> typed Config struct
│   ├── middleware/
│   │   ├── auth.go                # JWT validation, Auth0 JWKS
│   │   ├── telemetry.go           # Request logging (slog)
│   │   └── cors.go                # CORS configuration
│   ├── domain/                    # Pure domain types (no framework deps)
│   │   ├── scenario.go
│   │   ├── session.go
│   │   ├── message.go
│   │   ├── evaluation.go
│   │   ├── organization.go
│   │   ├── user.go
│   │   ├── billing.go
│   │   └── errors.go             # AppError type with HTTP status codes
│   ├── feature/                   # Feature modules (mirrors Rust structure)
│   │   ├── scenarios/
│   │   │   ├── handler.go         # HTTP handlers
│   │   │   ├── service.go         # Business logic
│   │   │   └── repository.go     # DB queries
│   │   ├── sessions/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   ├── repository.go
│   │   │   └── authorization.go  # RBAC logic
│   │   ├── messages/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── evaluations/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── comments/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── outputs/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── organizations/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── users/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── entitlements/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   ├── repository.go
│   │   │   └── fair_use.go       # Daily limit enforcement
│   │   ├── credits/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── billing/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── webhook.go        # Stripe webhook handler
│   │   ├── imports/
│   │   │   ├── handler.go
│   │   │   └── service.go
│   │   ├── health/
│   │   │   └── handler.go
│   │   ├── product_config/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── test_cases/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   └── feature_flags/
│   │       └── service.go
│   └── platform/                  # Shared infrastructure clients
│       ├── gemini/
│       │   └── client.go          # Gemini LLM HTTP client
│       ├── stripe/
│       │   └── client.go          # Stripe integration wrapper
│       ├── resend/
│       │   └── client.go          # Email client
│       └── database/
│           └── database.go        # Connection pool, helpers
├── migrations/                    # Reuse existing SQL migrations via goose
├── tests/                         # Integration tests
│   ├── setup_test.go              # Test helpers, DB setup
│   ├── session_flow_test.go
│   ├── rbac_access_test.go
│   ├── organizations_test.go
│   ├── billing_test.go
│   ├── entitlements_test.go
│   ├── history_test.go
│   └── message_tags_test.go
├── go.mod
├── go.sum
├── Dockerfile
└── .env.example
```

---

## Key Design Patterns

### 1. Dependency Injection via Constructors (No DI Framework)

```go
type SessionService struct {
    repo       *SessionRepository
    scenarios  *ScenarioService
    credits    *CreditService
    entitle    *EntitlementService
}

func NewSessionService(
    repo *SessionRepository,
    scenarios *ScenarioService,
    credits *CreditService,
    entitle *EntitlementService,
) *SessionService {
    return &SessionService{
        repo:      repo,
        scenarios: scenarios,
        credits:   credits,
        entitle:   entitle,
    }
}
```

All wiring happens explicitly in `cmd/server/main.go`.

### 2. Error Handling

```go
// internal/domain/errors.go
type AppError struct {
    Code    int    `json:"-"`
    Message string `json:"error"`
    Err     error  `json:"-"`
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error { return e.Err }

func NotFound(msg string) *AppError        { return &AppError{Code: 404, Message: msg} }
func Forbidden(msg string) *AppError       { return &AppError{Code: 403, Message: msg} }
func ClientError(msg string) *AppError     { return &AppError{Code: 422, Message: msg} }
func PaymentRequired(msg string) *AppError { return &AppError{Code: 402, Message: msg} }
func TooManyRequests(msg string) *AppError { return &AppError{Code: 429, Message: msg} }
```

Handler helper writes JSON error responses:

```go
func writeError(w http.ResponseWriter, err error) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        w.WriteHeader(appErr.Code)
        json.NewEncoder(w).Encode(appErr)
        return
    }
    w.WriteHeader(500)
    json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
}
```

### 3. Authentication Middleware

```go
func (m *AuthMiddleware) Handler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := extractBearerToken(r)
        claims, err := m.validateJWT(token)
        if err != nil {
            writeError(w, Forbidden("invalid token"))
            return
        }
        user, err := m.userService.UpsertFromClaims(r.Context(), claims)
        if err != nil {
            writeError(w, err)
            return
        }
        ctx := context.WithValue(r.Context(), authUserKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func AuthUserFrom(ctx context.Context) *domain.AuthUser {
    return ctx.Value(authUserKey).(*domain.AuthUser)
}
```

### 4. Route Registration

```go
func NewRouter(
    auth *middleware.AuthMiddleware,
    health *health.Handler,
    scenarios *scenarios.Handler,
    sessions *sessions.Handler,
    messages *messages.Handler,
    // ... other handlers
) chi.Router {
    r := chi.NewRouter()

    // Global middleware
    r.Use(middleware.Telemetry)
    r.Use(middleware.CORS)

    // Public routes
    r.Get("/health", health.Check)

    // Authenticated routes
    r.Group(func(r chi.Router) {
        r.Use(auth.Handler)

        r.Get("/scenarios", scenarios.List)
        r.Post("/scenarios", scenarios.Create)
        r.Get("/scenarios/{id}", scenarios.Get)

        r.Post("/sessions", sessions.Create)
        r.Get("/sessions", sessions.List)
        r.Get("/sessions/{id}", sessions.Get)
        r.Delete("/sessions/{id}", sessions.Delete)

        r.Get("/sessions/{id}/messages", messages.List)
        r.Post("/sessions/{id}/messages", messages.Create)

        // ... remaining routes
    })

    return r
}
```

---

## Rust to Go Translation Reference

| Rust | Go |
|------|----|
| `struct` with `#[derive(Serialize, Deserialize)]` | `struct` with `json:"..."` and `db:"..."` tags |
| `enum` (variants) | `type X string` + `const` block |
| `Option<T>` | `*T` (pointer) or `sql.NullString` / `sql.NullInt64` |
| `Result<T, E>` | `(T, error)` return tuple |
| `Arc<AppState>` | Pass `*AppState` (GC handles sharing) |
| `async fn` + tokio | Goroutines (implicit concurrency), `context.Context` for cancellation |
| `sqlx::query_as!()` | `sqlx.GetContext()` / `sqlx.SelectContext()` with struct tags |
| `#[utoipa::path(...)]` | `// @Summary ...` swag comments |
| `tracing::info!()` | `slog.Info("msg", "key", value)` |
| Axum `Json<T>` extractor | `json.NewDecoder(r.Body).Decode(&req)` |
| Axum `Path<T>` extractor | `chi.URLParam(r, "id")` |
| `impl From<X> for AppError` | Helper functions or method receivers |
| `#[cfg(test)] mod tests` | `_test.go` files in same package |
| `#[tokio::test]` | `func TestXxx(t *testing.T)` |

---

## Migration Phases

### Phase 1: Scaffolding & Core Infrastructure

**Goal**: Bootable server with health check, auth, and database connectivity.

**Tasks**:

- [ ] M001 Initialize `backend-go/` with `go mod init`, project structure, and `.env.example`
- [ ] M002 Implement config loading from environment variables (`internal/config/config.go`)
- [ ] M003 Set up database connection pool and goose migrations (`internal/platform/database/`)
- [ ] M004 Copy existing SQL migration files to `backend-go/migrations/` (adapt for goose format)
- [ ] M005 Implement CORS middleware (`internal/middleware/cors.go`)
- [ ] M006 Implement telemetry/logging middleware with slog (`internal/middleware/telemetry.go`)
- [ ] M007 Implement JWT auth middleware with Auth0 JWKS (`internal/middleware/auth.go`)
- [ ] M008 Implement health check endpoint (`internal/feature/health/`)
- [ ] M009 Wire everything in `cmd/server/main.go`, verify server boots and health returns 200
- [ ] M010 Add Dockerfile for `backend-go`

**Checkpoint**: Server boots, connects to DB, validates JWTs, serves `/health`.

---

### Phase 2: Domain Types & Core Features

**Goal**: Scenario selection, session lifecycle, messaging with Gemini, and evaluation.

**Tasks**:

- [ ] M011 Define all domain types in `internal/domain/` (Scenario, Session, Message, Evaluation, etc.)
- [ ] M012 Implement `AppError` type and error helpers (`internal/domain/errors.go`)
- [ ] M013 [P] Implement Users feature -- handler, service, repository (`internal/feature/users/`)
- [ ] M014 [P] Implement Feature Flags service (`internal/feature/feature_flags/`)
- [ ] M015 Implement Scenarios feature -- handler, service, repository with built-in seed data (`internal/feature/scenarios/`)
- [ ] M016 Implement Sessions feature -- handler, service, repository, authorization (`internal/feature/sessions/`)
- [ ] M017 [P] Implement Gemini LLM client (`internal/platform/gemini/`)
- [ ] M018 Implement Messages feature -- handler, service, repository with Gemini integration (`internal/feature/messages/`)
- [ ] M019 Implement Evaluations feature -- handler, service, repository with Gemini scoring (`internal/feature/evaluations/`)

**Checkpoint**: Full scenario -> session -> chat -> evaluate flow works end-to-end.

---

### Phase 3: Team, Billing & Access Control

**Goal**: Multi-tenant organization support, Stripe billing, and entitlement enforcement.

**Tasks**:

- [ ] M020 Implement Organizations feature -- CRUD, members, invitations (`internal/feature/organizations/`)
- [ ] M021 [P] Implement Resend email client (`internal/platform/resend/`)
- [ ] M022 Implement Entitlements feature -- plan resolution, scenario access (`internal/feature/entitlements/`)
- [ ] M023 Implement Credits feature -- usage tracking (`internal/feature/credits/`)
- [ ] M024 Implement fair-use enforcement -- daily limits for chat and evaluation (`internal/feature/entitlements/fair_use.go`)
- [ ] M025 [P] Implement Stripe client wrapper (`internal/platform/stripe/`)
- [ ] M026 Implement Billing feature -- checkout, portal, webhooks (`internal/feature/billing/`)

**Checkpoint**: Organization creation, member management, Stripe checkout, and plan enforcement work.

---

### Phase 4: Remaining Features

**Goal**: Complete feature parity with Rust backend.

**Tasks**:

- [ ] M027 [P] Implement Comments feature (`internal/feature/comments/`)
- [ ] M028 [P] Implement Outputs feature (`internal/feature/outputs/`)
- [ ] M029 [P] Implement Test Cases feature (`internal/feature/test_cases/`)
- [ ] M030 [P] Implement Product Config feature (`internal/feature/product_config/`)
- [ ] M031 Implement Imports feature (`internal/feature/imports/`)
- [ ] M032 Generate OpenAPI docs with swag (`swag init`)
- [ ] M033 Serve Swagger UI at `/docs`

**Checkpoint**: Full feature parity. All endpoints from Rust backend are available.

---

### Phase 5: Testing & Validation

**Goal**: Comprehensive test coverage and side-by-side validation.

**Tasks**:

- [ ] M034 Set up integration test infrastructure (`tests/setup_test.go`) -- test DB, migrations, helpers
- [ ] M035 Port `session_flow` integration test
- [ ] M036 [P] Port `rbac_access` integration test
- [ ] M037 [P] Port `organizations_http_api` integration test
- [ ] M038 [P] Port `billing_http_checkout` integration test
- [ ] M039 [P] Port `entitlements_effective_plan` integration test
- [ ] M040 [P] Port `history` integration test
- [ ] M041 [P] Port `message_tags` integration test
- [ ] M042 Run both backends side-by-side, compare API responses for all endpoints
- [ ] M043 Run frontend E2E tests against Go backend

**Checkpoint**: All integration tests pass. Frontend works identically with Go backend.

---

### Phase 6: Cutover & Cleanup

**Goal**: Switch to Go backend as primary, update all documentation and CI.

**Tasks**:

- [ ] M044 Update `docker-compose.yml` to use Go backend
- [ ] M045 Update `CLAUDE.md` with Go backend commands (`go build`, `go test`, etc.)
- [ ] M046 Update `AGENTS.md` with Go-specific guidelines
- [ ] M047 Add `golangci-lint` configuration (`.golangci.yml`)
- [ ] M048 Update CI/CD pipeline for Go build/test/lint
- [ ] M049 Archive Rust backend (move to `backend-rust-archived/` or remove)
- [ ] M050 Final documentation pass -- README, quickstart, environment setup

**Checkpoint**: Go backend is the sole production backend. All docs updated.

---

## Trade-offs

### Gains

- **Faster compile times**: Seconds instead of minutes
- **Simpler deployment**: Single static binary (same as Rust)
- **Larger contributor pool**: Go is more widely known
- **Excellent stdlib**: HTTP, JSON, concurrency built in
- **Straightforward error handling**: No borrow checker complexity

### Losses

- **Compile-time safety**: No null safety, no exhaustive enum matching
- **Pattern matching**: Switch statements instead of Rust's `match`
- **Zero-cost abstractions**: Go has GC overhead (negligible for web APIs)

### Mitigations

- Use `golangci-lint` with strict rules (`errcheck`, `exhaustive`, `nilnil`, etc.)
- Consider `sqlc` as alternative to sqlx for compile-time SQL type checking
- Write table-driven tests for enum/authorization logic to compensate for lost exhaustiveness
- Use `*T` (pointers) consistently for optional fields to prevent zero-value bugs

---

## Development Commands (Post-Migration)

```bash
cd backend-go

# Development
go run ./cmd/server          # Start dev server
go build ./cmd/server        # Build binary
go test ./...                # Run all tests
go test ./internal/feature/sessions/...  # Run specific package tests

# Linting
golangci-lint run            # Run linter

# Migrations
goose -dir migrations postgres "$DATABASE_URL" up     # Run migrations
goose -dir migrations postgres "$DATABASE_URL" status  # Check status

# OpenAPI
swag init -g cmd/server/main.go -o docs/  # Generate OpenAPI spec
```

---

## Dependencies Summary

```
go 1.23

require (
    github.com/go-chi/chi/v5
    github.com/go-chi/cors
    github.com/jmoiron/sqlx
    github.com/lib/pq
    github.com/pressly/goose/v3
    github.com/golang-jwt/jwt/v5
    github.com/MicahParks/keyfunc/v3
    github.com/go-playground/validator/v10
    github.com/kelseyhightower/envconfig
    github.com/stripe/stripe-go/v81
    github.com/swaggo/swag
    github.com/swaggo/http-swagger
    github.com/stretchr/testify
    github.com/google/uuid
)
```
