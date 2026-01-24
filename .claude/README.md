# Claude Code Configuration

This directory contains configuration for Claude Code, including custom agents, skills, and hooks.

## Directory Structure

```
.claude/
├── agents/          # Specialized AI agents for different tasks
├── skills/          # Reusable skills for specific workflows
├── hooks/           # Scripts that run at specific events
└── README.md        # This file
```

## Agents

Agents are specialized versions of Claude optimized for specific tasks.

### Available Agents

1. **design-dev** - UI/UX designer with frontend development skills
   - Focus: Design systems, accessibility, user experience, visual design
   - Use for: UI/UX design, component design, design implementation, accessibility

2. **frontend-dev** - Frontend development specialist
   - Focus: Next.js, React, TypeScript, Tailwind CSS
   - Use for: UI components, frontend features, styling

3. **backend-dev** - Backend development specialist
   - Focus: Rust, Axum, API development
   - Use for: API endpoints, backend logic, Rust code

4. **test-specialist** - Testing expert
   - Focus: Vitest, Testing Library, Playwright, Cargo tests
   - Use for: Writing tests, debugging test failures

5. **fullstack-dev** - Full-stack generalist
   - Focus: Cross-stack features, API integration
   - Use for: Features spanning frontend and backend

### Using Agents

Invoke an agent in Claude Code:
```
@frontend-dev Can you help me create a new component?
```

Or let Claude automatically choose the best agent based on your request.

## Skills

Skills are reusable workflows that can be invoked on-demand or automatically.

### Available Skills

(Add custom skills to `.claude/skills/` directory)

Each skill is a directory with a `SKILL.md` file that defines:
- What the skill does
- When to use it
- Which tools it can access
- Step-by-step instructions

### Creating a Skill

1. Create a directory in `.claude/skills/`
2. Add a `SKILL.md` file with frontmatter:

```yaml
---
name: my-skill
description: What this skill does
disable-model-invocation: false
allowed-tools: Read, Write, Bash
---

# Skill Instructions

Detailed instructions for Claude to follow...
```

3. Invoke with `/my-skill` or let Claude use it automatically

## Hooks

Hooks are scripts that run at specific events during development.

### Available Hooks

1. **pre-commit.sh** - Runs before git commits
   - Checks TypeScript, ESLint, tests
   - Validates Rust code with Clippy
   - Ensures code quality

2. **post-file-change.sh** - Runs after files are modified
   - Provides contextual suggestions
   - Reminds to run tests
   - Alerts about dependency changes

### Setting Up Hooks

Make hooks executable:
```bash
chmod +x .claude/hooks/*.sh
```

Link to git hooks (optional):
```bash
ln -s ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
```

## Configuration Tips

### For This Project

This pm-journey project is a full-stack application with:
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Rust + Axum
- **Testing**: Vitest, Testing Library, Playwright, Cargo

The agents and skills are configured to work with this stack.

### Customization

You can customize agents and skills by:
1. Editing the existing `.md` files
2. Adding new agents/skills for your specific needs
3. Adjusting allowed tools and permissions
4. Modifying hooks for your workflow

### Model Selection

Agents can specify which model to use:
- `model: sonnet` - Fast, cost-effective (default for most agents)
- `model: opus` - Most capable, for complex tasks
- `model: haiku` - Fastest, for simple tasks

## Best Practices

1. **Use Agents** for focused, domain-specific work
2. **Use Skills** for repeatable workflows
3. **Use Hooks** for quality gates and automation
4. **Keep Configurations Simple** - Start minimal, add as needed
5. **Document Custom Additions** - Help future you and teammates

## Getting Help

- Ask Claude: "What agents are available?"
- Ask Claude: "How do I use the frontend-dev agent?"
- Check agent files in `.claude/agents/` for details
- Read skill files in `.claude/skills/` for instructions

## Maintenance

- Update agents when tech stack changes
- Review and update hooks periodically
- Archive unused skills
- Keep this README up to date
