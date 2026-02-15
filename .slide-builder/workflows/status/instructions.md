# Status Dashboard - Workflow Instructions

```xml
<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This is a READ-ONLY workflow - no files are modified</critical>

<workflow>

  <step n="1" goal="Load status data from status.yaml">
    <action>Read the COMPLETE file: .slide-builder/status.yaml</action>
    <action>Extract the `mode` field (values: setup, ready, single, deck)</action>
    <action>Extract the `decks` object containing all deck entries</action>
    <action>Extract the global `last_modified` timestamp</action>

    <check if="status.yaml does not exist or is unreadable">
      <output>
**Slide Builder Status**

No status.yaml found. Run `/sb-brand:setup` to initialize Slide Builder.
      </output>
      <action>HALT</action>
    </check>
  </step>

  <step n="2" goal="Build deck data model with sorting">
    <action>For each entry in the `decks` object, create a data model:
      - slug: the deck key (e.g., "claude-code-fundamentals-week-1")
      - name: decks[slug].name
      - status: decks[slug].status (planned | building | complete)
      - built_count: decks[slug].built_count
      - total_slides: decks[slug].total_slides
      - last_modified: decks[slug].last_modified
      - output_folder: decks[slug].output_folder
    </action>

    <action>Sort the deck list by last_modified in DESCENDING order (most recent first)</action>

    <action>Assign display numbers 1, 2, 3... to sorted decks for user selection</action>
  </step>

  <step n="3" goal="Handle single mode display">
    <check if="mode == 'single'">
      <action>Read .slide-builder/single/plan.yaml if it exists</action>

      <check if="single/plan.yaml exists">
        <action>Extract: intent, suggested_template from plan.yaml</action>
        <action>Check if .slide-builder/single/slide.html exists (built vs pending)</action>

        <output>
**Slide Builder Status**

**Single Slide Mode**

**Plan:** {{intent}}
**Template:** {{suggested_template}}
**Status:** {{built_or_pending}}
**Output:** .slide-builder/single/slide.html

---
**Actions:**
- `/sb-create:build-one` - Build the slide
- `/sb-create:edit` - Edit the slide (if built)
- `/sb-create:plan` - Plan a different slide or deck
        </output>
      </check>

      <check if="single/plan.yaml does NOT exist">
        <output>
**Slide Builder Status**

**Single Slide Mode**

No slide planned. Run `/sb-create:plan-one` to plan a single slide.
        </output>
      </check>

      <action>HALT - single mode complete</action>
    </check>
  </step>

  <step n="4" goal="Display deck overview">
    <check if="decks is empty or undefined">
      <output>
**Slide Builder Status**

**No decks found.**

Get started:
- `/sb-create:plan-deck` - Plan a full presentation deck
- `/sb-create:plan-one` - Plan a single slide
- `/sb-create:use-template` - Create deck from template
      </output>
      <action>HALT</action>
    </check>

    <action>Calculate deck count and summary stats:
      - total_decks: count of decks
      - complete_count: decks with status == "complete"
      - building_count: decks with status == "building"
      - planned_count: decks with status == "planned"
    </action>

    <action>Generate progress bar for each deck:
      - bar_length = 10 characters
      - filled = floor(built_count / total_slides * bar_length)
      - empty = bar_length - filled
      - bar = "█" repeated filled times + "░" repeated empty times
    </action>

    <action>Generate status icon for each deck:
      - ✅ if status == "complete"
      - ⏳ if status == "building"
      - ⬜ if status == "planned"
    </action>

    <output>
**Slide Builder Status**

**DECKS** ({{total_decks}} total: {{complete_count}} complete, {{building_count}} building, {{planned_count}} planned)

{{for each deck in sorted_decks:}}
{{icon}} {{deck.slug | pad_right(40)}} {{progress_bar}} {{built_count}}/{{total_slides}}  {{status}}
{{end for}}

---
**[1-{{total_decks}}]** View deck detail | **[Enter]** Exit
    </output>

    <ask>Select a deck for detail view (1-{{total_decks}}), or press Enter to exit:</ask>
  </step>

  <step n="5" goal="Handle deck selection for detail view">
    <check if="user pressed Enter or provided empty input">
      <output>Status complete.</output>
      <action>HALT</action>
    </check>

    <check if="user provided invalid selection (not a number or out of range)">
      <output>Invalid selection. Please enter a number from 1 to {{total_decks}}.</output>
      <goto step="4">Return to overview</goto>
    </check>

    <action>Get the selected deck from sorted list using selection number</action>
    <action>Store selected_slug = selected deck's slug</action>
    <action>Store selected_deck = selected deck's data model</action>
  </step>

  <step n="6" goal="Load plan.yaml for detail view">
    <action>Construct plan path: output/{{selected_slug}}/plan.yaml</action>
    <action>Attempt to read the plan.yaml file</action>

    <check if="plan.yaml does not exist or is unreadable">
      <output>
**Deck: {{selected_deck.name}}**

Plan file not found at: output/{{selected_slug}}/plan.yaml

The deck entry exists in status.yaml but the plan file is missing.
This may indicate the output folder was deleted or moved.

**Options:**
- Delete the orphaned entry: check status.yaml
- Re-plan the deck: `/sb-create:plan-deck`
      </output>
      <ask>Press Enter to return to overview:</ask>
      <goto step="4">Return to overview</goto>
    </check>

    <action>Extract slides array from plan.yaml</action>
    <action>For each slide, create display model:
      - number: slide.number
      - intent: truncate slide.intent to 35 characters (add "..." if truncated)
      - status: slide.status (built | pending)
    </action>
  </step>

  <step n="7" goal="Display deck detail view">
    <action>Identify NEXT slide (first slide with status == "pending")</action>
    <action>Generate slide list with status icons:
      - ✅ if status == "built"
      - ⬜ if status == "pending"
      - Add "← NEXT" marker to first pending slide
    </action>

    <action>Generate progress bar for the deck</action>

    <output>
**Deck: {{selected_deck.name}}**
**Status:** {{selected_deck.status}}
**Progress:** {{progress_bar}} {{selected_deck.built_count}}/{{selected_deck.total_slides}} slides

{{for each slide in slides:}}
{{icon}} {{slide.number | pad(2)}}. {{slide.intent}}{{" ← NEXT" if first_pending}}
{{end for}}

**Last modified:** {{selected_deck.last_modified}}

---
**Actions:**
- `/sb-create:build-one` - Build next slide
- `/sb-create:build-all` - Build all remaining slides
- `/sb-create:edit` - Edit a slide
- `/sb-create:add-slide` - Add a new slide to plan
    </output>

    <ask>Press Enter to return to overview:</ask>
    <goto step="4">Return to overview</goto>
  </step>

</workflow>
```
