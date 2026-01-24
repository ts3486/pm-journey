#!/bin/bash
# Post-file-change hook for pm-journey project
# This provides suggestions after files are modified

# Get the list of changed files (passed as arguments)
CHANGED_FILES="$@"

# Determine what changed
FRONTEND_CHANGED=false
BACKEND_CHANGED=false
TEST_CHANGED=false
CONFIG_CHANGED=false

for file in $CHANGED_FILES; do
    case "$file" in
        frontend/src/*)
            FRONTEND_CHANGED=true
            if [[ "$file" == *.test.* ]] || [[ "$file" == *.spec.* ]]; then
                TEST_CHANGED=true
            fi
            ;;
        backend/src/*)
            BACKEND_CHANGED=true
            if [[ "$file" == *test* ]]; then
                TEST_CHANGED=true
            fi
            ;;
        backend/tests/*)
            BACKEND_CHANGED=true
            TEST_CHANGED=true
            ;;
        frontend/package.json|backend/Cargo.toml|docker-compose.yml)
            CONFIG_CHANGED=true
            ;;
    esac
done

# Provide contextual suggestions
echo "💡 File change suggestions:"
echo ""

if [ "$CONFIG_CHANGED" = true ]; then
    echo "📦 Configuration files changed:"
    if [[ "$CHANGED_FILES" == *"package.json"* ]]; then
        echo "   → Run 'cd frontend && pnpm install' to update dependencies"
    fi
    if [[ "$CHANGED_FILES" == *"Cargo.toml"* ]]; then
        echo "   → Run 'cd backend && cargo build' to update dependencies"
    fi
    echo ""
fi

if [ "$FRONTEND_CHANGED" = true ] && [ "$TEST_CHANGED" = false ]; then
    echo "🎨 Frontend code changed:"
    echo "   → Consider running 'cd frontend && pnpm test' to verify changes"
    echo "   → Run 'cd frontend && pnpm lint' to check code style"
    echo ""
fi

if [ "$BACKEND_CHANGED" = true ] && [ "$TEST_CHANGED" = false ]; then
    echo "🦀 Backend code changed:"
    echo "   → Consider running 'cd backend && cargo test' to verify changes"
    echo "   → Run 'cd backend && cargo clippy' to check for issues"
    echo ""
fi

if [ "$TEST_CHANGED" = true ]; then
    echo "🧪 Test files changed:"
    echo "   → Run tests to verify they pass"
    if [ "$FRONTEND_CHANGED" = true ]; then
        echo "     Frontend: 'cd frontend && pnpm test'"
    fi
    if [ "$BACKEND_CHANGED" = true ]; then
        echo "     Backend: 'cd backend && cargo test'"
    fi
    echo ""
fi

if [ "$FRONTEND_CHANGED" = true ] && [ "$BACKEND_CHANGED" = true ]; then
    echo "🔄 Full-stack changes detected:"
    echo "   → Consider running integration/E2E tests"
    echo "   → Verify API contracts are still in sync"
    echo ""
fi

echo "✨ Happy coding!"
