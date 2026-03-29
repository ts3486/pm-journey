# Prompt: Apply "everything-claude-code" Settings to pm-journey

Based on the [everything-claude-code](https://github.com/affaan-m/everything-claude-code) repository (referenced in [this X post](https://x.com/affaanmustafa/article/2012378465664745795) and [this Zenn article](https://zenn.dev/ttks/articles/a54c7520f827be)), apply the following Claude Code configuration to the pm-journey project.

This project uses **Next.js 16 + React 19 + TypeScript 5.9 + Tailwind CSS 4** (frontend) and **Rust/Axum** (backend). Adapt all configurations accordingly — skip Go/Python/Django/Spring-specific items but keep patterns that apply generically.

---

## 1. Create Agents (`~/.claude/agents/`)

Create the following agent files at the **user level** (`~/.claude/agents/`). Each agent uses frontmatter format.

### `~/.claude/agents/planner.md`

```markdown
---
name: planner
description: Expert planning specialist for complex features and refactoring. Use PROACTIVELY when users request feature implementation, architectural changes, or complex refactoring. Automatically activated for planning tasks.
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist focused on creating comprehensive, actionable implementation plans.

## Your Role

- Analyze requirements and create detailed implementation plans
- Break down complex features into manageable steps
- Identify dependencies and potential risks
- Suggest optimal implementation order
- Consider edge cases and error scenarios

## Planning Process

### 1. Requirements Analysis
- Understand the feature request completely
- Ask clarifying questions if needed
- Identify success criteria
- List assumptions and constraints

### 2. Architecture Review
- Analyze existing codebase structure
- Identify affected components
- Review similar implementations
- Consider reusable patterns

### 3. Step Breakdown
Create detailed steps with:
- Clear, specific actions
- File paths and locations
- Dependencies between steps
- Estimated complexity
- Potential risks

### 4. Implementation Order
- Prioritize by dependencies
- Group related changes
- Minimize context switching
- Enable incremental testing

## Plan Format

Use this structure:

# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]

## Architecture Changes
- [Change 1: file path and description]

## Implementation Steps

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file)
   - Action: Specific action to take
   - Why: Reason for this step
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

## Testing Strategy
- Unit tests: [files to test]
- Integration tests: [flows to test]
- E2E tests: [user journeys to test]

## Risks & Mitigations

## Success Criteria

## Best Practices

1. **Be Specific**: Use exact file paths, function names, variable names
2. **Consider Edge Cases**: Think about error scenarios, null values, empty states
3. **Minimize Changes**: Prefer extending existing code over rewriting
4. **Maintain Patterns**: Follow existing project conventions
5. **Enable Testing**: Structure changes to be easily testable
6. **Think Incrementally**: Each step should be verifiable
```

### `~/.claude/agents/architect.md`

```markdown
---
name: architect
description: Software architecture specialist for system design, scalability, and technical decision-making. Use PROACTIVELY when planning new features, refactoring large systems, or making architectural decisions.
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are a senior software architect specializing in scalable, maintainable system design.

## Your Role

- Design system architecture for new features
- Evaluate technical trade-offs
- Recommend patterns and best practices
- Identify scalability bottlenecks
- Ensure consistency across codebase

## Architectural Principles

1. **Modularity & Separation of Concerns** — Single Responsibility, high cohesion, low coupling
2. **Scalability** — Horizontal scaling, stateless design, efficient queries, caching
3. **Maintainability** — Clear organization, consistent patterns, easy to test
4. **Security** — Defense in depth, least privilege, input validation, secure by default
5. **Performance** — Efficient algorithms, minimal requests, optimized queries, lazy loading

## Trade-Off Analysis

For each design decision, document:
- **Pros**: Benefits and advantages
- **Cons**: Drawbacks and limitations
- **Alternatives**: Other options considered
- **Decision**: Final choice and rationale

## Architecture Decision Records (ADRs)

For significant decisions, create ADRs with Context, Decision, Consequences, Alternatives Considered, Status, and Date.
```

### `~/.claude/agents/code-reviewer.md`

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: ["Read", "Grep", "Glob", "Bash"]
model: sonnet
---

You are a senior code reviewer ensuring high standards of code quality and security.

## Review Process

1. **Gather context** — Run `git diff --staged` and `git diff` to see all changes
2. **Understand scope** — Identify which files changed and how they connect
3. **Read surrounding code** — Don't review changes in isolation
4. **Apply review checklist** — Work through each category from CRITICAL to LOW
5. **Report findings** — Only report issues you are >80% confident about

## Review Checklist

### Security (CRITICAL)
- Hardcoded credentials
- SQL injection / XSS / Path traversal / CSRF
- Authentication bypasses
- Exposed secrets in logs

### Code Quality (HIGH)
- Large functions (>50 lines) or files (>800 lines)
- Deep nesting (>4 levels)
- Missing error handling
- console.log statements
- Missing tests for new code

### React/Next.js Patterns (HIGH)
- Missing dependency arrays in useEffect/useMemo/useCallback
- State updates in render
- Missing keys in lists
- Client/server boundary violations
- Missing loading/error states

### Performance (MEDIUM)
- Inefficient algorithms
- Unnecessary re-renders
- Large bundle sizes
- Missing caching

## Approval Criteria
- **Approve**: No CRITICAL or HIGH issues
- **Warning**: HIGH issues only
- **Block**: CRITICAL issues found
```

### `~/.claude/agents/tdd-guide.md`

```markdown
---
name: tdd-guide
description: Test-Driven Development specialist enforcing write-tests-first methodology. Use PROACTIVELY when writing new features, fixing bugs, or refactoring code. Ensures 80%+ test coverage.
tools: ["Read", "Write", "Edit", "Bash", "Grep"]
model: sonnet
---

You are a TDD specialist who ensures all code is developed test-first with comprehensive coverage.

## TDD Workflow

### 1. Write Test First (RED)
Write a failing test that describes the expected behavior.

### 2. Run Test — Verify it FAILS

### 3. Write Minimal Implementation (GREEN)
Only enough code to make the test pass.

### 4. Run Test — Verify it PASSES

### 5. Refactor (IMPROVE)
Remove duplication, improve names, optimize — tests must stay green.

### 6. Verify Coverage (80%+ required)

## Edge Cases You MUST Test
1. Null/Undefined input
2. Empty arrays/strings
3. Invalid types
4. Boundary values (min/max)
5. Error paths (network failures, DB errors)
6. Special characters (Unicode, SQL chars)

## Quality Checklist
- [ ] All public functions have unit tests
- [ ] All API endpoints have integration tests
- [ ] Critical user flows have E2E tests
- [ ] Edge cases covered
- [ ] Mocks used for external dependencies
- [ ] Tests are independent (no shared state)
- [ ] Coverage is 80%+
```

### `~/.claude/agents/security-reviewer.md`

```markdown
---
name: security-reviewer
description: Security vulnerability detection and remediation specialist. Use PROACTIVELY after writing code that handles user input, authentication, API endpoints, or sensitive data.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are an expert security specialist focused on identifying and remediating vulnerabilities.

## OWASP Top 10 Check
1. **Injection** — Queries parameterized? User input sanitized?
2. **Broken Auth** — Passwords hashed? JWT validated? Sessions secure?
3. **Sensitive Data** — HTTPS enforced? Secrets in env vars? Logs sanitized?
4. **XXE** — XML parsers configured securely?
5. **Broken Access** — Auth checked on every route? CORS configured?
6. **Misconfiguration** — Default creds changed? Debug mode off in prod?
7. **XSS** — Output escaped? CSP set?
8. **Insecure Deserialization** — User input deserialized safely?
9. **Known Vulnerabilities** — Dependencies up to date?
10. **Insufficient Logging** — Security events logged?

## Code Patterns to Flag

| Pattern | Severity | Fix |
|---------|----------|-----|
| Hardcoded secrets | CRITICAL | Use env vars |
| String-concatenated SQL | CRITICAL | Parameterized queries |
| `innerHTML = userInput` | HIGH | Use `textContent` or DOMPurify |
| No auth check on route | CRITICAL | Add auth middleware |
| No rate limiting | HIGH | Add rate limiter |
| Logging passwords/secrets | MEDIUM | Sanitize log output |
```

### `~/.claude/agents/build-error-resolver.md`

```markdown
---
name: build-error-resolver
description: Build and TypeScript/Rust error resolution specialist. Use PROACTIVELY when build fails or type errors occur. Fixes build/type errors only with minimal diffs, no architectural edits.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are an expert build error resolution specialist. Your mission is to get builds passing with minimal changes.

## Diagnostic Commands

### Frontend (TypeScript/Next.js)
- `pnpm exec tsc --noEmit --pretty`
- `pnpm build`
- `pnpm lint`

### Backend (Rust/Axum)
- `cargo check`
- `cargo build`
- `cargo clippy`

## Workflow

1. **Collect All Errors** — Run build commands, categorize errors
2. **Fix Strategy (MINIMAL CHANGES)** — Smallest possible fix per error
3. **Verify** — Re-run build after each fix

## DO and DON'T

**DO:** Add type annotations, null checks, fix imports/exports, add missing dependencies, fix config
**DON'T:** Refactor unrelated code, change architecture, rename variables, add features, change logic flow
```

### `~/.claude/agents/e2e-runner.md`

```markdown
---
name: e2e-runner
description: End-to-end testing specialist using Playwright. Use PROACTIVELY for generating, maintaining, and running E2E tests.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are an expert E2E testing specialist using Playwright.

## Core Responsibilities
1. **Test Journey Creation** — Write Playwright tests for user flows
2. **Test Maintenance** — Keep tests up to date with UI changes
3. **Flaky Test Management** — Identify and quarantine unstable tests
4. **Artifact Management** — Capture screenshots, videos, traces

## Key Principles
- Use semantic locators: `[data-testid="..."]` > CSS selectors > XPath
- Wait for conditions, not time: `waitForResponse()` > `waitForTimeout()`
- Isolate tests: Each test should be independent
- Use Page Object Model pattern
```

### `~/.claude/agents/refactor-cleaner.md`

```markdown
---
name: refactor-cleaner
description: Dead code cleanup and consolidation specialist. Use PROACTIVELY for removing unused code, duplicates, and refactoring.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are an expert refactoring specialist focused on code cleanup and consolidation.

## Detection Commands
- `npx knip` — Unused files, exports, dependencies
- `npx depcheck` — Unused npm dependencies
- `cargo +nightly udeps` — Unused Rust dependencies

## Workflow
1. **Analyze** — Run detection tools
2. **Categorize** — SAFE (unused internals), CAUTION (components, routes), DANGER (config, entry points)
3. **Remove Safely** — One category at a time, test after each batch
4. **Consolidate** — Merge near-duplicate functions, remove wrapper indirection

## Rules
- Never delete without running tests first
- One deletion at a time
- Skip if uncertain
- Don't refactor while cleaning
```

### `~/.claude/agents/doc-updater.md`

```markdown
---
name: doc-updater
description: Documentation and codemap specialist. Use PROACTIVELY for updating codemaps and documentation.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: haiku
---

You are a documentation specialist focused on keeping documentation current with the codebase.

## Key Principles
1. **Single Source of Truth** — Generate from code, don't manually write
2. **Freshness Timestamps** — Always include last updated date
3. **Token Efficiency** — Keep codemaps under 500 lines each
4. **Actionable** — Include setup commands that actually work
5. **Cross-reference** — Link related documentation
```

---

## 2. Create Commands (`~/.claude/commands/`)

Create the following slash command files.

### `~/.claude/commands/tdd.md`

```markdown
---
description: Enforce test-driven development workflow. Scaffold interfaces, generate tests FIRST, then implement minimal code to pass. Ensure 80%+ coverage.
---

This command invokes the **tdd-guide** agent to enforce test-driven development methodology.

## TDD Cycle
RED -> GREEN -> REFACTOR -> REPEAT

1. Define interfaces for inputs/outputs
2. Write tests that will FAIL (because code doesn't exist yet)
3. Run tests and verify they fail for the right reason
4. Write minimal implementation to make tests pass
5. Run tests and verify they pass
6. Refactor code while keeping tests green
7. Check coverage and add more tests if below 80%

## Integration with pm-journey
- Frontend tests: `pnpm test` (Vitest + Testing Library)
- Backend tests: `cargo test`
- E2E tests: `pnpm e2e` (Playwright)
```

### `~/.claude/commands/plan.md`

```markdown
---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

This command invokes the **planner** agent to create a comprehensive implementation plan.

1. Analyze the request and restate requirements in clear terms
2. Break down into phases with specific, actionable steps
3. Identify dependencies between components
4. Assess risks and potential blockers
5. Estimate complexity (High/Medium/Low)
6. Present the plan and WAIT for explicit confirmation

**CRITICAL**: Do NOT write any code until user explicitly confirms the plan.
```

### `~/.claude/commands/code-review.md`

```markdown
Comprehensive security and quality review of uncommitted changes:

1. Get changed files: `git diff --name-only HEAD`

2. For each changed file, check for:

**Security Issues (CRITICAL):**
- Hardcoded credentials, API keys, tokens
- SQL injection / XSS vulnerabilities
- Missing input validation

**Code Quality (HIGH):**
- Functions > 50 lines, Files > 800 lines
- Nesting depth > 4 levels
- Missing error handling
- console.log statements

**Best Practices (MEDIUM):**
- Mutation patterns (use immutable instead)
- Missing tests for new code

3. Generate report with severity, file location, issue description, suggested fix
4. Block commit if CRITICAL or HIGH issues found
```

### `~/.claude/commands/build-fix.md`

```markdown
Incrementally fix build and type errors with minimal, safe changes.

## Step 1: Detect Build System

| Indicator | Build Command |
|-----------|---------------|
| `package.json` with `build` script | `pnpm build` |
| `tsconfig.json` (TypeScript only) | `pnpm exec tsc --noEmit` |
| `Cargo.toml` | `cargo build` |

## Step 2: Parse and Group Errors
1. Run the build command and capture stderr
2. Group errors by file path
3. Sort by dependency order

## Step 3: Fix Loop (One Error at a Time)
1. Read the file — see error context
2. Diagnose — identify root cause
3. Fix minimally — smallest change that resolves the error
4. Re-run build — verify error is gone
5. Move to next

## Step 4: Guardrails
Stop and ask the user if:
- A fix introduces more errors than it resolves
- The same error persists after 3 attempts
- The fix requires architectural changes
```

### `~/.claude/commands/refactor-clean.md`

```markdown
Safely identify and remove dead code with test verification at every step.

## Step 1: Detect Dead Code
- Frontend: `npx knip`, `npx depcheck`
- Backend: `cargo +nightly udeps`

## Step 2: Categorize
- **SAFE**: Unused utilities, internal functions
- **CAUTION**: Components, API routes, middleware
- **DANGER**: Config files, entry points, type definitions

## Step 3: Safe Deletion Loop
1. Run full test suite — establish baseline
2. Delete the dead code
3. Re-run test suite — verify nothing broke
4. If tests fail — immediately revert and skip this item

## Rules
- Never delete without running tests first
- One deletion at a time
- Skip if uncertain
```

### `~/.claude/commands/verify.md`

```markdown
Run comprehensive verification on current codebase state.

Execute verification in this exact order:

1. **Build Check** — `pnpm build` and `cargo build`
2. **Type Check** — `pnpm exec tsc --noEmit` and `cargo check`
3. **Lint Check** — `pnpm lint` and `cargo clippy`
4. **Test Suite** — `pnpm test` and `cargo test`
5. **Console.log Audit** — Search for console.log in source files
6. **Git Status** — Show uncommitted changes

## Output

```
VERIFICATION: [PASS/FAIL]

Frontend Build:  [OK/FAIL]
Backend Build:   [OK/FAIL]
Types (TS):      [OK/X errors]
Types (Rust):    [OK/X errors]
Lint (TS):       [OK/X issues]
Lint (Rust):     [OK/X issues]
Tests (FE):      [X/Y passed]
Tests (BE):      [X/Y passed]
Console.logs:    [OK/X found]

Ready for PR: [YES/NO]
```

$ARGUMENTS can be: `quick` (build + types only), `full` (all checks, default), `pre-commit`, `pre-pr`
```

### `~/.claude/commands/e2e.md`

```markdown
---
description: Generate and run end-to-end tests with Playwright.
---

This command invokes the **e2e-runner** agent.

1. Analyze user flow and identify test scenarios
2. Generate Playwright test using Page Object Model pattern
3. Run tests: `pnpm e2e`
4. Capture failures with screenshots, videos, and traces
5. Generate report with results and artifacts
6. Identify flaky tests and recommend fixes
```

---

## 3. Create Rules (`~/.claude/rules/`)

Create a `rules/` directory inside `~/.claude/` (or the project-level `.claude/rules/`) with the following modular rule files.

### `~/.claude/rules/security.md`

```markdown
# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] Authentication/authorization verified
- [ ] Error messages don't leak sensitive data

## Secret Management
- NEVER hardcode secrets in source code
- ALWAYS use environment variables
- Validate that required secrets are present at startup

## Security Response Protocol
If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
```

### `~/.claude/rules/coding-style.md`

```markdown
# Coding Style

## Immutability (CRITICAL)
ALWAYS create new objects, NEVER mutate existing ones. Use spread operators for updates.

## File Organization
MANY SMALL FILES > FEW LARGE FILES:
- 200-400 lines typical, 800 max
- Organize by feature/domain, not by type

## Error Handling
- Handle errors explicitly at every level
- Provide user-friendly error messages in UI-facing code
- Log detailed error context on the server side
- Never silently swallow errors

## Input Validation
- Validate all user input before processing
- Use Zod schemas for TypeScript, strong typing for Rust
- Fail fast with clear error messages

## Code Quality Checklist
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values
- [ ] No mutation
```

### `~/.claude/rules/testing.md`

```markdown
# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** — Individual functions, utilities, components
2. **Integration Tests** — API endpoints, database operations
3. **E2E Tests** — Critical user flows (Playwright)

## Test-Driven Development (MANDATORY)
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## pm-journey Test Commands
- Frontend unit tests: `pnpm test` (Vitest)
- Backend unit tests: `cargo test`
- E2E tests: `pnpm e2e` (Playwright)
```

### `~/.claude/rules/git-workflow.md`

```markdown
# Git Workflow

## Commit Message Format
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Feature Implementation Workflow
1. **Plan First** — Use planner agent
2. **TDD Approach** — Use tdd-guide agent (write tests first)
3. **Code Review** — Use code-reviewer agent after writing code
4. **Verify** — Run `/verify` before committing
5. **Commit & Push** — Detailed commit messages, conventional commits
```

### `~/.claude/rules/patterns.md`

```markdown
# Common Patterns

## Repository Pattern
Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Business logic depends on the abstract interface, not storage mechanism

## API Response Format
Use a consistent envelope for all API responses:
- Include a success/status indicator
- Include the data payload (nullable on error)
- Include an error message field (nullable on success)
- Include metadata for paginated responses (total, page, limit)
```

### `~/.claude/rules/performance.md`

```markdown
# Performance Optimization

## Model Selection Strategy
- **Haiku** — Lightweight agents, frequent invocation, docs updates
- **Sonnet** — Main development work, code review, TDD
- **Opus** — Complex architectural decisions, deep reasoning, planning

## Context Window Management
Avoid last 20% of context window for large-scale refactoring. Use `/verify` frequently.

## Build Troubleshooting
If build fails:
1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix
```

### `~/.claude/rules/agents.md`

```markdown
# Agent Orchestration

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

## Immediate Agent Usage (No user prompt needed)
1. Complex feature requests → **planner**
2. Code just written/modified → **code-reviewer**
3. Bug fix or new feature → **tdd-guide**
4. Architectural decision → **architect**

## Parallel Task Execution
ALWAYS use parallel Task execution for independent operations.
```

---

## 4. Configure Hooks (`~/.claude/settings.json`)

Merge the following hooks into your `~/.claude/settings.json`. These provide automated checks.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const i=JSON.parse(d);const p=i.tool_input?.file_path||'';if(/\\.(ts|tsx|js|jsx)$/.test(p)){const fs=require('fs');const c=fs.readFileSync(p,'utf8');const m=c.match(/console\\.log/g);if(m){console.error('[Hook] WARNING: '+m.length+' console.log(s) found in '+p);console.error('[Hook] Remove before committing')}}}catch{}console.log(d)})\""
          }
        ],
        "description": "Warn about console.log statements after editing TS/JS files"
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const{execSync}=require('child_process');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const files=execSync('git diff --name-only HEAD 2>/dev/null',{encoding:'utf8'}).trim().split('\\n').filter(f=>/\\.(ts|tsx|js|jsx)$/.test(f));let total=0;for(const f of files){try{const c=require('fs').readFileSync(f,'utf8');const m=c.match(/console\\.log/g);if(m)total+=m.length}catch{}}if(total>0)console.error('[Hook] '+total+' console.log(s) found in modified files — clean up before commit')}catch{}console.log(d)})\""
          }
        ],
        "description": "Check for console.log in modified files after each response"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const i=JSON.parse(d);const cmd=i.tool_input?.command||'';if(/git push/.test(cmd)){console.error('[Hook] Reminder: review changes before push')}}catch{}console.log(d)})\""
          }
        ],
        "description": "Reminder before git push to review changes"
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const i=JSON.parse(d);const p=i.tool_input?.file_path||'';if(/\\.(md|txt)$/.test(p)&&!/(README|CLAUDE|AGENTS|CONTRIBUTING)\\.md$/.test(p)&&!/\\.claude\\//.test(p)&&!/specs\\//.test(p)){console.error('[Hook] BLOCKED: Unnecessary documentation file creation');console.error('[Hook] File: '+p);process.exit(2)}}catch{}console.log(d)})\""
          }
        ],
        "description": "Block creation of random .md files — keeps docs consolidated"
      }
    ]
  }
}
```

---

## 5. Create Skills (Project-level `.claude/skills/`)

### `.claude/skills/tdd-workflow/SKILL.md`

Create the TDD workflow skill with detailed patterns for Vitest (frontend) and cargo test (backend), including mocking patterns for this project's services (localStorage, Mastra agents, Gemini API).

### `.claude/skills/verification-loop/SKILL.md`

Create the verification loop skill that runs: Build -> Type Check -> Lint -> Test -> Security Scan -> Diff Review, using this project's specific commands (`pnpm build`, `cargo build`, `pnpm test`, `cargo test`, etc.).

### `.claude/skills/frontend-patterns/SKILL.md`

Create frontend patterns skill covering: component composition, custom hooks, TanStack Query usage, Zod validation, Tailwind CSS patterns, and Next.js App Router conventions used in this project.

### `.claude/skills/backend-patterns/SKILL.md`

Create backend patterns skill covering: Axum route handlers, middleware, error handling with `thiserror`/`anyhow`, SQLx patterns, utoipa OpenAPI docs, and Rust async patterns used in this project.

### `.claude/skills/security-review/SKILL.md`

Create security review skill with OWASP Top 10 checklist adapted for Next.js + Rust/Axum, including secrets management, input validation (Zod + Rust strong typing), XSS prevention, and CSRF protection patterns.

---

## 6. Important Notes

### MCP Context Window Warning
The article warns that enabling too many MCPs can shrink the 200k context window to ~70k. Recommendations:
- Configure 20-30 MCPs total
- Enable **10 or fewer per project**
- Keep **active tools under 80**
- Disable unused servers via `disabledMcpServers` in settings

### Principle: Focused Tools for Agents
Provide agents with only essential tools rather than many capabilities. 5 focused tools enable faster, more efficient execution than 50.

### Rules Should Be Modular
Split rules by function (security, coding-style, testing, etc.) rather than consolidating into single files. This keeps them focused and reduces token usage.

---

## Summary of Files to Create

### User Level (`~/.claude/`)
- `agents/planner.md`
- `agents/architect.md`
- `agents/code-reviewer.md`
- `agents/tdd-guide.md`
- `agents/security-reviewer.md`
- `agents/build-error-resolver.md`
- `agents/e2e-runner.md`
- `agents/refactor-cleaner.md`
- `agents/doc-updater.md`
- `commands/tdd.md`
- `commands/plan.md`
- `commands/code-review.md`
- `commands/build-fix.md`
- `commands/refactor-clean.md`
- `commands/verify.md`
- `commands/e2e.md`
- `rules/security.md`
- `rules/coding-style.md`
- `rules/testing.md`
- `rules/git-workflow.md`
- `rules/patterns.md`
- `rules/performance.md`
- `rules/agents.md`
- Update `settings.json` with hooks configuration

### Project Level (`.claude/`)
- `skills/tdd-workflow/SKILL.md`
- `skills/verification-loop/SKILL.md`
- `skills/frontend-patterns/SKILL.md`
- `skills/backend-patterns/SKILL.md`
- `skills/security-review/SKILL.md`
