#!/bin/bash
# Pre-commit hook for pm-journey project
# This runs before git commits to ensure code quality

set -e

echo "🔍 Running pre-commit checks..."

# Track if any checks fail
FAILED=0

# Check which files are being committed
FRONTEND_CHANGED=$(git diff --cached --name-only | grep "^frontend/" || true)
BACKEND_CHANGED=$(git diff --cached --name-only | grep "^backend/" || true)

# Frontend checks
if [ -n "$FRONTEND_CHANGED" ]; then
    echo ""
    echo "📦 Frontend files changed, running checks..."

    # TypeScript compilation check
    echo "  ⚙️  Checking TypeScript..."
    cd frontend
    if ! pnpm exec tsc --noEmit; then
        echo "  ❌ TypeScript check failed"
        FAILED=1
    else
        echo "  ✅ TypeScript check passed"
    fi

    # Linting
    echo "  🔍 Running ESLint..."
    if ! pnpm lint; then
        echo "  ❌ ESLint check failed"
        FAILED=1
    else
        echo "  ✅ ESLint check passed"
    fi

    # Run tests
    echo "  🧪 Running frontend tests..."
    if ! pnpm test run; then
        echo "  ❌ Frontend tests failed"
        FAILED=1
    else
        echo "  ✅ Frontend tests passed"
    fi

    cd ..
fi

# Backend checks
if [ -n "$BACKEND_CHANGED" ]; then
    echo ""
    echo "🦀 Backend files changed, running checks..."

    # Clippy linting
    echo "  🔍 Running Clippy..."
    cd backend
    if ! cargo clippy -- -D warnings; then
        echo "  ❌ Clippy check failed"
        FAILED=1
    else
        echo "  ✅ Clippy check passed"
    fi

    # Run tests
    echo "  🧪 Running backend tests..."
    if ! cargo test; then
        echo "  ❌ Backend tests failed"
        FAILED=1
    else
        echo "  ✅ Backend tests passed"
    fi

    # Check formatting
    echo "  📝 Checking Rust formatting..."
    if ! cargo fmt -- --check; then
        echo "  ❌ Formatting check failed (run 'cargo fmt')"
        FAILED=1
    else
        echo "  ✅ Formatting check passed"
    fi

    cd ..
fi

# Final result
echo ""
if [ $FAILED -eq 0 ]; then
    echo "✅ All pre-commit checks passed!"
    exit 0
else
    echo "❌ Some checks failed. Please fix the issues before committing."
    echo "   You can run 'git commit --no-verify' to skip these checks (not recommended)."
    exit 1
fi
