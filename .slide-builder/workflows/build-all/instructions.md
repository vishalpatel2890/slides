# Build All Workflow Instructions

This workflow builds all remaining slides in a deck plan, with error continuation and progress tracking.
Wraps the per-slide generation logic from build-one in a batch loop.

```xml
<critical>This workflow builds ALL pending slides in a deck plan</critical>
<critical>Requires mode == "deck" in status.yaml</critical>
<critical>MUST continue on individual slide errors (don't abort batch)</critical>
<critical>All slides must have contenteditable="true" and data-field attributes</critical>
<critical>Slides output to output/{deck-slug}/slides/ (NOT .slide-builder/deck/slides/)</critical>
<critical>Deck slug generated from deck_name: lowercase, spaces to hyphens, remove special chars</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: Prerequisites Check                                             -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Verify prerequisites and count pending slides">
    <action>Read .slide-builder/status.yaml to get current mode</action>

    <check if="mode is NOT 'deck'">
      <output>
**Error: Deck Mode Required**

`/build-all` is for deck mode only.

Current mode: {{current_mode}}

To use batch build:
1. Run `/sb:plan-deck` to create a deck plan
2. Then run `/sb:build-all` to build all slides
      </output>
      <action>HALT</action>
    </check>

    <!-- Get deck_slug from status.yaml to find plan location -->
    <action>Read current_deck_slug from status.yaml</action>

    <check if="current_deck_slug is not set">
      <output>
**No Active Deck**

No deck is currently active. Run `/sb:plan-deck` first to create a deck plan.
      </output>
      <action>HALT</action>
    </check>

    <action>Set {{deck_slug}} = current_deck_slug from status.yaml</action>
    <action>Verify output/{{deck_slug}}/plan.yaml exists</action>

    <check if="deck plan.yaml does not exist">
      <output>
**No Deck Plan Found**

No deck plan found at `output/{{deck_slug}}/plan.yaml`

Run `/sb:plan-deck` first to create your presentation plan.
      </output>
      <action>HALT</action>
    </check>

    <action>Load output/{{deck_slug}}/plan.yaml completely</action>
    <action>Read the slides array</action>
    <action>Count slides with status: "pending"</action>
    <action>Store pending slide numbers in {{pending_slides}} array</action>
    <action>Set {{total_pending}} = count of pending slides</action>
    <action>Set {{total_slides}} = total slides in plan</action>

    <!-- deck_slug already set from status.yaml above -->
    <action>Extract deck_name from plan.yaml for display</action>

    <!-- Set output paths based on deck_slug from status.yaml -->
    <action>Set {{output_folder}} = "output/{{deck_slug}}"</action>
    <action>Set {{slides_folder}} = "{{output_folder}}/slides"</action>

    <check if="zero pending slides">
      <output>
**All Slides Already Built!**

All {{total_slides}} slides in your deck have been built.

**Next Steps:**
- Review slides in `output/{{deck_slug}}/slides/`
- Use `/sb:edit {n}` to refine any slide
- Run `/sb:export` when ready to export to Google Slides
      </output>
      <action>HALT</action>
    </check>

    <action>Load .slide-builder/config/theme.json for slide generation</action>

    <output>
**Starting Batch Build**

Deck: {{deck_name}}
Slug: {{deck_slug}}
Output: output/{{deck_slug}}/

Building {{total_pending}} remaining slides...
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 2: Batch Generation Loop                                           -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Build each pending slide in sequence">
    <action>Initialize tracking variables:
      - {{built_count}} = 0
      - {{failed_count}} = 0
      - {{failed_slides}} = []
      - {{current_index}} = 1
    </action>

    <iterate for-each="slide in pending_slides (sorted by number)">

      <output>
**Building slide {{slide.number}} of {{total_slides}}...** ({{current_index}}/{{total_pending}})
      </output>

      <action>Extract slide context:
        - number: slide number
        - intent: main purpose/content
        - template: suggested template
        - storyline_role: opening/tension/evidence/resolution/cta
        - key_points: array of points to include
        - visual_guidance: how slide should look
        - tone: professional/bold/warm/technical/urgent
      </action>

      <!-- Template Decision (from Architecture Novel Pattern 2) -->
      <action>Determine build approach:
        1. Check template field in slide definition
        2. Map template to sample file using template_mapping
        3. If template is "custom" or unknown, use frontend-design skill
      </action>

      <template-mapping>
        <map from="layout-title" to="01-title.html" />
        <map from="layout-list" to="02-agenda.html" />
        <map from="layout-flow" to="03-process-flow.html" />
        <map from="layout-columns-2" to="05-comparison.html" />
        <map from="layout-columns-3" to="05-comparison.html" />
        <map from="layout-callout" to="04-key-insight.html" />
        <map from="layout-code" to="06-technical.html" />
      </template-mapping>

      <!-- Try-catch wrapper for error continuation -->
      <try>
        <check if="template maps to known layout">
          <action>Set {{build_type}} = "template"</action>
          <action>Load reference template from .slide-builder/config/catalog/{{template_file}}</action>
          <goto step="3">Generate slide using template pattern</goto>
        </check>

        <check if="template is 'custom' OR unknown">
          <action>Set {{build_type}} = "custom"</action>
          <goto step="3B">Generate custom slide via frontend-design</goto>
        </check>
      </try>

      <catch if="error during slide generation">
        <action>Log error: "Error building slide {{slide.number}}: {{error_message}}"</action>
        <action>Increment {{failed_count}}</action>
        <action>Add {{slide.number}} to {{failed_slides}} array</action>
        <action>Update plan.yaml: set slide {{slide.number}} status to "failed"</action>
        <output>
⚠️ Slide {{slide.number}} failed: {{error_message}}
Continuing with next slide...
        </output>
        <action>Continue to next slide in loop (DO NOT abort batch)</action>
      </catch>

      <action>Increment {{current_index}}</action>
    </iterate>

    <goto step="4B">Generate Viewer</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3: Template-Based Slide Generation                                 -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Generate slide using template pattern">
    <action>Load reference template from .slide-builder/config/catalog/{{template_file}}</action>
    <action>Load theme.json from .slide-builder/config/theme.json</action>

    <css-variable-extraction>
      <var name="--color-primary" value="{{theme.colors.primary}}" />
      <var name="--color-secondary" value="{{theme.colors.secondary}}" />
      <var name="--color-accent" value="{{theme.colors.accent}}" />
      <var name="--color-bg-default" value="{{theme.colors.background.default}}" />
      <var name="--color-bg-alt" value="{{theme.colors.background.alt}}" />
      <var name="--color-bg-dark" value="{{theme.colors.background.dark}}" />
      <var name="--color-text-heading" value="{{theme.colors.text.heading}}" />
      <var name="--color-text-body" value="{{theme.colors.text.body}}" />
      <var name="--color-text-on-dark" value="{{theme.colors.text.onDark}}" />
      <var name="--font-heading" value="{{theme.typography.fonts.heading}}" />
      <var name="--font-body" value="{{theme.typography.fonts.body}}" />
      <var name="--font-mono" value="{{theme.typography.fonts.mono}}" />
    </css-variable-extraction>

    <content-generation>
      <action>Extract title from intent (first line or main concept)</action>
      <action>Create subtitle from context or audience if present</action>
      <action>Generate body content from key_points array</action>
      <action>Apply visual_guidance preferences to styling choices</action>
      <action>Respect tone in content voice</action>
      <action>Reference the sample HTML structure for layout pattern</action>
    </content-generation>

    <contenteditable-requirements critical="true">
      <mandate>Every text element (h1, h2, p, span with text, li) MUST have contenteditable="true"</mandate>
      <mandate>Every contenteditable element MUST have a unique data-field attribute</mandate>
      <mandate>data-field values must be descriptive: "title", "subtitle", "point-1", etc.</mandate>
    </contenteditable-requirements>

    <dimension-requirements critical="true">
      <mandate>Viewport meta: width=1920, height=1080</mandate>
      <mandate>Body: width: 1920px; height: 1080px</mandate>
      <mandate>.slide container: width: 1920px; height: 1080px</mandate>
    </dimension-requirements>

    <action>Assemble final HTML with:
      1. DOCTYPE html with lang="en"
      2. Meta charset UTF-8
      3. Viewport meta: width=1920, height=1080
      4. Google Fonts link for Outfit font
      5. CSS reset and theme variables in :root
      6. Slide container with data-slide-id attribute
      7. All text elements with contenteditable and data-field
      8. Auto-save JavaScript
    </action>

    <goto step="4">Save slide and update progress</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3B: Custom Slide Generation (via frontend-design skill)            -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3B" goal="Generate custom slide via frontend-design skill">
    <action>Load complete theme.json</action>

    <skill-invocation name="frontend-design">
      <prompt>
Create a production-quality HTML slide for a presentation with the following specifications:

**SLIDE NUMBER:** {{slide.number}}

**SLIDE INTENT:**
{{slide.intent}}

**KEY POINTS TO INCLUDE:**
{{slide.key_points}}

**VISUAL GUIDANCE:**
{{slide.visual_guidance}}

**TONE:**
{{slide.tone}}

**STORYLINE ROLE:**
{{slide.storyline_role}}

**AUDIENCE:**
{{deck.audience}}

**BRAND THEME:**
Use these exact CSS custom properties in :root:
- --color-primary: {{theme.colors.primary}}
- --color-secondary: {{theme.colors.secondary}}
- --color-accent: {{theme.colors.accent}}
- --color-bg-default: {{theme.colors.background.default}}
- --color-bg-alt: {{theme.colors.background.alt}}
- --color-bg-dark: {{theme.colors.background.dark}}
- --color-text-heading: {{theme.colors.text.heading}}
- --color-text-body: {{theme.colors.text.body}}
- --color-text-on-dark: {{theme.colors.text.onDark}}
- --font-heading: {{theme.typography.fonts.heading}}
- --font-body: {{theme.typography.fonts.body}}
- --font-mono: {{theme.typography.fonts.mono}}

**BRAND PERSONALITY:**
{{theme.personality.classification}} - {{theme.personality.traits}}

**MANDATORY REQUIREMENTS:**
1. Slide MUST be exactly 1920x1080 pixels
2. Include viewport meta: width=1920, height=1080
3. ALL text elements MUST have contenteditable="true" attribute
4. ALL text elements MUST have unique data-field attribute (e.g., data-field="title", data-field="point-1")
5. Use Google Fonts link for Outfit font
6. Background should use theme colors matching brand personality
7. Create actual visual elements (diagrams, shapes, icons) - NOT placeholders
8. Include focus styles for contenteditable: outline: 2px solid primary color
9. Output must be a complete, self-contained HTML file
10. Include the auto-save script for contenteditable elements

**AUTO-SAVE SCRIPT (must be included):**
```javascript
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const localStorageEnabled = isLocalStorageAvailable();
if (!localStorageEnabled) {
  console.warn('[Slide Auto-Save] localStorage is disabled.');
}

const saveEdits = () => {
  if (!localStorageEnabled) return;
  try {
    const edits = [];
    document.querySelectorAll('[contenteditable]').forEach(el => {
      const field = el.getAttribute('data-field');
      if (field) {
        edits.push({ selector: `[data-field='${field}']`, content: el.innerHTML });
      }
    });
    localStorage.setItem('slide-{{slide.number}}-edits', JSON.stringify({
      slide: {{slide.number}},
      edits: edits,
      lastModified: new Date().toISOString()
    }));
  } catch (e) {
    console.error('[Slide Auto-Save] Failed to save:', e.message);
  }
};

document.querySelectorAll('[contenteditable]').forEach(el => {
  el.addEventListener('blur', saveEdits);
  el.addEventListener('input', () => setTimeout(saveEdits, 1000));
});

const restoreEdits = () => {
  if (!localStorageEnabled) return;
  try {
    const stored = localStorage.getItem('slide-{{slide.number}}-edits');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.slide === {{slide.number}} && Array.isArray(data.edits)) {
        data.edits.forEach(edit => {
          const el = document.querySelector(edit.selector);
          if (el) el.innerHTML = edit.content;
        });
      }
    }
  } catch (e) {
    localStorage.removeItem('slide-{{slide.number}}-edits');
  }
};

restoreEdits();
```

**OUTPUT FORMAT:**
Return ONLY the complete HTML code, starting with <!DOCTYPE html>
      </prompt>
    </skill-invocation>

    <validation name="custom-slide-validation">
      <check name="contenteditable-check">
        <action>Scan all text elements</action>
        <action if="element has visible text AND lacks contenteditable">
          Add contenteditable="true" attribute
        </action>
      </check>

      <check name="data-field-check">
        <action>Scan all contenteditable elements</action>
        <action if="element lacks data-field attribute">
          Generate unique data-field value
        </action>
      </check>

      <check name="dimensions-check">
        <action>Verify viewport meta tag: width=1920, height=1080</action>
        <action>Verify body/slide dimensions: 1920px x 1080px</action>
      </check>
    </validation>

    <goto step="4">Save slide and update progress</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4: Save Slide and Update Per-Slide Progress                        -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Save slide HTML and state file, update plan.yaml">
    <!-- Create output directory structure if it doesn't exist -->
    <action>Ensure output/{{deck_slug}}/slides/ directory exists (create if needed)</action>

    <!-- Save slide HTML to new output location -->
    <action>Save slide HTML to output/{{deck_slug}}/slides/slide-{{slide.number}}.html</action>

    <!-- Create empty state file for Epic 4 compatibility -->
    <action>Create state file at output/{{deck_slug}}/slides/slide-{{slide.number}}-state.json with:
      {
        "slide": {{slide.number}},
        "edits": [],
        "lastModified": null
      }
    </action>

    <!-- Plan.yaml already lives at output/{{deck_slug}}/plan.yaml - no copy needed -->

    <!-- Update plan.yaml slide status -->
    <action>Read output/{{deck_slug}}/plan.yaml</action>
    <action>Find slide with number: {{slide.number}}</action>
    <action>Update slide status: "pending" -> "built"</action>
    <action>Save updated plan.yaml</action>

    <!-- Update tracking variables -->
    <action>Increment {{built_count}}</action>

    <output>
✅ Slide {{slide.number}} built → output/{{deck_slug}}/slides/slide-{{slide.number}}.html
    </output>

    <!-- Return to loop for next slide -->
    <action>Continue to next iteration in Phase 2 loop</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4B: Generate Viewer and Manifest (Once After All Slides Built)     -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4B" goal="Regenerate viewer and manifest for deck">

    <viewer-generation critical="true">
      <mandate>Viewer and manifest MUST be generated after batch build completes</mandate>
      <mandate>Use regenerate-viewer.js script to ensure consistency</mandate>

      <!-- Run the regenerate script -->
      <action>Execute: node scripts/regenerate-viewer.js {{deck_slug}}</action>

      <output>
**Viewer & Manifest Generated**

Manifest: `output/{{deck_slug}}/slides/manifest.json`
Viewer: `output/{{deck_slug}}/index.html`
      </output>
    </viewer-generation>

    <goto step="5">Summary and Completion</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5: Summary and Completion                                          -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Display summary and update status.yaml">
    <!-- Calculate final counts -->
    <action>Set {{final_built_count}} = current built_count from status.yaml + {{built_count}}</action>

    <!-- Update status.yaml -->
    <action>Read status.yaml</action>
    <action>Update built_count: {{final_built_count}}</action>
    <action>Update current_slide: last successfully built slide number</action>
    <action>Set output_folder: "output/{{deck_slug}}"</action>
    <action>Set deck_slug: "{{deck_slug}}"</action>
    <action>Set last_action: "Batch built {{built_count}} slides to output/{{deck_slug}}/"</action>
    <action>Set last_modified: current ISO 8601 timestamp</action>
    <action>Append to history array:
      {
        action: "Batch built {{built_count}} slides ({{failed_count}} failed) to output/{{deck_slug}}/",
        timestamp: current ISO 8601 timestamp
      }
    </action>
    <action>Save updated status.yaml</action>

    <!-- Display summary -->
    <check if="failed_count == 0">
      <output>
═══════════════════════════════════════════════════════════════════════════════
✅ **Build Complete!**

Built: **{{built_count}}/{{total_pending}}** slides

Output folder: `output/{{deck_slug}}/`

All pending slides were built successfully.

**Next Steps:**
- Review slides in `output/{{deck_slug}}/slides/`
- Use `/sb:edit {n}` to refine any slide
- Run `/sb:export` when ready to export to Google Slides
═══════════════════════════════════════════════════════════════════════════════
      </output>
    </check>

    <check if="failed_count > 0">
      <output>
═══════════════════════════════════════════════════════════════════════════════
⚠️ **Build Complete with Failures**

Built: **{{built_count}}/{{total_pending}}** slides
Failed: **{{failed_count}}** slides

Output folder: `output/{{deck_slug}}/`

**Failed Slides:** {{failed_slides}}

Retry failed slides individually with `/sb:build-one`

**Next Steps:**
- Review successful slides in `output/{{deck_slug}}/slides/`
- Run `/sb:build-one` to retry failed slides
- Use `/sb:edit {n}` to refine any slide
- Run `/sb:export` when ready (excluding failed slides)
═══════════════════════════════════════════════════════════════════════════════
      </output>
    </check>

    <check if="built_count == 0 AND failed_count > 0">
      <output>
═══════════════════════════════════════════════════════════════════════════════
❌ **Build Failed**

Built: **0/{{total_pending}}** slides
All slides failed to build.

**Failed Slides:** {{failed_slides}}

Please check:
- Theme file exists at `.slide-builder/config/theme.json`
- Catalog templates exist in `.slide-builder/config/catalog/`
- Plan definitions are valid in `output/{{deck_slug}}/plan.yaml`

Try building slides individually with `/sb:build-one` for detailed error messages.
═══════════════════════════════════════════════════════════════════════════════
      </output>
    </check>
  </step>

</workflow>
```

## Template File Mapping

| template | Sample Reference |
|----------|------------------|
| layout-title | 01-title.html |
| layout-list | 02-agenda.html |
| layout-flow | 03-process-flow.html |
| layout-columns-2 | 05-comparison.html |
| layout-columns-3 | 05-comparison.html |
| layout-callout | 04-key-insight.html |
| layout-code | 06-technical.html |
| custom | (frontend-design skill) |

## Required HTML Structure

Every generated slide must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>Slide {{number}}: {{intent}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    }

    [contenteditable]:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 4px;
    }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_number}}">
    <h1 contenteditable="true" data-field="title">Title</h1>
    <p contenteditable="true" data-field="subtitle">Subtitle</p>
    <!-- Content with contenteditable -->
  </div>

  <script>
    // Auto-save script (see Phase 3B for full implementation)
  </script>
</body>
</html>
```

## State File Schema (Deck Mode)

For each deck slide, create a corresponding state file:

```json
{
  "slide": 1,
  "edits": [],
  "lastModified": null
}
```
