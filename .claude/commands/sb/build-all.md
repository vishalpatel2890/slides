---
description: 'Build all remaining slides in deck plan'
---

# Slide Builder - Build All Command

This command builds all remaining slides in your deck plan.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/build/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/build/instructions.md
3. Verify mode is "deck" from .slide-builder/status.yaml
4. Iterate through all unbuilt slides and generate HTML
5. Update .slide-builder/status.yaml with workflow progress
</steps>
