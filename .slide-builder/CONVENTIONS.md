# Slide Builder Conventions

This document defines the conventions and patterns used in Slide Builder.

## Command-to-Workflow Mapping

All Slide Builder commands are prefixed with `sb:` to avoid collision with built-in Claude Code commands.

| Command | Workflow Directory | Description |
|---------|-------------------|-------------|
| `/sb:setup` | `.slide-builder/workflows/setup/` | Create brand theme from assets |
| `/sb:theme` | `.slide-builder/workflows/theme/` | Display current theme summary |
| `/sb:theme-edit` | `.slide-builder/workflows/theme-edit/` | Modify existing theme |
| `/sb:plan` | `.slide-builder/workflows/plan/` | Smart router (single or deck) |
| `/sb:plan-one` | `.slide-builder/workflows/plan-one/` | Plan a single slide |
| `/sb:plan-deck` | `.slide-builder/workflows/plan-deck/` | Plan a full deck |
| `/sb:build-one` | `.slide-builder/workflows/build/` | Build next/single slide |
| `/sb:build-all` | `.slide-builder/workflows/build/` | Build all remaining slides |
| `/sb:edit` | `.slide-builder/workflows/edit/` | Edit slide layout |
| `/sb:export` | `.slide-builder/workflows/export/` | Export to Google Slides |

## Workflow Execution Pattern

All workflows follow the BMAD pattern:

1. **Load** `workflow.yaml` from the workflow directory
2. **Read** `instructions.md` for step-by-step execution
3. **Execute** steps in numerical order
4. **Pause** at `<template-output>` and `<ask>` tags for user interaction
5. **Update** `.slide-builder/status.yaml` with progress

## File Structure

```
.slide-builder/
├── theme.json           # Brand theme primitives
├── status.yaml          # Global workflow state
├── CONVENTIONS.md       # This file
├── workflows/           # Workflow definitions
│   ├── setup/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── theme/
│   ├── theme-edit/
│   ├── plan/
│   ├── plan-one/
│   ├── plan-deck/
│   ├── build/
│   ├── edit/
│   ├── export/
│   └── test/            # Test workflow from Story 1.2
├── single/              # Single slide mode
│   ├── plan.yaml
│   └── slide.html
├── deck/                # Deck mode
│   ├── plan.yaml
│   └── slides/
│       ├── slide-1.html
│       └── ...
├── templates/           # Layout templates
└── credentials/         # Google OAuth tokens

.claude/commands/sb/     # Claude Code skill registrations
├── setup.md
├── theme.md
├── theme-edit.md
├── plan.md
├── plan-one.md
├── plan-deck.md
├── build-one.md
├── build-all.md
├── edit.md
└── export.md
```

## Adding New Commands

To add a new command:

1. Create workflow directory: `.slide-builder/workflows/{command-name}/`
2. Add `workflow.yaml` with BMAD schema (name, description, instructions path)
3. Add `instructions.md` with workflow steps
4. Create skill registration: `.claude/commands/sb/{command-name}.md`
5. Update this CONVENTIONS.md with the new mapping

## Workflow YAML Schema

```yaml
name: workflow-name
description: "Brief description"
author: "Slide Builder"

installed_path: "{project-root}/.slide-builder/workflows/{name}"
instructions: "{installed_path}/instructions.md"

variables:
  workflow_version: "1.0"

template: false  # true if workflow produces document output
standalone: true
```

## State Management

- `status.yaml`: Tracks current mode (single/deck), progress, history
- `plan.yaml`: Stores slide plan (single or deck mode)
- State files use ISO 8601 timestamps
- History array captures action trail for debugging/resume
