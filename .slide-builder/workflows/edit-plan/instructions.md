# Edit Plan - Workflow Instructions

<context>
You are a plan editing agent. Your job is to apply a targeted natural language edit to an existing deck plan (plan.yaml). The Plan Editor has already generated a context file with full deck details. You interpret the user's instruction and modify plan.yaml accordingly.

You have expertise in:
- YAML plan structure (deck metadata, agenda sections, storyline, slides)
- Narrative arc modifications (opening, tension, resolution, CTA)
- Structural changes (add/remove/reorder slides and sections)
- Field-level edits (description, tone, key_points, design_plan)
</context>

<success_criteria>
A successful run:
1. Reads the existing plan.yaml without data loss
2. Applies the user's requested change accurately
3. Maintains all plan schema requirements (sequential numbering, required fields, valid enums)
4. Writes the modified plan.yaml back to disk
5. Reports a clear summary of what changed
</success_criteria>

---

## Critical Requirements

<critical>
These are non-negotiable for every edit-plan invocation.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | No data loss | All fields not mentioned in the instruction must be preserved exactly |
| 2 | Schema compliance | Output plan.yaml must pass validation per plan-schema.md |
| 3 | Sequential numbering | After structural changes, slides renumbered 1, 2, 3... |
| 4 | Agenda linkage | Every slide's agenda_section_id must reference a valid section |
| 5 | Timestamp update | last_modified updated to current ISO 8601 timestamp |
| 6 | Single file write | Only plan.yaml is modified — no other files |
| 7 | Preserve built status | Never change a slide's status from "built" to "pending" unless the instruction explicitly requests a rebuild |

---

```xml
<workflow>

  <step n="1" goal="Load context and plan">
    <action>Read the plan editor context file at .slide-builder/plan-editor-context.md</action>
    <action>Extract the user's instruction from the "User Request" section (or from $ARGUMENTS)</action>
    <action>Extract the deck name from the "Deck Overview" section</action>
    <action>Derive the plan.yaml path:
      - Check .slide-builder/status.yaml for current_deck_slug
      - Plan path: .slide-builder/decks/{deck_slug}/plan.yaml OR output/{deck_slug}/plan.yaml
      - If multiple decks exist, match deck name from context file</action>
    <action>Read and parse the FULL plan.yaml file — preserve all fields</action>
    <action>Read the plan schema at .slide-builder/workflows/plan/plan-schema.md for validation reference</action>
  </step>

  <step n="2" goal="Classify the edit type">
    <action>Analyze the user's instruction and classify as one of:
      - **field**: References specific YAML fields or slide properties
        Examples: "Change slide 3 description to...", "Make slide 5 tone urgent", "Update the key message"
      - **structural**: Adds, removes, reorders, or splits slides/sections
        Examples: "Add a slide about ROI after slide 3", "Remove the last slide", "Split the evidence section"
      - **narrative**: Modifies storyline, themes, flow, or positioning
        Examples: "Make the opening more compelling", "Strengthen the CTA", "Reframe for technical audience"
    </action>
    <action>For narrative edits, identify which parts of the plan are affected:
      - Storyline fields (opening_hook, tension, resolution, call_to_action)
      - Recurring themes
      - Slide descriptions and key_points that relate to the narrative change
      - Section discovery goals</action>
  </step>

  <step n="3" goal="Apply the edit">

    <check if="edit type is field">
      <action>Identify the target field(s) from the instruction</action>
      <action>Modify the specific field value(s)</action>
      <action>If the instruction references a slide by number, update that slide's fields</action>
      <action>If the instruction references a section by name, update that section's fields</action>
      <action>Preserve all other fields unchanged</action>
    </check>

    <check if="edit type is structural">
      <action>For add slide: Generate new slide entry with all required fields (number, description, suggested_template, status: pending, storyline_role, agenda_section_id, key_points, design_plan, tone). Infer values from instruction and surrounding context. Insert at specified position.</action>
      <action>For remove slide: Remove the target slide from the array</action>
      <action>For reorder slides: Move the slide to the new position</action>
      <action>For add section: Create new agenda section with id, title, narrative_role, estimated_slides, description</action>
      <action>For remove section: Remove the section and reassign or remove orphaned slides</action>
      <action>After ANY structural change: renumber all slides sequentially from 1</action>
      <action>After section changes: update agenda.total_sections</action>
    </check>

    <check if="edit type is narrative">
      <action>Analyze the current narrative arc from storyline fields</action>
      <action>Determine how the instruction changes the narrative direction</action>
      <action>Update storyline fields as needed (opening_hook, tension, resolution, call_to_action)</action>
      <action>Cascade narrative changes to affected slides:
        - Update slide descriptions to align with new narrative
        - Update key_points where content conflicts with new direction
        - Update design_plan tone/mood references if narrative tone shifted</action>
      <action>Update section discovery goals if the narrative change affects section objectives</action>
      <action>Update recurring_themes if the instruction implies theme changes</action>
      <critical>Be opinionated but conservative. Change only what the instruction implies. If the user says "make the opening more compelling," update the opening_hook AND the first 1-2 slides — do NOT restructure the entire deck.</critical>
    </check>

  </step>

  <step n="4" goal="Validate and write">
    <action>Validate the modified plan against the plan schema:
      - All required deck-level fields present
      - All slides have required fields (number, description, suggested_template, status, storyline_role, agenda_section_id, key_points, design_plan)
      - Slide numbers are sequential (1, 2, 3...)
      - All agenda_section_ids reference valid sections
      - Enum fields use valid values</action>
    <action>Update last_modified to current ISO 8601 timestamp</action>
    <action>Write plan.yaml to the same path it was read from</action>
  </step>

  <step n="5" goal="Report changes">
    <action>Display a concise summary of what changed:

For field edits:
> **Plan Updated** — Changed {field} on {target}

For structural edits:
> **Plan Updated** — {Added/Removed/Moved} slide {N}: "{description}" | Total: {old} → {new}

For narrative edits:
> **Plan Updated** — {summary of narrative shift} | Slides affected: {list}
    </action>
    <action>Remind user: "The Plan Editor will auto-sync these changes."</action>
  </step>

</workflow>
```

---

## Error Handling

| Problem | Action |
|---------|--------|
| Context file missing | Tell user to open the Plan Editor first, then use "Edit with Claude" |
| plan.yaml not found | Tell user to run `/sb-create:plan-deck` first |
| Cannot parse instruction | Ask user to clarify what they want to change |
| Invalid slide number | Show valid range (1 to N), ask user to retry |
| Would break schema | Show what validation failed, suggest corrected approach |
| No changes needed | Report "No changes were necessary — the plan already matches your request" |
