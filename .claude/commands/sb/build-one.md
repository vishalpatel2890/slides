---
description: 'Build the next slide (or single planned slide) from plan using theme'
---

# Slide Builder - Build One Command

This command builds a single slide from your plan.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/build/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/build/instructions.md
3. Determine mode from .slide-builder/status.yaml (single or deck)
4. Load plan and theme, generate HTML slide
5. Update .slide-builder/status.yaml with workflow progress
</steps>
