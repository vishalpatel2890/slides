---
name: sb
description: Smart entry point with context detection - routes to appropriate workflow based on current state
---

# Slide Builder - Smart Entry Point

This skill provides a single entry point to the Slide Builder system. It reads the current state from status.yaml and presents context-aware options for the most common next actions.

<steps CRITICAL="TRUE">
1. Read the current state from @.slide-builder/status.yaml
   - If file does not exist or cannot be parsed: detected_state = NO_THEME
   - Store the parsed YAML as `status_data`

2. Execute State Detection Algorithm (in priority order - STOP at first match):

   **Check 1: NO_THEME Detection (Priority 1)**
   - IF `status_data.theme` does not exist OR `status_data.theme.status` is null/missing/empty
   - THEN detected_state = NO_THEME
   - STOP detection

   **Check 2: NO_DECKS Detection (Priority 2)**
   - IF `status_data.decks` does not exist OR `status_data.decks` is null OR `status_data.decks` is empty object ({})
   - THEN detected_state = NO_DECKS
   - STOP detection

   **Check 3: IN_PROGRESS Detection (Priority 3)**
   - Iterate through all entries in `status_data.decks`
   - Filter to decks where `deck.status == "planned"` OR `deck.status == "building"`
   - Store matching decks as `eligible_decks` array with: slug, name, status, built_count, total_slides
   - IF `eligible_decks.length >= 1`
   - THEN detected_state = IN_PROGRESS
   - STOP detection

   **Check 4: ALL_COMPLETE Detection (Priority 4)**
   - IF all decks in `status_data.decks` have `deck.status == "complete"`
   - THEN detected_state = ALL_COMPLETE
   - Store all decks as `complete_decks` array

3. Output context-specific status message based on detected_state (see state_handling below)

4. Present appropriate options using AskUserQuestion based on detected_state
   - For IN_PROGRESS with multiple eligible_decks: show deck picker first (max 3 + "Plan New Deck")
   - For ALL_COMPLETE: store deck list for potential Edit/Export picker

5. Route to the selected workflow using the Skill tool with appropriate arguments
</steps>

<state_detection>
## Priority Order

| Priority | Condition | State |
|----------|-----------|-------|
| 1 | `theme.status` is null/missing | NO_THEME |
| 2 | `decks` is empty/null | NO_DECKS |
| 3 | Any deck has status `planned` or `building` | IN_PROGRESS |
| 4 | All decks have status `complete` | ALL_COMPLETE |

## Eligible Decks Collection (AC #5)

When IN_PROGRESS state is detected, collect matching decks:

```
eligible_decks = []
for each (slug, deck) in status_data.decks:
  if deck.status == "planned" OR deck.status == "building":
    eligible_decks.push({
      slug: slug,
      name: deck.name,
      status: deck.status,
      built_count: deck.built_count,
      total_slides: deck.total_slides
    })
```

Then determine sub-state:
- IF `eligible_decks.length == 1`: Single deck in-progress (auto-select)
- IF `eligible_decks.length >= 2`: Multiple decks in-progress (show picker)

## Edge Cases

- **status.yaml missing:** Treat as NO_THEME state
- **Corrupted YAML:** Show error, suggest `/sb:help`
- **Empty decks object `{}`:** Treat as NO_DECKS state
- **Mixed deck states (some complete, some building):** IN_PROGRESS (filter to non-complete)
- **Single deck with status `planned`:** IN_PROGRESS (single deck mode)
</state_detection>

<state_handling>
## NO_THEME State (AC #1)

<ask context="**Slide Builder**

No brand theme detected. You need to set up your theme before creating slides.

This involves providing brand assets (website URL, PDF brand guidelines, or images)
and the system will extract colors, typography, and design patterns."
     header="Setup">
  <choice label="Start Setup" description="Run brand theme extraction from your assets" />
  <choice label="Show All Commands" description="View complete command reference" />
</ask>

<check if="user selected 'Start Setup'">
  <action>Use Skill tool: skill="sb-brand:setup"</action>
</check>
<check if="user selected 'Show All Commands'">
  <action>Use Skill tool: skill="sb:help"</action>
</check>

## NO_DECKS State (AC #2)

<ask context="**Slide Builder**

Theme is ready! No decks created yet.

Ready to start creating slides?"
     header="Create">
  <choice label="Full Deck" description="Plan a complete presentation with multiple slides" />
  <choice label="Single Slide" description="Create just one slide" />
  <choice label="Use Template" description="Start from a pre-built deck template" />
  <choice label="Show All Commands" description="View complete command reference" />
</ask>

<check if="user selected 'Full Deck'">
  <action>Use Skill tool: skill="sb-create:plan-deck"</action>
</check>
<check if="user selected 'Single Slide'">
  <action>Use Skill tool: skill="sb-create:plan-one"</action>
</check>
<check if="user selected 'Use Template'">
  <action>Use Skill tool: skill="sb-create:use-template"</action>
</check>
<check if="user selected 'Show All Commands'">
  <action>Use Skill tool: skill="sb:help"</action>
</check>

## IN_PROGRESS State - Single Deck (AC #3)

When eligible_decks.length == 1, auto-select that deck and show action options.

<output>
**Slide Builder**

Deck in progress: "{{eligible_decks[0].name}}"
Progress: {{eligible_decks[0].built_count}}/{{eligible_decks[0].total_slides}} slides built
Status: {{eligible_decks[0].status}}
</output>

<ask context="What would you like to do?" header="Action">
  <choice label="Continue Building" description="Build the next slide in {{eligible_decks[0].name}}" />
  <choice label="Build All Remaining" description="Batch build all unbuilt slides" />
  <choice label="Edit a Slide" description="Modify an existing slide's layout" />
  <choice label="Plan New Deck" description="Start planning a different deck" />
</ask>

<check if="user selected 'Continue Building'">
  <action>Use Skill tool: skill="sb-create:build-one", args="{{eligible_decks[0].slug}}"</action>
</check>
<check if="user selected 'Build All Remaining'">
  <action>Use Skill tool: skill="sb-create:build-all", args="{{eligible_decks[0].slug}}"</action>
</check>
<check if="user selected 'Edit a Slide'">
  <action>Use Skill tool: skill="sb-create:edit", args="{{eligible_decks[0].slug}}"</action>
</check>
<check if="user selected 'Plan New Deck'">
  <action>Use Skill tool: skill="sb-create:plan-deck"</action>
</check>

## IN_PROGRESS State - Multiple Decks (AC #4)

When eligible_decks.length >= 2, show deck picker FIRST with max 3 decks + "Plan New Deck".

<output>
**Slide Builder**

Multiple decks in progress:
{{for each deck in eligible_decks (up to 3):}}
- **{{deck.name}}**: {{deck.built_count}}/{{deck.total_slides}} slides ({{deck.status}})
{{end}}
</output>

<ask context="Which deck would you like to work on?" header="Deck">
  <!-- Dynamically generate up to 3 deck options -->
  <choice label="{{eligible_decks[0].name}}" description="{{eligible_decks[0].built_count}}/{{eligible_decks[0].total_slides}} slides - {{eligible_decks[0].status}}" />
  <choice label="{{eligible_decks[1].name}}" description="{{eligible_decks[1].built_count}}/{{eligible_decks[1].total_slides}} slides - {{eligible_decks[1].status}}" />
  <!-- Include third deck only if exists, otherwise use Plan New Deck -->
  <choice label="Plan New Deck" description="Start planning a different deck" />
</ask>

<check if="user selected a deck name">
  <action>Store selected deck as selected_deck, then show IN_PROGRESS single-deck options for that deck</action>
</check>
<check if="user selected 'Plan New Deck'">
  <action>Use Skill tool: skill="sb-create:plan-deck"</action>
</check>

## ALL_COMPLETE State (AC #5)

<output>
**Slide Builder**

All decks complete! You have {{complete_decks.length}} finished deck(s):
{{for each deck in complete_decks:}}
- **{{deck.name}}**: {{deck.total_slides}} slides
{{end}}
</output>

<ask context="What would you like to do?" header="Action">
  <choice label="Plan New Deck" description="Create a new presentation" />
  <choice label="Edit Existing" description="Modify slides in a completed deck" />
  <choice label="Export to Google" description="Export a deck to Google Slides" />
  <choice label="Show All Commands" description="View complete command reference" />
</ask>

<check if="user selected 'Plan New Deck'">
  <action>Use Skill tool: skill="sb-create:plan-deck"</action>
</check>
<check if="user selected 'Edit Existing'">
  <!-- Show deck picker then route to edit -->
  <action>Present deck picker from complete_decks, then use Skill tool: skill="sb-create:edit", args="{{selected_deck.slug}}"</action>
</check>
<check if="user selected 'Export to Google'">
  <!-- Show deck picker then route to export -->
  <action>Present deck picker from complete_decks, then use Skill tool: skill="sb-create:export", args="{{selected_deck.slug}}"</action>
</check>
<check if="user selected 'Show All Commands'">
  <action>Use Skill tool: skill="sb:help"</action>
</check>
</state_handling>

<routing>
## Skill Routing Table

| Selection | Target Skill | Arguments |
|-----------|-------------|-----------|
| Start Setup | sb-brand:setup | none |
| Full Deck | sb-create:plan-deck | none |
| Single Slide | sb-create:plan-one | none |
| Use Template | sb-create:use-template | none |
| Continue Building | sb-create:build-one | deck_slug |
| Build All Remaining | sb-create:build-all | deck_slug |
| Edit a Slide | sb-create:edit | deck_slug |
| Plan New Deck | sb-create:plan-deck | none |
| Edit Existing | sb-create:edit | deck_slug (after picker) |
| Export to Google | sb-create:export | deck_slug (after picker) |
| Show All Commands | sb:help | none |
</routing>
