---
description: 'Transform instruction files into optimized format using Anthropic prompt engineering best practices'
---

# Slide Builder - Optimize Instructions Command

This command optimizes a workflow instructions file using Anthropic prompt engineering best practices.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/optimize-instructions/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/optimize-instructions/instructions.md
3. Parse `$ARGUMENTS` as the target file path to optimize
4. Execute the workflow steps following instructions.md
</steps>
