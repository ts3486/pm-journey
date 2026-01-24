#!/bin/bash
# Setup script for Claude Code configuration

echo "🚀 Setting up Claude Code configuration for pm-journey..."
echo ""

# Make hooks executable
echo "📝 Making hooks executable..."
chmod +x .claude/hooks/*.sh
echo "   ✅ Hooks are now executable"
echo ""

# Optionally link git hooks
echo "🔗 Git Hooks Setup"
echo "   Would you like to link pre-commit hook to git? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if [ -f .git/hooks/pre-commit ]; then
        echo "   ⚠️  Existing pre-commit hook found. Creating backup..."
        mv .git/hooks/pre-commit .git/hooks/pre-commit.backup
    fi
    ln -s ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
    echo "   ✅ Pre-commit hook linked successfully"
else
    echo "   ℹ️  Skipping git hook setup"
    echo "   You can run: ln -s ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 What's configured:"
echo "   • CLAUDE.md - Project documentation for Claude"
echo "   • 5 specialized agents (design-dev, frontend-dev, backend-dev, test-specialist, fullstack-dev)"
echo "   • Development hooks (pre-commit, post-file-change)"
echo "   • .claude/skills/ directory for custom skills"
echo ""
echo "🎯 Next steps:"
echo "   • Use '@agent-name' to invoke specific agents in Claude Code"
echo "   • Add custom skills to .claude/skills/"
echo "   • Install external skills with: npx skills add <owner>/<repo>"
echo "   • Read .claude/README.md for more details"
echo ""
echo "Happy coding! 🎉"
