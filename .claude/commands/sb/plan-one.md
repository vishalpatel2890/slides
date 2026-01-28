---
description: 'Plan a single slide by capturing user intent and content requirements'
---

# Slide Builder - Plan One Command

This command plans a single slide through a 5-phase workflow:

1. **Theme Verification** - Confirms theme.json exists
2. **Intent Capture** - Prompts user to describe their slide
3. **Template Matching** - Matches intent to available templates
4. **Confirmation** - Summarizes understanding for user approval
5. **State Persistence** - Saves plan.yaml and updates status.yaml

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/plan-one/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/plan-one/instructions.md
3. Execute the workflow steps in order:
   - Phase 1: Check for .slide-builder/theme.json (HALT if missing)
   - Phase 2: Ask user to describe their slide need
   - Phase 3: Match intent keywords to templates (or "custom")
   - Phase 4: Display understanding summary and confirm with user
   - Phase 5: Save plan.yaml and update status.yaml
4. Save plan to output/singles/plan.yaml
5. Update .slide-builder/status.yaml with mode: "single"
</steps>

## Template Matching Keywords

| Template | Keywords |
|----------|----------|
| layout-title | title, intro, opening, welcome, cover |
| layout-list | list, bullets, points, agenda, items, features |
| layout-flow | flow, process, timeline, steps, sequence |
| layout-columns-2 | compare, vs, two, side-by-side, before/after |
| layout-columns-3 | three, triad, options, pillars |
| layout-callout | key, insight, callout, cta, highlight, quote |
| layout-code | code, technical, api, snippet, demo |
| custom | (no keywords match) |
