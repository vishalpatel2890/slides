# Claude Code integration

How Slide Builder integrates with the Claude Code CLI.

## Slash commands

Slide Builder commands register as Claude Code skills:

```
/sb:setup        # Theme creation
/sb:plan-deck    # Deck planning
/sb:build-one    # Slide generation
```

## Skill registration

Commands register in `.claude/commands/sb/`:

```
.claude/commands/sb/
├── setup.md
├── theme.md
├── plan.md
├── plan-one.md
├── plan-deck.md
├── build-one.md
├── build-all.md
├── edit.md
├── export.md
└── help.md
```

Each file defines:
- Command name
- Workflow reference
- Execution context

## Workflow execution

When a command runs:

1. Claude Code loads the skill definition
2. Skill points to `.slide-builder/workflows/{name}/`
3. `workflow.yaml` provides configuration
4. `instructions.md` executes step-by-step
5. Status tracks in `status.yaml`

## Skills used

Slide Builder leverages:

**Frontend-design skill**:
- Professional slide generation
- Custom template creation
- Layout regeneration

**BMAD framework**:
- Workflow orchestration
- Agentic execution patterns
- State management

## Context sharing

Within a session:
- Theme available across commands
- Status persists between invocations
- Plans carry forward to builds

## Multi-step workflows

Complex operations use phased execution:

```
Phase 1: Collect input
  ↓
Phase 2: Process/generate
  ↓
Phase 3: Review
  ↓
Phase 4: Iterate or finalize
```

## Related

- [Workflows](workflows.md)
- [Reference: Commands](../reference/commands.md)
