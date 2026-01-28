# Theme Edit Workflow Instructions

This workflow modifies an existing theme using the same gestalt feedback loop from setup.
Version 3.0 implements the full 6-phase workflow per Epic 6 Tech Spec, plus rollback functionality from Story 6.4.

```xml
<critical>This workflow modifies theme.json based on user feedback</critical>
<critical>Always save current theme to history BEFORE any modifications</critical>
<critical>Regenerate samples after EVERY feedback round for visual validation</critical>
<critical>Never save theme.json until user approves - cancel restores from version</critical>
<critical>Rollback flow: User can request "rollback" to restore a previous theme version</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 1: LOAD AND BACKUP
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="1" goal="Phase 1: Load and Backup Current Theme">
    <action>Check if .slide-builder/config/theme.json exists</action>

    <check if="theme.json does not exist">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ **No Theme Found**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You haven't set up a brand theme yet.

Run `/sb:setup` to create your theme from brand assets.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <action>HALT</action>
    </check>

    <action>Read theme.json completely and store as {{original_theme}}</action>
    <action>Store deep copy as {{working_theme}} for modifications</action>
    <action>Extract current version: {{current_version}} from theme.version (default "1.0" if missing)</action>
    <action>Parse version number: {{version_num}} = integer part of {{current_version}}</action>

    <!-- Display current theme summary (reuse /theme formatter) -->
    <action>Generate ANSI color swatches for primary, secondary, accent colors</action>
    <action>Extract typography info: heading font, body font, weights</action>
    <action>Extract shape info: border radius, shadow styles</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME EDIT: {{theme_name}} (v{{current_version}})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT COLORS
  Primary:    {{swatch_primary}} {{color_primary}}
  Secondary:  {{swatch_secondary}} {{color_secondary}}
  Accent:     {{swatch_accent}} {{color_accent}}

CURRENT TYPOGRAPHY
  Heading: {{font_heading}} ({{weight_heading}})
  Body:    {{font_body}} ({{weight_body}})

CURRENT SHAPES
  Corners: {{border_radius}}
  Shadows: {{shadow_style}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <!-- Version Manager: Save current theme to history -->
    <action>Check if .slide-builder/config/theme-history/ directory exists, create if missing</action>
    <action>Calculate next version: {{backup_version}} = {{version_num}}</action>
    <action>Generate backup filename: theme-v{{backup_version}}-{{date}}.json</action>
    <action>Write {{original_theme}} to .slide-builder/config/theme-history/theme-v{{backup_version}}-{{date}}.json</action>

    <output>
📦 Current theme saved to history as v{{backup_version}}
   File: theme-history/theme-v{{backup_version}}-{{date}}.json
    </output>

    <!-- Status Logger: Log edit started -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Update last_action: "Theme edit started"</action>
    <action>Update last_modified with current ISO 8601 timestamp</action>
    <action>Append to history: { action: "Theme edit started", timestamp: "{{iso_timestamp}}" }</action>
    <action>Append to history: { action: "Theme v{{backup_version}} saved to history", timestamp: "{{iso_timestamp}}" }</action>
    <action>Save status.yaml</action>

    <action>Initialize feedback counter: {{feedback_round}} = 0</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 2: COLLECT FEEDBACK
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="2" goal="Phase 2: Collect Feedback">
    <action>Increment {{feedback_round}} by 1</action>

    <check if="{{feedback_round}} > 3">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **Multiple Iterations Detected**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You've provided {{feedback_round}} rounds of feedback.

If you need more precise control, you can edit
`.slide-builder/config/theme.json` directly.

Continue with gestalt feedback, or type "edit json"
to open the file for direct editing.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
    </check>

    <ask>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 **What would you like to change?**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Examples of gestalt feedback:
• "Make the colors warmer"
• "Bolder fonts"
• "More minimal / less shadow"
• "More corporate / professional"
• "Softer corners"
• "Higher contrast"
• "More playful"
• "rollback" / "rollback to v1" / "restore previous"

Your feedback (or "cancel" to discard changes):
    </ask>

    <check if="user says cancel">
      <goto step="cancel">Cancel and restore</goto>
    </check>

    <!-- Rollback Detection: Route to rollback flow if user requests it -->
    <check if="feedback contains 'rollback' or 'restore version' or 'restore previous' or 'restore v' or 'go back to v'">
      <action>Store feedback as {{rollback_request}}</action>
      <action>Parse for version number: check for patterns like "v1", "v2", "version 1", "previous"</action>
      <goto step="rollback-1">Start rollback flow</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 3: APPLY CHANGES (Theme Editor Module)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="3" goal="Phase 3: Apply Changes - Theme Editor Module">
    <critical>Theme Editor interprets gestalt feedback and modifies primitives</critical>

    <action>Store user feedback as {{feedback}}</action>
    <action>Initialize {{changes_made}} as empty list</action>
    <action>Store copy of {{working_theme}}.shapes as {{old_shapes}} for template comparison</action>

    <!-- Feedback Interpretation Logic -->
    <action>Analyze {{feedback}} for keywords and apply corresponding changes:</action>

    <check if="feedback contains 'warmer' or 'warm'">
      <action>Shift primary color hue toward orange/red (add 15-30 to hue)</action>
      <action>Shift secondary color slightly warmer</action>
      <action>Reduce blue tones in accent if present</action>
      <action>Slightly increase saturation (+5-10%)</action>
      <action>Add to {{changes_made}}: "Shifted colors toward warm spectrum"</action>
    </check>

    <check if="feedback contains 'cooler' or 'cool'">
      <action>Shift primary color hue toward blue/cyan (subtract 15-30 from hue)</action>
      <action>Shift secondary color slightly cooler</action>
      <action>Add to {{changes_made}}: "Shifted colors toward cool spectrum"</action>
    </check>

    <check if="feedback contains 'bolder' or 'bold'">
      <action>Increase heading font weight (600→700 or 700→800)</action>
      <action>Increase color contrast - darken text colors by 10%</action>
      <action>If shadows exist, make them slightly more pronounced</action>
      <action>Add to {{changes_made}}: "Made typography bolder, increased contrast"</action>
    </check>

    <check if="feedback contains 'minimal' or 'minimalist'">
      <action>Reduce shadow intensity (medium→small or remove)</action>
      <action>Increase border radius slightly (+2-4px)</action>
      <action>Simplify to fewer color variations</action>
      <action>Add to {{changes_made}}: "Reduced visual complexity for minimal aesthetic"</action>
    </check>

    <check if="feedback contains 'corporate' or 'professional'">
      <action>Shift colors toward navy/gray palette if not already</action>
      <action>Use conservative border radius (4-8px)</action>
      <action>Ensure text weights are standard (400/700)</action>
      <action>Add to {{changes_made}}: "Applied corporate/professional styling"</action>
    </check>

    <check if="feedback contains 'playful' or 'fun'">
      <action>Brighten accent colors (+10-15% saturation)</action>
      <action>Increase border radius (+4-8px)</action>
      <action>Consider slightly larger heading font sizes</action>
      <action>Add to {{changes_made}}: "Added playful, energetic styling"</action>
    </check>

    <check if="feedback contains 'softer' or 'soft'">
      <action>Reduce contrast - lighten text colors by 5-10%</action>
      <action>Reduce shadow opacity</action>
      <action>Increase border radius (+4px)</action>
      <action>Add to {{changes_made}}: "Softened overall appearance"</action>
    </check>

    <check if="feedback contains 'sharper' or 'sharp' or 'crisp'">
      <action>Increase contrast - darken text colors</action>
      <action>Reduce border radius (-4px, minimum 0)</action>
      <action>Make shadows crisper (reduce blur, increase opacity)</action>
      <action>Add to {{changes_made}}: "Sharpened edges and contrast"</action>
    </check>

    <check if="feedback contains 'contrast' and ('more' or 'higher' or 'increase')">
      <action>Darken heading text color by 10-15%</action>
      <action>Increase difference between background and foreground</action>
      <action>Add to {{changes_made}}: "Increased color contrast"</action>
    </check>

    <check if="feedback contains 'corner' or 'radius' or 'rounded'">
      <action if="feedback contains 'more' or 'larger' or 'increase'">Increase border radius by 4-8px</action>
      <action if="feedback contains 'less' or 'smaller' or 'decrease' or 'sharper'">Decrease border radius by 4px</action>
      <action>Add to {{changes_made}}: "Adjusted corner radius"</action>
    </check>

    <check if="feedback contains 'shadow'">
      <action if="feedback contains 'more' or 'larger' or 'increase'">Increase shadow intensity</action>
      <action if="feedback contains 'less' or 'remove' or 'no'">Reduce or remove shadows</action>
      <action>Add to {{changes_made}}: "Adjusted shadow styling"</action>
    </check>

    <!-- Apply changes to working_theme -->
    <action>Apply all identified changes to {{working_theme}}</action>

    <!-- Update metadata -->
    <action>Calculate new version: {{new_version}} = {{version_num}} + 1</action>
    <action>Set {{working_theme}}.version = "{{new_version}}.0"</action>
    <action>Set {{working_theme}}.lastModified = current ISO 8601 timestamp</action>
    <action>Append to {{working_theme}}.meta.changeNotes (create if missing): "{{feedback}}"</action>

    <!-- Track if shapes changed for template regeneration -->
    <action>Compare {{working_theme}}.shapes with {{old_shapes}}</action>
    <action>Set {{shapes_changed}} = true if any shape primitives differ, else false</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ **Changes Applied**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{changes_made_list}}

Generating sample slides for preview...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 4: REGENERATE SAMPLES (Sample Regenerator Module)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="4" goal="Phase 4: Regenerate Sample Slides">
    <critical>Generate 6 sample slides demonstrating all theme primitives</critical>

    <action>Use frontend-design skill to generate professional sample slides</action>
    <action>Pass {{working_theme}} as the theme configuration</action>

    <action>Generate 6 sample slides to .slide-builder/config/samples/:

    **01-title.html** (Title Slide)
    - Hero typography with heading font at 72px
    - Primary color background or accent
    - Demonstrates: heading font, primary color, dark background treatment

    **02-agenda.html** (Agenda/List Slide)
    - Body text styling with bullets
    - Shows heading + body text hierarchy
    - Demonstrates: body font, text colors, list styling

    **03-process-flow.html** (Flow/Process Slide)
    - Arrows connecting boxes
    - Uses shape primitives (boxes, arrows)
    - Demonstrates: border radius, shadows, arrow styles

    **04-comparison.html** (Columns/Comparison Slide)
    - Multiple columns with boxes
    - Shows box variants (default, outlined, callout)
    - Demonstrates: multiple box styles, grid layout

    **05-callout.html** (Callout/Quote Slide)
    - Accent color usage
    - Emphasis styling
    - Demonstrates: accent color, callout box style, emphasis

    **06-technical.html** (Code/Technical Slide)
    - Monospace font display
    - Dark variant for code blocks
    - Demonstrates: mono font, dark theme variant, technical styling
    </action>

    <action>Save all 6 slides to .slide-builder/config/samples/</action>

    <action>Create index.html in samples/ that links to all 6 slides for easy navigation</action>

    <action>Open samples/index.html in browser using: open .slide-builder/config/samples/index.html</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 **Sample Deck Regenerated**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6 sample slides have been generated:
  1. Title slide (typography, primary color)
  2. Agenda slide (body text, lists)
  3. Process flow (boxes, arrows)
  4. Comparison (columns, box variants)
  5. Callout (accent color, emphasis)
  6. Technical (mono font, dark variant)

📂 Open in browser: .slide-builder/config/samples/index.html

Review the samples to see your theme changes applied.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 5: VALIDATION LOOP
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="5" goal="Phase 5: Validation Loop">
    <ask>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👀 **How does it look?**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review the sample slides in your browser.

Your options:
• **approved** - Save changes and update theme
• **cancel** - Discard all changes
• Or provide more feedback to continue refining

Your response:
    </ask>

    <check if="user says approved or 'looks good' or 'perfect' or 'save' or 'done'">
      <goto step="6">Save and complete</goto>
    </check>

    <check if="user says cancel or 'discard' or 'undo' or 'revert'">
      <goto step="cancel">Cancel and restore</goto>
    </check>

    <!-- User provided more feedback - loop back to Phase 3 -->
    <action>User provided additional feedback, returning to Phase 3</action>
    <goto step="2">Collect new feedback</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 6: SAVE AND UPDATE TEMPLATES
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="6" goal="Phase 6: Save Theme and Update Templates">
    <critical>Save final theme and regenerate templates if shapes changed</critical>

    <!-- Save theme.json -->
    <action>Write {{working_theme}} to .slide-builder/config/theme.json</action>

    <!-- Template Updater: Check if templates need regeneration -->
    <check if="{{shapes_changed}} is true">
      <output>
📐 Shape primitives changed - regenerating templates...
      </output>

      <action>Copy sample slides to templates with layout-* naming:
        - 01-title.html → templates/layout-title.html
        - 02-agenda.html → templates/layout-agenda.html
        - 03-process-flow.html → templates/layout-flow.html
        - 04-comparison.html → templates/layout-comparison.html
        - 05-callout.html → templates/layout-callout.html
        - 06-technical.html → templates/layout-technical.html
      </action>

      <action>Update status.yaml templates section with regenerated files</action>

      <output>
✅ Templates regenerated with updated shape primitives
      </output>
    </check>

    <check if="{{shapes_changed}} is false">
      <output>
ℹ️  Shape primitives unchanged - templates do not need regeneration
      </output>
    </check>

    <!-- Status Logger: Log completion -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Update theme.status: "locked"</action>
    <action>Update last_action: "Theme edited: {{feedback_summary}}"</action>
    <action>Update last_modified with current ISO 8601 timestamp</action>
    <action>Append to history: { action: "Theme edited: {{feedback_summary}}", timestamp: "{{iso_timestamp}}" }</action>
    <action>Save status.yaml</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **Theme Updated Successfully!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Theme version: v{{new_version}}.0
Previous version saved: theme-history/theme-v{{backup_version}}-{{date}}.json

Changes applied:
{{changes_made_summary}}

Your theme is ready for slide generation!

To view your theme: `/sb:theme`
To generate slides: `/sb:build-one` or `/sb:build-all`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       CANCEL STEP: Discard Changes and Restore
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="cancel" goal="Cancel - Discard Changes and Restore">
    <action>Discard {{working_theme}} - do NOT write to theme.json</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 **Changes Discarded**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All changes have been discarded.
Your original theme (v{{current_version}}) is unchanged.

Backup still available: theme-history/theme-v{{backup_version}}-{{date}}.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <!-- Status Logger: Log cancellation -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Update last_action: "Theme edit cancelled"</action>
    <action>Append to history: { action: "Theme edit cancelled - changes discarded", timestamp: "{{iso_timestamp}}" }</action>
    <action>Save status.yaml</action>

    <action>HALT</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       ROLLBACK PHASE 1: LIST AVAILABLE VERSIONS (Story 6.4 - AC 6.4.1, 6.4.2)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="rollback-1" goal="Rollback Phase 1: List Available Versions">
    <critical>Version Manager: List all available theme versions from history</critical>

    <!-- Scan theme-history directory for version files -->
    <action>Scan .slide-builder/config/theme-history/ directory for files matching pattern: theme-v*.json</action>

    <check if="no theme-v*.json files found in theme-history/">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ **No Version History Found**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

There are no previous theme versions to restore.

Version history is created when you edit themes via `/sb:theme-edit`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <action>HALT</action>
    </check>

    <!-- Parse version info from each file -->
    <action>For each theme-v{N}-{YYYY-MM-DD}.json file found:
      - Extract version number N using regex: theme-v(\d+)-
      - Extract date from filename: -(\d{4}-\d{2}-\d{2})\.json
      - Store file path for later retrieval
      - Load file and extract meta.changeNotes if available for description
    </action>

    <action>Sort versions by version number (ascending)</action>
    <action>Store list as {{available_versions}}: Array of { version: string, date: string, path: string, changeNotes?: string }</action>
    <action>Store current theme version as {{current_ver}} for reference</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 **Available Theme Versions**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current: v{{current_ver}}

Available versions in history:
{{for each version in available_versions:}}
  v{{version.version}} ({{version.date}}){{if version.changeNotes}} - {{version.changeNotes}}{{endif}}
{{endfor}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <goto step="rollback-2">Select version</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       ROLLBACK PHASE 2: SELECT VERSION (Story 6.4 - AC 6.4.3, 6.4.8)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="rollback-2" goal="Rollback Phase 2: Select Version to Restore">
    <critical>Version Manager: Validate and load selected version</critical>

    <!-- Check if version was specified in original rollback request -->
    <check if="{{rollback_request}} contains version number (v1, v2, etc.) or 'previous'">
      <action>Parse version from request:
        - "v1", "version 1", "v 1" → version = 1
        - "previous" → version = {{current_ver}} - 1
        - "rollback to v2" → version = 2
      </action>
      <action>Store as {{requested_version}}</action>
    </check>

    <check if="{{requested_version}} is not set">
      <ask>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔢 **Which version to restore?**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter version number (e.g., "1", "v1", or "previous"):
      </ask>
      <action>Parse user response to get {{requested_version}}</action>
    </check>

    <!-- Handle "previous" keyword: resolves to N-1 where N is current version -->
    <check if="{{requested_version}} == 'previous'">
      <action>Set {{requested_version}} = {{current_ver}} - 1</action>
    </check>

    <!-- Normalize version: strip "v" prefix if present -->
    <action>Normalize {{requested_version}}: remove "v" prefix, convert to integer</action>

    <!-- Validate version exists -->
    <action>Search {{available_versions}} for matching version number</action>

    <check if="requested version not found in available_versions">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ **Version Not Found**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version v{{requested_version}} does not exist.

Available versions: {{available_version_numbers_comma_separated}}

Please enter a valid version number.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <goto step="rollback-2">Re-prompt for version</goto>
    </check>

    <!-- Load selected version file -->
    <action>Find matching version entry in {{available_versions}}</action>
    <action>Store version info as {{selected_version}}: { version, date, path, changeNotes }</action>
    <action>Read and parse JSON from {{selected_version.path}}</action>
    <action>Store as {{restore_theme}}</action>

    <!-- Verify JSON structure is valid theme schema -->
    <check if="{{restore_theme}} JSON parsing fails or missing required keys (colors, typography, shapes)">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **Corrupted Version File**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version v{{requested_version}} file appears to be corrupted.

Please select a different version.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <goto step="rollback-1">Re-list versions</goto>
    </check>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ **Version v{{selected_version.version}} Selected**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: {{selected_version.date}}
{{if selected_version.changeNotes}}Notes: {{selected_version.changeNotes}}{{endif}}

Generating preview samples with v{{selected_version.version}} theme...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <goto step="rollback-3">Preview and confirm</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       ROLLBACK PHASE 3: PREVIEW AND CONFIRM (Story 6.4 - AC 6.4.4, 6.4.5)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="rollback-3" goal="Rollback Phase 3: Preview and Confirm">
    <critical>Sample Regenerator: Generate samples with selected version theme for preview</critical>

    <!-- Store old shapes for template comparison later -->
    <action>Store copy of {{original_theme}}.shapes as {{current_shapes}}</action>
    <action>Store copy of {{restore_theme}}.shapes as {{restore_shapes}}</action>

    <!-- Generate sample slides with the selected version theme -->
    <action>Use frontend-design skill to generate professional sample slides</action>
    <action>Pass {{restore_theme}} as the theme configuration</action>

    <action>Generate 6 sample slides to .slide-builder/config/samples/:

    **01-title.html** (Title Slide)
    - Hero typography with heading font at 72px
    - Primary color background or accent
    - Demonstrates: heading font, primary color, dark background treatment

    **02-agenda.html** (Agenda/List Slide)
    - Body text styling with bullets
    - Shows heading + body text hierarchy
    - Demonstrates: body font, text colors, list styling

    **03-process-flow.html** (Flow/Process Slide)
    - Arrows connecting boxes
    - Uses shape primitives (boxes, arrows)
    - Demonstrates: border radius, shadows, arrow styles

    **04-comparison.html** (Columns/Comparison Slide)
    - Multiple columns with boxes
    - Shows box variants (default, outlined, callout)
    - Demonstrates: multiple box styles, grid layout

    **05-callout.html** (Callout/Quote Slide)
    - Accent color usage
    - Emphasis styling
    - Demonstrates: accent color, callout box style, emphasis

    **06-technical.html** (Code/Technical Slide)
    - Monospace font display
    - Dark variant for code blocks
    - Demonstrates: mono font, dark theme variant, technical styling
    </action>

    <action>Save all 6 slides to .slide-builder/config/samples/</action>
    <action>Create/update index.html in samples/ that links to all 6 slides</action>
    <action>Open samples/index.html in browser using: open .slide-builder/config/samples/index.html</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 **Sample Deck Regenerated with v{{selected_version.version}} Theme**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6 sample slides have been generated showing v{{selected_version.version}} theme:
  1. Title slide (typography, primary color)
  2. Agenda slide (body text, lists)
  3. Process flow (boxes, arrows)
  4. Comparison (columns, box variants)
  5. Callout (accent color, emphasis)
  6. Technical (mono font, dark variant)

📂 Open in browser: .slide-builder/config/samples/index.html

Review the samples to preview the v{{selected_version.version}} theme.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <!-- Calculate version numbers for confirmation message -->
    <action>Set {{backup_new_version}} = {{current_ver}} + 1</action>
    <action>Set {{restored_new_version}} = {{current_ver}} + 2</action>

    <ask>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **Confirm Rollback**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Restore v{{selected_version.version}} from {{selected_version.date}}?

What will happen:
• Current theme (v{{current_ver}}) will be saved as v{{backup_new_version}}
• v{{selected_version.version}} settings will be restored as v{{restored_new_version}}
• No version history will be deleted

**Confirm?** (y/yes to proceed, n/no/cancel to abort)
    </ask>

    <check if="user says 'n' or 'no' or 'cancel' or 'abort'">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 **Rollback Cancelled**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No changes have been made.
Your current theme (v{{current_ver}}) is unchanged.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
      <action>HALT</action>
    </check>

    <check if="user says 'y' or 'yes'">
      <goto step="rollback-4">Execute restore</goto>
    </check>

    <!-- If response is unclear, re-prompt -->
    <output>
Please respond with "y" (yes) to proceed or "n" (no) to cancel.
    </output>
    <goto step="rollback-3">Re-prompt confirmation</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       ROLLBACK PHASE 4: RESTORE AND VERSION (Story 6.4 - AC 6.4.6, 6.4.7, 6.4.9)
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step n="rollback-4" goal="Rollback Phase 4: Restore Theme and Update History">
    <critical>Execute rollback: Save current state, restore selected version, regenerate templates if needed</critical>

    <!-- STEP 1: Save current theme to history BEFORE restore (AC 6.4.6 - Preserve current state) -->
    <output>
📦 Saving current theme to history...
    </output>

    <action>Read current .slide-builder/config/theme.json as {{current_theme_backup}}</action>
    <action>Set backup version number: {{backup_v}} = {{current_ver}} + 1</action>
    <action>Generate backup filename: theme-v{{backup_v}}-{{date}}.json</action>
    <action>Write {{current_theme_backup}} to .slide-builder/config/theme-history/theme-v{{backup_v}}-{{date}}.json</action>
    <action>Verify backup file exists and is valid JSON</action>

    <output>
✓ Current theme saved as v{{backup_v}} (pre-rollback backup)
    </output>

    <!-- Log backup to status.yaml -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Append to history: { action: "Theme v{{backup_v}} saved to history (pre-rollback backup)", timestamp: "{{iso_timestamp}}" }</action>
    <action>Save status.yaml</action>

    <!-- STEP 2: Prepare restored theme with new version number (AC 6.4.7 - New version number) -->
    <action>Set restored version number: {{restored_v}} = {{backup_v}} + 1</action>
    <action>Copy {{restore_theme}} to {{final_theme}}</action>
    <action>Update {{final_theme}}.version = "{{restored_v}}.0"</action>
    <action>Update {{final_theme}}.lastModified = current ISO 8601 timestamp</action>
    <action>Append to {{final_theme}}.meta.changeNotes (create array if missing): "Rolled back from v{{current_ver}} to v{{selected_version.version}} settings"</action>

    <!-- STEP 3: Write restored theme to theme.json -->
    <output>
🔄 Restoring v{{selected_version.version}} theme settings...
    </output>

    <action>Write {{final_theme}} to .slide-builder/config/theme.json</action>
    <action>Verify save succeeded by reading back and validating JSON</action>

    <!-- STEP 4: Check if templates need regeneration (AC 6.4.9) -->
    <action>Compare {{current_shapes}} with {{restore_shapes}}</action>
    <action>Compare these keys for differences:
      - shapes.borderRadius.*
      - shapes.shadow.*
      - shapes.border.*
      - components.box.*.borderRadius
      - components.box.*.shadow
      - components.arrow.*
    </action>
    <action>Set {{templates_need_regeneration}} = true if ANY shape primitives differ, else false</action>

    <check if="{{templates_need_regeneration}} is true">
      <output>
📐 Shape primitives changed - regenerating templates...
      </output>

      <action>Copy sample slides to templates with layout-* naming:
        - samples/01-title.html → templates/layout-title.html
        - samples/02-agenda.html → templates/layout-agenda.html
        - samples/03-process-flow.html → templates/layout-flow.html
        - samples/04-comparison.html → templates/layout-comparison.html
        - samples/05-callout.html → templates/layout-callout.html
        - samples/06-technical.html → templates/layout-technical.html
      </action>

      <action>Update status.yaml templates section with regenerated files</action>

      <output>
✓ Templates regenerated with restored shape primitives
      </output>

      <!-- Log template regeneration -->
      <action>Read .slide-builder/status.yaml</action>
      <action>Append to history: { action: "Templates regenerated after rollback (shapes changed)", timestamp: "{{iso_timestamp}}" }</action>
      <action>Save status.yaml</action>
    </check>

    <check if="{{templates_need_regeneration}} is false">
      <output>
ℹ️  Shape primitives unchanged - templates do not need regeneration
      </output>
    </check>

    <!-- STEP 5: Update status.yaml with rollback completion -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Update theme.status: "locked"</action>
    <action>Update last_action: "Theme rolled back to v{{selected_version.version}}"</action>
    <action>Update last_modified with current ISO 8601 timestamp</action>
    <action>Append to history: { action: "Theme rolled back to v{{selected_version.version}} (now v{{restored_v}})", timestamp: "{{iso_timestamp}}" }</action>
    <action>Save status.yaml</action>

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **Theme Rollback Complete!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Theme restored to v{{selected_version.version}} settings (now v{{restored_v}}.0)
Previous state saved as v{{backup_v}}

**What was done:**
• Saved current theme as v{{backup_v}} (backup)
• Restored v{{selected_version.version}} settings
• Theme is now v{{restored_v}}.0
{{if templates_need_regeneration}}• Templates regenerated (shape primitives changed){{endif}}

**Version history preserved** - you can rollback again if needed.

To view your theme: `/sb:theme`
To generate slides: `/sb:build-one` or `/sb:build-all`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <action>HALT</action>
  </step>

</workflow>
```

## Color Manipulation Guide

When modifying colors, use these techniques:

### Hex to HSL Conversion (for hue shifting)
1. Convert hex to RGB
2. Convert RGB to HSL
3. Modify H (hue), S (saturation), or L (lightness)
4. Convert back to hex

### Warming Colors
- Add 15-30 to hue (shifts toward orange/red)
- Increase saturation slightly (+5-10)
- Example: Blue #2563EB → Warmer #4F46E5 (purple-ish) or #6366F1

### Cooling Colors
- Subtract 15-30 from hue (shifts toward blue/cyan)
- Example: #CCFF00 (lime) → #00FFCC (cyan) when cooled significantly

### Increasing Contrast
- For light backgrounds: darken text colors (reduce L by 10-15)
- For dark backgrounds: lighten text colors (increase L by 10-15)

### Softening
- Reduce saturation by 10-20
- Move lightness toward middle (40-60)
- Increase transparency for shadows

## Shape Primitives Comparison

When checking if shapes changed, compare these keys:
- `shapes.borderRadius.*`
- `shapes.shadow.*`
- `shapes.border.*`
- `components.box.*.borderRadius`
- `components.box.*.shadow`
- `components.arrow.*`

If ANY of these differ between old and new theme, set {{shapes_changed}} = true.

## Sample Slide Specifications

Each sample must demonstrate specific primitives:

| Slide | Primary Demonstration |
|-------|----------------------|
| 01-title | Hero typography (72px), primary color, dark bg |
| 02-agenda | Body text, heading hierarchy, bullet styling |
| 03-flow | Box shapes, arrows, shadows, borders |
| 04-comparison | Multiple columns, box variants |
| 05-callout | Accent color, emphasis styling, callout box |
| 06-technical | Monospace font, dark variant, code styling |
