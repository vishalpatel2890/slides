---
description: 'Add a new slide to an existing deck plan'
---

# Slide Builder - Add Slide Command

This command adds a new slide to an existing deck plan through a guided conversation.

**Requirements:**
- At least one deck must exist in `.slide-builder/status.yaml` `decks:` registry
- Deck must have status: planned, building, or complete

**Behavior:**
- If a deck slug is provided as argument, validates it exists and selects it directly
- If no argument and one deck exists, auto-selects it
- If no argument and multiple decks exist, presents a numbered selection list
- Asks for position: "after N" or "at end"
- Captures slide intent, key points, tone, and visual guidance
- Suggests template from catalog based on intent
- Assigns agenda section if deck has agenda structure
- Inserts slide at position, renumbers subsequent slides
- Updates status.yaml with new total_slides count
- Optionally offers to build the new slide immediately

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/add-slide/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/add-slide/instructions.md
3. Execute the 8-step workflow:

   **Step 1: Deck Selection**
   - Read .slide-builder/status.yaml and parse `decks:` registry
   - Filter to decks with status: planned, building, or complete
   - If argument provided: validate slug exists, select deck
   - If no argument and zero decks: halt with guidance to run plan-deck
   - If no argument and one deck: auto-select
   - If no argument and multiple decks: show numbered list, ask user to choose

   **Step 2: Load Deck Plan**
   - Read output/{deck-slug}/plan.yaml
   - Parse slides array and agenda sections

   **Step 3: Position Selection**
   - Display current slides (number + intent)
   - Ask: "Where should the new slide go?"
   - Accept "after N" or "at end"
   - Validate N is between 1 and total_slides

   **Step 4: Slide Discovery**
   - Ask for slide intent (what should it convey?)
   - Ask for key points (2-4 items)
   - Ask for tone (professional/bold/technical/warm)
   - Ask for visual guidance (optional)
   - Suggest template from catalog based on intent

   **Step 5: Agenda Section Assignment**
   - If agenda exists: display sections, ask which one
   - If no agenda: set agenda_section_id to null

   **Step 6: Plan Modification**
   - Construct new slide object with status: pending
   - Renumber slides from insert_position onward (number += 1)
   - Insert new slide at correct position
   - Write updated plan.yaml

   **Step 7: Status Update**
   - Increment total_slides in status.yaml
   - If deck was "complete", set to "building"
   - Update last_modified and last_action
   - Append to history array

   **Step 8: Build Prompt**
   - Ask if user wants to build the new slide now
   - Display next steps guidance

4. Display completion summary
</steps>

## Error Handling

- **No decks exist:** Displays guidance to run `/sb:plan-deck` first
- **Invalid slug:** Shows error message with list of valid deck slugs
- **Invalid position:** Prompts user to enter valid position (1 to total_slides or "end")
- **Plan not found:** Shows error with expected file location