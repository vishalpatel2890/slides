---
description: 'Build the next slide (or single planned slide) from plan using theme'
---

# Slide Builder - Build One Command

This command builds a single slide from your plan using the matching template or frontend-design skill.

**Behavior depends on current mode:**
- **Single mode:** Builds the slide from `output/singles/plan.yaml`
- **Deck mode:** Builds the next unbuilt slide from `output/{deck-slug}/plan.yaml`

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/build-one/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/build-one/instructions.md
3. Execute the 5-phase workflow:
   - Phase 1: Mode Detection & Routing (check status.yaml mode)
   - Phase 1B: Deck Build Router (find next pending slide in deck plan)
   - Phase 2: Template Decision (map template to sample file or use custom)
   - Phase 3/3B: Template or Custom Build (generate slide HTML)
   - Phase 4: Save Slide (create .html and state.json files)
   - Phase 5: Update Progress (update plan.yaml status, status.yaml counts)
4. All text elements must have contenteditable="true" and data-field attributes
5. Slide must render at 1920x1080 (16:9)
6. In deck mode, create corresponding slide-{n}-state.json for Epic 4 compatibility
</steps>

## Deck Mode Specifics

When mode is "deck" in status.yaml:
- Gets current_deck_slug from status.yaml
- Reads `output/{deck-slug}/plan.yaml` to find slides array
- Finds first slide with status: "pending"
- Generates slide to `output/{deck-slug}/slides/slide-{n}.html`
- Creates empty state file at `output/{deck-slug}/slides/slide-{n}-state.json`
- Updates slide status in plan.yaml to "built"
- Increments built_count in status.yaml
- Shows remaining slide count after build
- If all slides built, displays "All slides built!" message

## Output Files

**Single Mode:**
- `output/singles/{slide-slug}.html`

**Deck Mode:**
- `output/{deck-slug}/slides/slide-{n}.html`
- `output/{deck-slug}/slides/slide-{n}-state.json`
