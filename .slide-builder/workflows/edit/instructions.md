# Edit Workflow Instructions

This workflow enables slide layout editing via natural language while preserving user text edits.

**Story 4.1: Edit Command Invocation** - Implements AC4.1.1-AC4.1.6
**Story 4.2: Natural Language Layout Changes** - Implements AC4.2.1-AC4.2.9
**Story 4.3: Edit Preservation Across Regenerations** - Implements AC4.3.1-AC4.3.9

```xml
<critical>This workflow modifies slide layout while preserving text edits</critical>
<critical>Always read state file before regenerating to preserve user edits</critical>
<critical>Display slide info summary before prompting for edit instruction</critical>
<critical>Use frontend-design skill for layout regeneration</critical>
<critical>Reapply saved edits to matching data-field selectors after regeneration</critical>
<critical>Preserve orphaned edits in state file - never delete user content</critical>
<critical>Slides are in output/{deck_slug}/slides/ (deck) or output/singles/ (single)</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: Mode Detection and Slide Targeting (AC4.1.1, AC4.1.2, AC4.1.6) -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Detect mode and determine target slide">
    <action>Read .slide-builder/status.yaml to get current mode and slide count</action>
    <action>Extract: mode (single|deck), total_slides, built_count, output_folder, deck_slug</action>
    <action>Parse command arguments for optional slide_number</action>

    <!-- AC4.1.6: No slides exist -->
    <check if="built_count == 0">
      <output>
**No Slides Found**

There are no slides to edit yet.

Run `/sb:build-one` first to create a slide, then come back to edit it.
      </output>
      <action>HALT</action>
    </check>

    <!-- AC4.1.1: Single mode - no number needed -->
    <check if="mode == 'single'">
      <!-- Get output_folder from status.yaml, default to output/singles if not set -->
      <action>Set output_folder = status.output_folder OR "output/singles"</action>
      <action>Glob output/singles/*.html to find the single slide file</action>
      <action>Set target_slide_path = first matching file in output/singles/</action>
      <action>Set target_state_path = target_slide_path with .html replaced by -state.json</action>
      <action>Set slide_display_name = "single slide"</action>

      <check if="no slide files found in output/singles/">
        <output>
**No Slide Found**

No slide exists in `output/singles/`.

Run `/sb:build-one` first to create your slide.
        </output>
        <action>HALT</action>
      </check>

      <goto step="2">Load and analyze slide</goto>
    </check>

    <!-- AC4.1.2, AC4.1.3: Deck mode - number required or prompt -->
    <check if="mode == 'deck'">
      <!-- Get deck_slug from status.yaml to find output folder -->
      <action>Set deck_slug = status.deck_slug (required for deck mode)</action>
      <action>Set slides_folder = output/{{deck_slug}}/slides</action>

      <check if="deck_slug is not set">
        <output>
**Deck Not Built**

No deck has been built yet. The deck_slug is not set in status.yaml.

Run `/sb:build-one` or `/sb:build-all` first to build your deck slides.
        </output>
        <action>HALT</action>
      </check>

      <check if="slide_number argument provided">
        <action>Parse slide_number from argument</action>

        <!-- AC4.1.3: Invalid slide number -->
        <check if="slide_number < 1 OR slide_number > total_slides">
          <output>
**Invalid Slide Number**

Slide {{slide_number}} doesn't exist.

**Valid range:** 1-{{total_slides}}

Try again with a valid slide number, e.g., `/sb:edit 1`
          </output>
          <action>HALT</action>
        </check>

        <action>Set target_slide_path = output/{{deck_slug}}/slides/slide-{{slide_number}}.html</action>
        <action>Set target_state_path = output/{{deck_slug}}/slides/slide-{{slide_number}}-state.json</action>
        <action>Set slide_display_name = "Slide {{slide_number}}"</action>

        <!-- Verify slide file exists -->
        <check if="target_slide_path does not exist">
          <output>
**Slide Not Built**

Slide {{slide_number}} hasn't been built yet.

Run `/sb:build-one` to build this slide first.
          </output>
          <action>HALT</action>
        </check>
      </check>

      <!-- No slide number in deck mode - prompt user -->
      <check if="slide_number argument NOT provided">
        <output>
**Deck Mode - Select Slide**

Deck: {{deck_slug}}
You have {{total_slides}} slides in your deck.
        </output>

        <ask>Which slide would you like to edit? (1-{{total_slides}})</ask>

        <action>Parse user response as slide_number</action>

        <check if="slide_number < 1 OR slide_number > total_slides">
          <output>
**Invalid Selection**

Please enter a number between 1 and {{total_slides}}.
          </output>
          <action>Return to ask prompt</action>
        </check>

        <action>Set target_slide_path = output/{{deck_slug}}/slides/slide-{{slide_number}}.html</action>
        <action>Set target_state_path = output/{{deck_slug}}/slides/slide-{{slide_number}}-state.json</action>
        <action>Set slide_display_name = "Slide {{slide_number}}"</action>
      </check>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 2: Load and Analyze Slide (AC4.1.4, AC4.2.1, AC4.2.2)             -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Load slide and display summary">
    <!-- AC4.2.1: Read current slide HTML -->
    <action>Read complete HTML content from target_slide_path</action>
    <action>Store as current_slide_html for use in layout regeneration</action>

    <!-- Extract layout type from HTML -->
    <action>Analyze HTML structure to determine layout type:
      - Check for .slide class structure
      - Look for layout indicators: columns, flow, title-only, comparison, etc.
      - Check title tag for layout hints
      - Examine CSS grid/flex properties
    </action>

    <!-- Extract editable fields -->
    <action>Parse HTML to find all elements with data-field attribute:
      - Count total contenteditable elements
      - Extract data-field values as field_names list (e.g., title, subtitle, body-1, bullet-1)
      - Store field_names_list for preserve_fields constraint
    </action>

    <!-- AC4.2.2: Load state file for saved edits -->
    <action>Check if target_state_path exists</action>
    <check if="state file exists">
      <action>Read and parse JSON from target_state_path</action>
      <action>Extract edits array as saved_edits</action>
      <action>Extract edits array length as edit_count</action>
      <action>Extract orphanedEdits array if present (may be empty)</action>
      <action>Extract regenerationCount if present (default to 0)</action>
      <action>Note: Schema is { slide, edits: [{selector, content}], orphanedEdits?: [], lastModified, regenerationCount? }</action>
    </check>
    <check if="state file does not exist">
      <action>Set edit_count = 0</action>
      <action>Set saved_edits = []</action>
      <action>Set orphanedEdits = []</action>
      <action>Set regenerationCount = 0</action>
    </check>

    <!-- AC4.1.4: Display slide content summary -->
    <output>
**Editing: {{slide_display_name}}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Layout:** {{layout_type}}
**Editable fields:** {{field_count}} ({{field_names_list}})
**Saved text edits:** {{edit_count}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3: Collect Edit Request (AC4.1.5)                                 -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Prompt for edit instruction">
    <!-- AC4.1.5: Prompt user for edit instructions -->
    <ask>
**Describe the layout change you want:**

Examples:
- "Move the diagram to the right"
- "Add a fourth column"
- "Make the title bigger"
- "Change to a two-column layout"
- "Add a subtitle under the title"
- "Remove the background pattern"

Your edit:
    </ask>

    <action>Capture user's natural language edit instruction as edit_request</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4: Confirm Understanding                                          -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Confirm edit interpretation">
    <action>Analyze edit_request to understand intent</action>
    <action>Generate interpretation of what will be changed</action>

    <output>
**I'll make this change:**

{{interpretation_of_edit_request}}
    </output>

    <check if="edit_count > 0">
      <output>
**Your {{edit_count}} text edit(s) will be preserved.**
      </output>
    </check>

    <ask>Proceed with this edit? (y/n)</ask>

    <check if="user says no">
      <output>
No problem. Let's try again.
      </output>
      <goto step="3">Return to edit prompt</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5A: Layout Regeneration (AC4.2.3, AC4.2.5)                        -->
  <!-- Story 4.2: Natural Language Layout Changes                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Regenerate slide layout via frontend-design skill">
    <output>
**Regenerating layout...**
    </output>

    <!-- AC4.2.3: Load theme for style consistency -->
    <action>Read .slide-builder/config/theme.json</action>
    <action>Parse theme JSON to extract colors, typography, shapes, components, and personality</action>

    <!-- Prepare frontend-design skill invocation -->
    <action>Construct edit_context object:
      edit_context:
        slide_path: "{{target_slide_path}}"
        current_html: "{{current_slide_html}}"
        instruction: "{{edit_request}}"
        theme: (full theme.json contents)
        constraints:
          dimensions: "1920x1080"
          required_attributes:
            - "contenteditable='true' on ALL text elements"
            - "data-field attribute on ALL text elements"
          preserve_fields: {{field_names_list}}
          style_requirements:
            - "Include theme CSS variables in :root"
            - "Use theme colors consistently"
            - "Use theme typography (font-family, sizes, weights)"
            - "Maintain brand personality: {{theme.personality.classification}}"
    </action>

    <!-- AC4.2.3: Invoke frontend-design skill -->
    <action>Invoke frontend-design skill with edit_context:
      - Pass current HTML as reference for structure
      - Pass edit instruction for layout modification
      - Pass theme for style consistency
      - Pass constraints for required attributes
      - Instruct skill to preserve existing data-field names where semantically equivalent
      - Request new HTML layout that implements the edit instruction
    </action>

    <action>Receive new HTML layout from frontend-design skill as regenerated_html</action>

    <!-- AC4.2.5: Validate regenerated HTML -->
    <action>Validate regenerated_html:
      - Has contenteditable="true" on all text elements
      - Has data-field attributes on all text elements
      - Has theme CSS variables in :root style block
      - Has correct 1920x1080 dimensions in viewport/body
      - Has auto-save JavaScript script
    </action>

    <check if="validation fails for required attributes">
      <action>Add missing contenteditable="true" attributes to text elements</action>
      <action>Add missing data-field attributes with generated unique names</action>
      <action>Inject theme CSS variables into :root if missing</action>
      <action>Log validation warning</action>
    </check>

    <check if="auto-save script is missing">
      <action>Inject standard auto-save JavaScript script before closing body tag:
        - localStorage availability check
        - saveEdits() function that captures all contenteditable innerHTML
        - Event listeners on blur and input for auto-save
        - restoreEdits() function to restore from localStorage on page load
      </action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5B: Edit Reapplication (AC4.2.4, AC4.2.6, AC4.2.7)                -->
  <!-- Story 4.2: Preserve user text edits across regeneration                 -->
  <!-- Story 4.3: Orphan detection, orphanedEdits management (AC4.3.1-AC4.3.7) -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5b" goal="Reapply saved edits to regenerated HTML">
    <!-- AC4.3.1: Read all edits from slide-state.json (already loaded in Step 2) -->
    <action>Initialize applied_edits = []</action>
    <action>Initialize new_orphaned_edits = []</action>

    <!-- AC4.3.3, AC4.3.4: Match selectors and inject content -->
    <!-- AC4.2.4, AC4.2.6: Reapply saved edits -->
    <action>For each edit in saved_edits:
      1. Extract selector (e.g., "[data-field='title']")
      2. Extract field name from selector (e.g., "title")
      3. Extract saved content
      4. Search regenerated_html for element matching data-field selector
      5. If element FOUND (AC4.3.4):
         - Replace element's innerHTML with saved content
         - Add to applied_edits: {selector, content, status: "applied"}
         - Log: "Applied edit to {{field_name}}"
      6. If element NOT FOUND (AC4.3.6):
         - Add to new_orphaned_edits: {
             selector: selector,
             content: saved content,
             orphanedAt: current ISO timestamp,
             reason: "Field '{{field_name}}' not found in regenerated layout"
           }
         - Log: "Orphaned edit: {{field_name}} - field not in new layout"
    </action>

    <!-- AC4.2.7, AC4.3.6: Preserve all orphaned edits - NEVER delete -->
    <action>Merge existing orphanedEdits with new_orphaned_edits:
      - Keep all previously orphaned edits (never delete user content)
      - Add newly orphaned edits with orphanedAt timestamp and reason
      - Store as merged_orphaned_edits
    </action>

    <!-- AC4.3.8: New fields use default content (no action needed - frontend-design handles this) -->
    <action>Store final HTML with edits applied as final_html</action>

    <!-- AC4.3.7: Display orphan warning with content preview -->
    <check if="new_orphaned_edits is not empty">
      <output>
⚠️ **Warning:** {{new_orphaned_edits.length}} edit(s) couldn't be matched to the new layout
{{for each orphaned edit:}}
- {{field_name}}: "{{content_preview_truncated_to_30_chars}}..." (orphaned)
{{end for}}

See slide-state.json for full orphaned content.
      </output>
    </check>

    <output>
**Edits Preserved:**
- Applied: {{applied_edits.length}} edit(s)
- Orphaned: {{new_orphaned_edits.length}} edit(s)
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5C: Save and Report (AC4.2.8, AC4.2.9)                            -->
  <!-- Story 4.2: Persist regenerated slide and update status                  -->
  <!-- Story 4.3: regenerationCount tracking, orphan warnings (AC4.3.5-AC4.3.9)-->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5c" goal="Save regenerated slide and update state">
    <!-- AC4.2.8, AC4.3.5: Save regenerated slide to original location -->
    <action>Write final_html to target_slide_path</action>
    <action>Verify file was written successfully</action>

    <!-- AC4.3.5, AC4.3.9: Update slide-state.json with enhanced schema -->
    <action>Prepare updated state file with Story 4.3 schema:
      {
        "slide": "{{slide_identifier}}",
        "edits": {{applied_edits as selector/content array}},
        "orphanedEdits": {{merged_orphaned_edits}},
        "lastModified": "{{current ISO timestamp}}",
        "regenerationCount": {{regenerationCount + 1}}
      }
    </action>
    <action>Write updated state JSON to target_state_path</action>

    <!-- AC4.2.9, AC4.3.7: Update status.yaml with orphan details -->
    <action>Read current .slide-builder/status.yaml</action>
    <action>Update status.yaml:
      - Set last_action: "Layout edited: {{edit_request_summary}}"
      - Set last_modified: current ISO timestamp
      - Append to history array:
          action: "Layout edited via /sb:edit: {{edit_request_summary}}"
          timestamp: current ISO timestamp
          preserved_edits: {{applied_edits.length}}
          orphaned_edits: {{new_orphaned_edits.length}}
          orphaned_fields: {{list of orphaned field names if any}}
    </action>
    <action>Write updated status.yaml</action>

    <output>
**Slide Updated**

Layout changed: {{change_description}}
Preserved edits: {{applied_edits.length}}
Regeneration count: {{regenerationCount + 1}}
{{orphan_warning_if_any}}

Preview: Open the slide in your browser to see changes.
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 6: Continue or Complete                                           -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="6" goal="Check for more edits">
    <ask>
Any more edits? (describe another change, or "done" to finish)
    </ask>

    <check if="user wants more edits (not 'done')">
      <action>Set edit_request = user response</action>
      <!-- Reload slide and state to get latest content after previous edit -->
      <action>Re-read target_slide_path to get updated HTML</action>
      <action>Re-read target_state_path to get updated edits</action>
      <goto step="4">Confirm and apply next edit</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 7: Completion                                                     -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="7" goal="Complete editing session">
    <output>
**Edit Complete**

{{slide_display_name}} saved. All text edits preserved.

**Summary:**
- Layout changes applied: {{edit_count_this_session}}
- Text edits preserved: {{total_preserved_edits}}
- Orphaned edits: {{total_orphaned_edits}} (recoverable from state file)

**Next steps:**
- Preview slide in browser to verify changes
- Run `/sb:edit` again for more layout changes
- Run `/sb:export` when ready to export to Google Slides
    </output>
  </step>

</workflow>
```

## Error Messages Reference

| Scenario | Error Message |
|----------|---------------|
| No slides exist | "No slides to edit yet. Run `/sb:build-one` first." |
| Invalid slide number | "Slide X doesn't exist. Valid range: 1-N" |
| Slide not built (deck) | "Slide X hasn't been built yet. Run `/sb:build-one`." |
| Single slide missing | "No slide at `.slide-builder/single/slide.html`. Run `/sb:build-one`." |
| Orphaned edits | "Warning: X edit(s) couldn't be matched to the new layout. Preserved in state file." |

## Slide Info Display Format

```
**Editing: [Slide Name]**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Layout:** [Type - Title, Two-Column, Flow, etc.]
**Editable fields:** [Count] ([field1, field2, ...])
**Saved text edits:** [Count]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Layout Type Detection Heuristics

| HTML Pattern | Layout Type |
|--------------|-------------|
| Single h1, minimal content | Title Slide |
| Multiple columns (flex/grid) | Multi-Column |
| Ordered/unordered lists | List/Agenda |
| Flow arrows or process | Process Flow |
| Side-by-side comparison | Comparison |
| Code blocks | Technical/Code |
| Large single element | Callout/Quote |

## frontend-design Skill Invocation

The edit workflow invokes the frontend-design skill with this context structure:

```yaml
edit_context:
  slide_path: ".slide-builder/single/slide.html"
  current_html: "<full HTML of current slide>"
  instruction: "User's natural language edit request"
  theme:
    name: "Brand Name"
    colors:
      primary: "#CCFF00"
      secondary: "#5DBAB6"
      # ... full theme.json colors
    typography:
      fonts:
        heading: "'Outfit', sans-serif"
        # ... full typography
    # ... all theme sections
  constraints:
    dimensions: "1920x1080"
    required_attributes:
      - "contenteditable='true'"
      - "data-field"
    preserve_fields:
      - "title"
      - "subtitle"
      - "logo"
      # ... all existing data-field values
```

## Edit Reapplication Algorithm

```
For each edit in slide-state.json.edits:
    ├─→ selector: "[data-field='title']"
    │   content: "My Custom Title"
    ↓
Search regenerated HTML for element matching selector
    ├─→ FOUND: <h1 data-field="title">Default</h1>
    │   │
    │   ↓
    │   Replace: <h1 data-field="title">My Custom Title</h1>
    │   Mark: applied
    │
    └─→ NOT FOUND: No element with data-field="title"
        │
        ↓
        Add to orphanedEdits:
        {
          selector: "[data-field='title']",
          content: "My Custom Title",
          orphanedAt: "2026-01-27T11:00:00Z",
          reason: "Field not found in regenerated layout"
        }
        Log warning to user
```

## State File Schema (Enhanced for Story 4.2)

```json
{
  "slide": "single",
  "edits": [
    {
      "selector": "[data-field='title']",
      "content": "User's edited title text"
    },
    {
      "selector": "[data-field='subtitle']",
      "content": "User's edited subtitle"
    }
  ],
  "orphanedEdits": [
    {
      "selector": "[data-field='removed-field']",
      "content": "Content from removed element",
      "orphanedAt": "2026-01-27T11:00:00Z",
      "reason": "Field not found in regenerated layout"
    }
  ],
  "lastModified": "2026-01-27T11:00:00Z",
  "regenerationCount": 2
}
```

## status.yaml History Entry Format

```yaml
history:
  - action: "Layout edited via /sb:edit: Add a subtitle below the title"
    timestamp: "2026-01-27T11:00:00Z"
    preserved_edits: 3
    orphaned_edits: 0
```
