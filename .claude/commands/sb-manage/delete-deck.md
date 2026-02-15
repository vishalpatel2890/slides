---
description: 'Delete a deck and all its files'
---

# Slide Builder - Delete Deck Command

This command permanently deletes a deck from the Slide Builder system, removing all files and the registry entry.

**Requirements:**
- At least one deck must exist in `.slide-builder/status.yaml` `decks:` registry
- User must confirm deletion before any files are removed

**Behavior:**
- If a deck slug is provided as argument, validates it exists and selects it directly
- If no argument and one deck exists, auto-selects it
- If no argument and multiple decks exist, presents a numbered selection list
- Shows deck details (name, status, slide count, location) and asks for confirmation
- On confirmation: deletes `output/{deck-slug}/` directory, removes deck from registry, logs to history
- On cancel: no changes made

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/delete-deck/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/delete-deck/instructions.md
3. Execute the 4-step workflow:

   **Step 1: Deck Selection**
   - Read .slide-builder/status.yaml and parse `decks:` registry
   - If argument provided: validate slug exists, select deck
   - If no argument and zero decks: "No decks found. Nothing to delete."
   - If no argument and one deck: auto-select
   - If no argument and multiple decks: show numbered list, ask user to choose
   - If invalid slug: show error with valid slugs

   **Step 2: Confirmation**
   - Display deck name, status, slide count, output path
   - Ask user to confirm (y/n)
   - If cancelled: "Cancelled. No files or status changes were made."

   **Step 3: Delete Files**
   - Execute `rm -rf output/{deck-slug}/` to remove all deck files
   - If directory missing: warn but continue with registry cleanup

   **Step 4: Update Status**
   - Remove deck entry from `decks:` section in status.yaml
   - Append history entry: "Deleted deck: {name} ({slug}, {count} slides)"
   - Update `last_modified` timestamp

4. Display deletion summary
</steps>

## Error Handling

- **No decks exist:** Displays "No decks found. Nothing to delete." and exits
- **Invalid slug:** Shows error message with list of valid deck slugs
- **Directory already missing:** Warns user but still removes registry entry and logs history
- **User cancels:** No files or status changes are made
