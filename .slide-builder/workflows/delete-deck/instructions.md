# Delete Deck Workflow Instructions

This workflow deletes a deck and all its files from the Slide Builder system.

```xml
<critical>This workflow permanently deletes a deck - files cannot be recovered</critical>
<critical>Always confirm with user before deletion</critical>
<critical>Update status.yaml after file deletion (remove deck entry, append history)</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 1: Deck Selection                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Select deck for deletion">
    <action>Read .slide-builder/status.yaml completely</action>
    <action>Parse the `decks:` section to get all deck entries</action>

    <!-- Handle argument provided -->
    <check if="command argument (deck slug) is provided">
      <action>Look up the slug in `decks:` registry keys</action>

      <check if="slug exists in registry">
        <action>Set {{deck_slug}} = provided slug</action>
        <action>Set {{deck}} = the matching deck entry</action>
        <goto step="2">Show confirmation</goto>
      </check>

      <check if="slug NOT found in registry">
        <action>Collect all valid deck slugs from `decks:` keys</action>
        <output>
**Error: Deck not found**

No deck with slug "{{provided_slug}}" exists.

**Available decks:**
{{numbered_list_of_valid_slugs}}
        </output>
        <action>HALT</action>
      </check>
    </check>

    <!-- No argument provided -->
    <action>Count entries in `decks:` section</action>

    <check if="zero decks in registry">
      <output>
No decks found. Nothing to delete.
      </output>
      <action>HALT</action>
    </check>

    <check if="exactly one deck in registry">
      <action>Auto-select that deck</action>
      <action>Set {{deck_slug}} = the single deck key</action>
      <action>Set {{deck}} = the single deck entry</action>
      <goto step="2">Show confirmation</goto>
    </check>

    <check if="multiple decks in registry">
      <action>Present numbered list of all decks:
        1. "Deck Name" (status, X/Y slides) - deck-slug
        2. "Deck Name" (status, X/Y slides) - deck-slug
        ...
      </action>
      <ask>Which deck would you like to delete? (enter number)</ask>
      <action>Set {{deck_slug}} = selected deck key</action>
      <action>Set {{deck}} = selected deck entry</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 2: Confirmation                                                     -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Display deck details and confirm deletion">
    <output>
**Delete deck:** "{{deck.name}}"
  Status: {{deck.status}}
  Slides: {{deck.built_count}}/{{deck.total_slides}}
  Location: {{deck.output_folder}}/

This will permanently delete all files. Continue? (y/n)
    </output>

    <ask>Confirm deletion (y/n)</ask>

    <check if="user declines (n or no)">
      <output>
Cancelled. No files or status changes were made.
      </output>
      <action>HALT</action>
    </check>

    <check if="user confirms (y or yes)">
      <goto step="3">Delete files</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 3: Delete Deck Files                                                -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Delete the deck directory and all files">
    <action>Check if directory exists: output/{{deck_slug}}/</action>

    <check if="directory exists">
      <action>Execute: rm -rf output/{{deck_slug}}/</action>
      <action>Verify directory is gone</action>
      <output>
Deleted directory: output/{{deck_slug}}/
      </output>
    </check>

    <check if="directory does NOT exist">
      <output>
Warning: Directory output/{{deck_slug}}/ was not found (may have been manually deleted).
Proceeding with registry cleanup...
      </output>
    </check>

    <goto step="4">Update status.yaml</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 4: Update status.yaml                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Remove deck from registry, append history, update timestamp">
    <action>Read .slide-builder/status.yaml</action>

    <action>Remove the entire {{deck_slug}} entry block from `decks:` section (all its fields: name, status, total_slides, built_count, current_slide, output_folder, created_at, last_modified, last_action, and source_template if present)</action>

    <action>Append new entry to `history:` array:
      - action: "Deleted deck: {{deck.name}} ({{deck_slug}}, {{deck.total_slides}} slides)"
        timestamp: "{{current_iso_timestamp}}"
    </action>

    <action>Update `last_modified:` to current ISO 8601 timestamp</action>

    <action>Save status.yaml, preserving all other content and comments</action>

    <output>
**Deck deleted successfully**

- Removed: "{{deck.name}}" ({{deck_slug}})
- Files: output/{{deck_slug}}/ deleted
- Registry: deck entry removed from status.yaml
- History: deletion logged
    </output>
  </step>

</workflow>
```
