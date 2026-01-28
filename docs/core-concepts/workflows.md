# Workflows

Slide Builder operates through an agentic workflow system based on the BMAD (Business Model Agent Development) pattern.

## Workflow structure

Each workflow consists of:

**workflow.yaml**: Configuration and metadata
```yaml
name: "Setup Theme"
version: "3.0"
instructions: "./instructions.md"
variables:
  theme_path: ".slide-builder/config/theme.json"
```

**instructions.md**: Step-by-step execution logic
```markdown
## Step 1: Collect assets
<ask>
What brand assets would you like me to analyze?
</ask>

## Step 2: Extract primitives
[Extraction logic...]
```

## Workflow execution

1. User invokes slash command (e.g., `/sb:setup`)
2. System loads `workflow.yaml`
3. System executes `instructions.md` steps in order
4. Pauses at `<ask>` tags for user input
5. Produces output at `<template-output>` tags
6. Updates `status.yaml` with progress

## Available workflows

| Workflow | Command | Purpose |
|----------|---------|---------|
| setup | `/sb:setup` | Create brand theme |
| theme | `/sb:theme` | View current theme |
| theme-edit | `/sb:theme-edit` | Modify theme |
| plan | `/sb:plan` | Smart router |
| plan-one | `/sb:plan-one` | Plan single slide |
| plan-deck | `/sb:plan-deck` | Plan full deck |
| build-one | `/sb:build-one` | Build next slide |
| build-all | `/sb:build-all` | Build all slides |
| edit | `/sb:edit` | Edit slide layout |
| export | `/sb:export` | Export to Google Slides |
| add-template | `/sb:add-template` | Create custom template |

## Status tracking

The `status.yaml` file tracks:
- Current workflow
- Current phase
- Mode (single/deck)
- Progress indicators

```yaml
mode: "deck"
workflow: "build-one"
phase: "generating"
current_slide: 5
total_slides: 12
```

## Workflow phases

Most workflows follow a phase pattern:

1. **Input collection**: Gather user requirements
2. **Processing**: AI analysis and generation
3. **Review**: Present results to user
4. **Feedback**: Accept modifications
5. **Finalization**: Save results

## Creating custom workflows

New workflows require:
1. Directory in `.slide-builder/workflows/{name}/`
2. `workflow.yaml` with configuration
3. `instructions.md` with execution logic
4. Skill registration in `.claude/commands/sb/`

## Related

- [Reference: Commands](../reference/commands.md)
- [Claude Code integration](claude-code-integration.md)
