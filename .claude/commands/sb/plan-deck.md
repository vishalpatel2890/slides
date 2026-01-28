---
description: 'Plan a full presentation deck with narrative structure, audience context, and slide-by-slide breakdown'
---

# Slide Builder - Plan Deck Command

This command creates a narrative-first deck plan by collecting presentation context through sequential prompts.

**What it does:**
1. Verifies theme.json exists (prerequisite)
2. Checks for existing decks, allows switching between them
3. Prompts for: purpose, audience, key points, desired length (sequentially)
4. Generates a storyline arc (hook, tension, resolution, CTA)
5. Creates a slide-by-slide breakdown with template assignments
6. Saves plan to `output/{deck-slug}/plan.yaml` (each deck has its own folder)
7. Updates status.yaml with current_deck_slug for other workflows

**Usage:**
```
/sb:plan-deck           # Start deck planning workflow
/sb:plan-deck "Name"    # Start with deck name pre-filled
```

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/plan-deck/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/plan-deck/instructions.md
3. Execute the workflow steps in EXACT ORDER:
   - Step 1: Verify theme.json exists (HALT if missing with /sb:setup message)
   - Step 2: Collect inputs SEQUENTIALLY (purpose, audience, key points, length)
   - Step 3: Generate narrative structure with storyline and slide breakdown
   - Step 4: Allow plan modifications (add, remove, reorder, change slides)
   - Step 5: Save plan.yaml and update status.yaml to mode: deck
4. Each prompt MUST wait for user response before proceeding
5. Slide breakdown MUST show: number, intent, template, storyline_role for each slide
</steps>
