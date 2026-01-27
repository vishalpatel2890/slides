---
description: 'Build the next slide (or single planned slide) from plan using theme'
---

# Slide Builder - Build One Command

This command builds a single slide from your plan using the matching template.

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/build-one/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/build-one/instructions.md
3. Execute the 4-phase workflow:
   - Phase 1: State Verification (check mode, load plan.yaml and theme.json)
   - Phase 2: Template Decision (map suggested_template to template file)
   - Phase 3: Template Build (inject CSS variables, generate content, add contenteditable)
   - Phase 4: State Update (save slide.html, update status.yaml)
4. All text elements must have contenteditable="true" and data-field attributes
5. Slide must render at 1920x1080 (16:9)
</steps>
