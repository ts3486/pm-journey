# Claude Code Hooks

This directory contains hooks that can be executed at various points during development.

## Available Hooks

### `pre-commit.sh`
Runs before git commits to ensure code quality.

**What it does:**
- Checks TypeScript compilation (frontend)
- Runs ESLint (frontend)
- Runs Vitest tests (frontend)
- Runs Clippy linting (backend)
- Runs Cargo tests (backend)
- Checks Rust formatting (backend)

**Usage:**
This hook is automatically triggered by git if configured. To set it up:

```bash
# Make the hook executable
chmod +x .claude/hooks/pre-commit.sh

# Link it to git hooks (optional)
ln -s ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
```

To skip the hook for a specific commit:
```bash
git commit --no-verify
```

### `post-file-change.sh`
Provides helpful suggestions after files are modified.

**What it does:**
- Detects which part of the codebase changed
- Suggests relevant commands to run
- Reminds you to run tests
- Alerts about dependency changes

**Usage:**
This can be configured in Claude Code settings or run manually:

```bash
.claude/hooks/post-file-change.sh path/to/changed/file.ts
```

## Setting Up Hooks in Claude Code

You can configure Claude Code to run these hooks automatically by adding them to your `claude.toml` or Claude Code settings.

Example configuration:

```toml
[hooks]
pre-commit = ".claude/hooks/pre-commit.sh"
post-file-change = ".claude/hooks/post-file-change.sh"
```

## Creating Custom Hooks

You can add more hooks for specific workflows:

1. Create a new script in this directory
2. Make it executable: `chmod +x .claude/hooks/your-hook.sh`
3. Configure it in Claude Code settings or call it manually

## Hook Best Practices

- Keep hooks fast (they run frequently)
- Provide clear output
- Exit with appropriate status codes (0 = success, non-zero = failure)
- Make hooks optional or provide ways to skip them
- Document what each hook does

## Common Use Cases

- **Quality Gates**: Run linters and tests before commits
- **Dependency Updates**: Alert when package files change
- **Documentation**: Remind to update docs when code changes
- **Security**: Check for secrets or vulnerabilities
- **Formatting**: Auto-format code on save
