---
description: 'Build all remaining slides in deck plan'
---

# Slide Builder - Build All Command

This command builds all remaining slides in your deck plan with progress tracking and error continuation.

**Requirements:**
- Mode must be "deck" in `.slide-builder/status.yaml`
- current_deck_slug must be set in status.yaml
- Deck plan must exist at `output/{deck-slug}/plan.yaml`
- Plan must have slides with status: "pending"

**Behavior:**
- Iterates through all pending slides in order (by slide number)
- Generates each slide using template matching or frontend-design skill
- **Continues on error** - if one slide fails, batch continues with next slide
- Reports progress: "Building slide X of Y..."
- Displays summary showing built count and any failures

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/build-all/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/build-all/instructions.md
3. Execute the 5-phase workflow:

   **Phase 1: Prerequisites Check**
   - Verify mode == "deck" from .slide-builder/status.yaml
   - If not deck mode: Error "/build-all is for deck mode only"
   - Read deck/plan.yaml to get slides array
   - Count slides with status: "pending"
   - If zero pending: "All slides already built! Run /export when ready."
   - Display: "Building {n} remaining slides..."

   **Phase 2: Batch Generation Loop**
   For each pending slide (in order by number):
   - Display progress: "Building slide {n} of {total}..."
   - Extract slide context (intent, template, key_points, tone, etc.)
   - Determine template vs custom generation
   - If error occurs: Log error, mark slide "failed", CONTINUE to next (don't abort)

   **Phase 3/3B: Slide Generation**
   - Template-based: Load sample, inject content with theme CSS variables
   - Custom: Invoke frontend-design skill with full context
   - All text elements MUST have contenteditable="true" and data-field attributes
   - Slides MUST be 1920x1080 pixels

   **Phase 4: Per-Slide Save**
   - Save slide to deck/slides/slide-{n}.html
   - Create state file: deck/slides/slide-{n}-state.json
   - Update plan.yaml: status → "built" (or "failed" on error)

   **Phase 5: Summary & Completion**
   - Calculate summary: total attempted, built, failed
   - Update status.yaml: built_count, last_action, history
   - Display results:
     ```
     Build complete!
     Built: {n}/{total} slides
     ```
   - If failures: "Failed slides: {list} - Retry with /build-one"
   - Suggest next steps: Review slides, /edit, /export

4. All generated slides must have:
   - contenteditable="true" on text elements
   - data-field attributes for state tracking
   - 1920x1080 dimensions
   - Theme CSS variables from theme.json
   - Auto-save JavaScript for text edits
</steps>

## Example Output

**Success:**
```
Starting Batch Build

Building 8 remaining slides...

Building slide 3 of 10... (1/8)
✅ Slide 3 built successfully

Building slide 4 of 10... (2/8)
✅ Slide 4 built successfully

...

═══════════════════════════════════════════════════════════════════════════════
✅ Build Complete!

Built: 8/8 slides

Next Steps:
- Review slides in output/{deck-slug}/slides/
- Use /sb:edit {n} to refine any slide
- Run /sb:export when ready to export to Google Slides
═══════════════════════════════════════════════════════════════════════════════
```

**With Failures:**
```
═══════════════════════════════════════════════════════════════════════════════
⚠️ Build Complete with Failures

Built: 6/8 slides
Failed: 2 slides

Failed Slides: 5, 7

Retry failed slides individually with /sb:build-one

Next Steps:
- Review successful slides in output/{deck-slug}/slides/
- Run /sb:build-one to retry failed slides
═══════════════════════════════════════════════════════════════════════════════
```

## Error Handling

- **Mode not deck:** Returns error message, does not attempt build
- **No pending slides:** Displays "All slides already built!" with next steps
- **Individual slide fails:** Logs error, marks slide "failed", continues to next slide
- **All slides fail:** Displays error summary with debugging suggestions
