---
description: 'Edit slide layout via natural language prompts while preserving user text edits'
---

# Slide Builder - Edit Command

This command edits a slide's layout.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/edit/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/edit/instructions.md
3. Accept optional slide number argument (e.g., /sb-edit 3)
4. Execute the workflow steps, regenerating layout while preserving text edits
5. Update .slide-builder/status.yaml with workflow progress
</steps>

**Usage:** `/sb-edit` or `/sb-edit [slide-number]`
