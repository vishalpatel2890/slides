# Build All Workflow

<context>
You are a batch orchestrator that delegates slide generation to build-one.
Do NOT duplicate generation logic here - build-one is the single source of truth for slide generation.

Your job is to:
1. Set up batch context (deck selection, count pending slides)
2. Loop over pending slides, delegating each to build-one
3. Handle errors gracefully (continue on failure)
4. Track progress and summarize results
</context>

<success_criteria>
A successful run produces:
1. HTML files for all pending slides (via build-one delegation)
2. Updated plan.yaml with built slides marked `status: "built"`
3. Regenerated viewer after each slide (via build-one)
4. Updated status.yaml with accurate counts and timestamps
5. Partial success is acceptable—failed slides don't abort the batch
</success_criteria>

---

## Critical Requirement

<critical>
Individual slide failures must NOT abort the batch.
Log the error, mark the slide as "failed", and continue to the next slide.
</critical>

---

## Variable Convention

Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."

---

## Phase 1: Prerequisites Check

<steps>
1. Read `.slide-builder/status.yaml` to get mode and decks registry
2. If `mode` is NOT `"deck"` → stop and tell user to run `/sb-create:plan-deck` first
3. Filter decks by eligible statuses: `planned` or `building`
4. Route based on eligible deck count:
   - Zero eligible → stop, tell user no decks available
   - One eligible → auto-select that deck
   - Multiple eligible → present numbered list, ask user to choose
5. Set `{{deck_slug}}` from selected deck key
6. Verify `output/{{deck_slug}}/plan.yaml` exists (stop if missing)
7. Load plan.yaml and collect all slides with `status: "pending"`
8. If zero pending → stop, tell user all slides are built
9. Set `{{pending_slides}}` = list of pending slides sorted by number
10. Set `{{pending_count}}` = count of pending slides
</steps>

**Report to user:**
- Deck name and slug
- Number of pending slides
- Output folder location

---

## Phase 1B: Build Mode Selection

<steps>
1. If `{{pending_count}}` == 1 → auto-set `{{build_mode}}` = "interactive", skip to Phase 2
2. Otherwise, present mode selection:

<ask context="You have **{{pending_count}} slides** remaining to build.

Choose how you'd like to proceed:"
     header="Build Mode">
  <choice label="Interactive" description="Review each slide's design before building (recommended for important decks)" />
  <choice label="YOLO" description="Build all slides automatically using AI proposals (fastest)" />
</ask>

3. Set `{{build_mode}}` based on user choice:
   - Interactive → `{{build_mode}}` = "interactive"
   - YOLO → `{{build_mode}}` = "yolo", also set `{{yolo_batch}}` = true
</steps>

---

## Phase 2: Batch Generation Loop

<critical>
Delegate ALL slide generation to build-one. Do not duplicate generation logic here.
Build-one handles: theme loading, template matching, HTML generation, viewer regeneration.
</critical>

<steps>
1. Initialize tracking:
   - `{{built_count}}` = 0
   - `{{failed_count}}` = 0
   - `{{failed_slides}}` = []

2. For each slide in `{{pending_slides}}` (already sorted by number):

   a. Report progress:
      <check if="build_mode == 'yolo'">
        <action>Show: "⚡ Building slide {{slide.number}}/{{pending_count}}: "{{slide.description}}" — AI will select template and background"</action>
      </check>
      <check if="build_mode != 'yolo'">
        <action>Show: "Building slide {{slide.number}} of {{pending_count}}..."</action>
      </check>

   b. **Delegate to build-one**:
      - Set `{{target_slide_number}}` = {{slide.number}}
      - If `{{build_mode}}` == "yolo" → set `{{yolo_batch}}` = true in build-one context
      - If `{{skip_all_checkpoints}}` is true → pass `{{skip_all_checkpoints}}` = true to build-one context
      - Execute build-one workflow (all phases)
      - Build-one will: load theme, match template, generate HTML, save file, update plan.yaml, regenerate viewer

   c. If build-one fails:
      - Log error: "❌ Slide {{slide.number}} failed: {{error_message}}"
      - Increment `{{failed_count}}`
      - Add slide number to `{{failed_slides}}`
      - Update plan.yaml: set slide status → "failed"
      - **CONTINUE to next slide** (do not abort)

   d. If build-one succeeds:
      - Increment `{{built_count}}`
      <check if="build_mode == 'yolo'">
        <action>Report: "✓ Slide {{slide.number}} built ({{selected_template}}, {{background_mode}})"</action>
      </check>
      <check if="build_mode != 'yolo'">
        <action>Report: "✓ Slide {{slide.number}} built"</action>
      </check>

   e. **Handle mid-session mode switch**: If build-one set `{{skip_all_checkpoints}}` = true during its checkpoint (user selected "Skip All Checkpoints"):
      - Update `{{build_mode}}` = "yolo" for remaining slides
      - Set `{{yolo_batch}}` = true
      - Log: "Mode switched to YOLO for remaining slides"

   f. If `{{build_mode}}` is "interactive" AND more slides remain:
      - Ask: "Continue to next slide? (Y/n)"
      - If user says no → break loop, proceed to Phase 3

3. After loop completes → Continue to Phase 3
</steps>

---

## Phase 3: Summary and Status Update

<steps>
1. Read current `status.yaml` to get previous `built_count`
2. Calculate `{{final_built_count}}` = previous built_count + `{{built_count}}`
3. Update `status.yaml`:
   - `decks.{{deck_slug}}.built_count`: `{{final_built_count}}`
   - `decks.{{deck_slug}}.current_slide`: last successfully built slide number
   - `decks.{{deck_slug}}.last_action`: "Built {{built_count}} slides in batch"
   - `decks.{{deck_slug}}.last_modified`: current timestamp
   - Status transitions:
     - `planned` + built_count > 0 → `building`
     - final_built_count >= total_slides → `complete`
   - `history` array: append action entry
4. Display summary based on outcome (see below)
</steps>

**Report to user based on outcome:**

| Outcome | Report |
|---------|--------|
| All succeeded | "✓ Built {{built_count}} slides. Viewer at output/{{deck_slug}}/index.html" |
| Partial success | "Built {{built_count}}, failed {{failed_count}}. Failed slides: {{failed_slides}}. Run `/sb-create:build-one` to retry individual slides." |
| All failed | "❌ All slides failed. Run `/sb-create:build-one` to debug individual slides." |

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Mode not "deck" | Stop → tell user to run `/sb-create:plan-deck` |
| No eligible decks | Stop → tell user to create a deck plan |
| Plan.yaml missing | Stop → tell user to run `/sb-create:plan-deck` |
| Zero pending slides | Stop → tell user all slides are built (success state) |
| Single slide fails | Log error, mark as "failed", **continue to next slide** |
| All slides fail | Complete batch, show troubleshooting in summary |
</reference>

<critical>
Never abort the entire batch for individual slide failures. Continue processing remaining slides.
</critical>
