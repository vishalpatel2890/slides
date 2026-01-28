---
description: 'Edit slide layout via natural language prompts while preserving user text edits'
---

# Slide Builder - Edit Command

Edit a slide's layout using natural language while preserving your text edits.

**Usage:**
- `/sb:edit` - Edit slide (single mode) or select slide (deck mode)
- `/sb:edit [n]` - Edit slide number n (deck mode)

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/edit/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/edit/instructions.md
3. Parse the argument (if provided) as slide_number: $ARGUMENTS
4. Execute the workflow steps following instructions.md EXACTLY:
   - Step 1: Read status.yaml for mode detection and validate slide exists
   - Step 2: Load slide and display info summary (layout, fields, edit count)
   - Step 3: Prompt for natural language edit instruction
   - Step 4: Confirm understanding and preserve edit count notice
   - Step 5-7: Apply edit and complete
5. Update .slide-builder/status.yaml with the action
</steps>

## Acceptance Criteria (Story 4.1)

- **AC4.1.1:** Single mode `/edit` loads from `output/singles/`
- **AC4.1.2:** Deck mode `/edit 3` loads `output/{deck-slug}/slides/slide-3.html`
- **AC4.1.3:** Invalid slide number shows "Valid range: 1-N" error
- **AC4.1.4:** Displays slide info: layout type, field count, edit count
- **AC4.1.5:** Prompts "Describe the layout change you want"
- **AC4.1.6:** No slides shows "Run /sb:build-one first" error
