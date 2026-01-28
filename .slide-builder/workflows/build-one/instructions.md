# Build One Workflow Instructions

This workflow generates a single slide from plan.yaml using the matching template or frontend-design skill.
Supports both single mode (Epic 3) and deck mode (Epic 5).

```xml
<critical>This workflow generates HTML slides from plan.yaml</critical>
<critical>Requires theme.json and a plan (single or deck mode)</critical>
<critical>In single mode, builds from output/singles/plan.yaml to output/singles/</critical>
<critical>In deck mode, builds next pending slide from output/{deck_slug}/plan.yaml to output/{deck_slug}/slides/</critical>
<critical>All slides must have contenteditable="true" and data-field attributes</critical>
<critical>Deck slug is generated from deck_name: lowercase, spaces to hyphens, remove special chars</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: Mode Detection & Routing                                        -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Detect mode and load appropriate plan">
    <action>Read .slide-builder/status.yaml to determine current mode</action>

    <check if="mode is 'deck'">
      <action>Proceed to Deck Build Flow (Phase 1B)</action>
      <goto step="1B">Deck Build Flow</goto>
    </check>

    <check if="mode is 'single'">
      <action>Verify output/singles/plan.yaml exists</action>
      <check if="plan.yaml does not exist">
        <output>
**No Plan Found**

No single slide plan found at `output/singles/plan.yaml`

Run `/sb:plan-one` first to create a plan for your slide.
        </output>
        <action>HALT</action>
      </check>
      <action>Load plan.yaml completely</action>

      <!-- Generate slug for single slide from intent -->
      <slug-generation>
        <action>Extract intent from plan.yaml</action>
        <action>Generate slug from intent (first 30 chars):
          1. Convert to lowercase
          2. Replace spaces with hyphens
          3. Remove special characters (keep only a-z, 0-9, hyphens)
          4. Truncate to 30 characters
          5. Remove trailing hyphens
        </action>
        <action>Set {{slide_slug}} = generated slug</action>
      </slug-generation>

      <action>Set {{slide_number}} = "single"</action>
      <action>Set {{output_folder}} = "output/singles"</action>
      <action>Set {{output_path}} = "{{output_folder}}/{{slide_slug}}.html"</action>
      <goto step="2">Template Decision</goto>
    </check>

    <check if="mode is not set or invalid">
      <output>
**No Plan Found**

You need to plan your slides first:
- `/sb:plan-one` for a single slide
- `/sb:plan-deck` for a full presentation
      </output>
      <action>HALT</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1B: Deck Build Router                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1B" goal="Find next unbuilt slide in deck plan">
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
    <action>Find first slide with status: "pending"</action>

    <check if="no pending slides found">
      <output>
**All Slides Built!**

All slides in your deck have been built successfully.

**Next Steps:**
- Review slides in `output/{{deck_slug}}/slides/`
- Use `/sb:edit {n}` to refine any slide
- Run `/sb:export` when ready to export to Google Slides
      </output>
      <action>HALT</action>
    </check>

    <!-- deck_slug already set from status.yaml in step 1B -->
    <action>Extract deck_name from plan.yaml for display</action>

    <!-- Set output paths based on deck_slug from status.yaml -->
    <action>Set {{output_folder}} = "output/{{deck_slug}}"</action>
    <action>Set {{slides_folder}} = "{{output_folder}}/slides"</action>

    <action>Extract slide context from the first pending slide:
      - number: slide number
      - intent: main purpose/content
      - template: suggested template
      - status: should be "pending"
      - storyline_role: opening/tension/evidence/resolution/cta
      - key_points: array of points to include
      - visual_guidance: how slide should look
      - tone: professional/bold/warm/technical/urgent
    </action>

    <action>Set {{slide_number}} = slide.number</action>
    <action>Set {{output_path}} = "{{slides_folder}}/slide-{{slide_number}}.html"</action>
    <action>Set {{state_path}} = "{{slides_folder}}/slide-{{slide_number}}-state.json"</action>

    <output>
**Building Slide {{slide_number}}**

Deck: {{deck_name}}
Slug: {{deck_slug}}
Output: {{output_folder}}/

Intent: {{slide.intent}}
Template: {{slide.template}}
Storyline Role: {{slide.storyline_role}}
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 2: Template Decision                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Determine template to use">
    <action>Read template field from slide definition (plan.yaml or deck slide)</action>

    <template-mapping>
      <!-- Map template names to sample files for design reference -->
      <map from="layout-title" to="01-title.html" />
      <map from="layout-list" to="02-agenda.html" />
      <map from="layout-flow" to="03-flow.html" />
      <map from="layout-columns-2" to="04-comparison.html" />
      <map from="layout-columns-3" to="04-comparison.html" />
      <map from="layout-callout" to="05-callout.html" />
      <map from="layout-code" to="06-technical.html" />
    </template-mapping>

    <check if="template is 'custom'">
      <output>
**Custom Layout Requested**

The plan specifies a custom layout. Using frontend-design skill
to create a unique slide design.
      </output>
      <action>Set {{build_type}} = "custom"</action>
      <goto step="3B">Custom Build</goto>
    </check>

    <check if="template maps to a known layout">
      <action>Set {{template_file}} = mapped template filename</action>
      <action>Check if .slide-builder/config/samples/{{template_file}} exists for reference</action>

      <output>
**Using Template Layout**

Layout: {{template}} -> {{template_file}}
Reference: .slide-builder/config/samples/{{template_file}}
      </output>
      <action>Set {{build_type}} = "template"</action>
      <goto step="3">Template Build</goto>
    </check>

    <check if="template does not match any known layout">
      <output>
**Unknown Template**

Template "{{template}}" not recognized.
Falling back to custom generation via frontend-design skill.
      </output>
      <action>Set {{build_type}} = "custom"</action>
      <goto step="3B">Custom Build</goto>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3: Template Build                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Generate slide using template pattern">
    <action>Load reference sample from .slide-builder/config/samples/{{template_file}}</action>
    <action>Load theme.json from .slide-builder/config/theme.json</action>

    <css-variable-extraction>
      <!-- Extract these values from theme.json for CSS variables -->
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
      <var name="--size-hero" value="{{theme.typography.scale.hero}}" />
      <var name="--size-h1" value="{{theme.typography.scale.h1}}" />
      <var name="--size-h2" value="{{theme.typography.scale.h2}}" />
      <var name="--size-h3" value="{{theme.typography.scale.h3}}" />
      <var name="--size-body" value="{{theme.typography.scale.body}}" />
      <var name="--border-radius" value="{{theme.shapes.borderRadius.medium}}" />
      <var name="--shadow" value="{{theme.shapes.shadow.medium}}" />
    </css-variable-extraction>

    <content-generation>
      <!-- Generate slide content based on plan context -->
      <action>Extract title from intent (first line or main concept)</action>
      <action>Create subtitle from context or audience if present</action>
      <action>Generate body content from key_points array</action>
      <action>Apply visual_guidance preferences to styling choices</action>
      <action>Respect tone in content voice (professional, bold, warm, technical, urgent)</action>
      <action>Reference the sample HTML structure for layout pattern</action>
    </content-generation>

    <contenteditable-requirements critical="true">
      <!-- MANDATORY: All text elements must have these attributes -->
      <mandate>Every text element (h1, h2, p, span with text, li) MUST have contenteditable="true"</mandate>
      <mandate>Every contenteditable element MUST have a unique data-field attribute</mandate>
      <mandate>data-field values must be descriptive: "title", "subtitle", "point-1", "point-2", etc.</mandate>
      <example>
        <h1 contenteditable="true" data-field="title">Title Here</h1>
        <p contenteditable="true" data-field="subtitle">Subtitle Here</p>
        <p contenteditable="true" data-field="point-1">First point</p>
      </example>
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
      9. Viewport scaling script
    </action>

    <goto step="4">Save and Update</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3B: Custom Build (via frontend-design skill)                       -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3B" goal="Generate custom slide via frontend-design skill">
    <output>
**Invoking frontend-design skill for custom layout**

Loading theme and plan context...
    </output>

    <action>Load complete theme.json from .slide-builder/config/theme.json</action>
    <action>Prepare full context from plan (single or deck slide)</action>

    <skill-invocation name="frontend-design">
      <!-- Invoke frontend-design skill with full context -->
      <prompt>
Create a production-quality HTML slide for a presentation with the following specifications:

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
6. Background should use theme colors with subtle gradients matching the brand personality
7. Create actual visual elements (diagrams, shapes, icons) - NOT placeholders
8. Include focus styles for contenteditable: outline: 2px solid primary color
9. Output must be a complete, self-contained HTML file
10. Include the auto-save script for contenteditable elements

**OUTPUT FORMAT:**
Return ONLY the complete HTML code, starting with <!DOCTYPE html>
      </prompt>
    </skill-invocation>

    <action>Capture the generated HTML from frontend-design skill</action>

    <validation name="custom-slide-validation">
      <!-- Validate and post-process the generated HTML -->

      <check name="contenteditable-check">
        <action>Scan all text elements (h1, h2, h3, h4, p, span, li, td, th)</action>
        <action if="element has visible text AND lacks contenteditable">
          Add contenteditable="true" attribute
        </action>
      </check>

      <check name="data-field-check">
        <action>Scan all contenteditable elements</action>
        <action if="element lacks data-field attribute">
          Generate unique data-field value based on:
          - Element type and purpose (title, subtitle, heading, body, point, etc.)
          - Position/index if multiple of same type
        </action>
      </check>

      <check name="dimensions-check">
        <action>Verify viewport meta tag: width=1920, height=1080</action>
        <action>Verify body/slide dimensions: 1920px x 1080px</action>
        <action if="dimensions incorrect">
          Fix dimensions to 1920x1080
        </action>
      </check>
    </validation>

    <script-injection name="auto-save-script">
      <!-- Ensure auto-save script is present -->
      <check if="saveEdits function not found in generated HTML">
        <action>Inject the standard auto-save script before closing body tag</action>
      </check>
    </script-injection>

    <goto step="4">Save and Update</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4: Save Slide and Create State File                                -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Save slide HTML and create state file">

    <check if="deck mode">
      <!-- Create output directory structure if it doesn't exist -->
      <action>Ensure output/{{deck_slug}}/slides/ directory exists (create if needed)</action>

      <!-- Save slide HTML to new output location -->
      <action>Save slide HTML to {{output_path}} (output/{{deck_slug}}/slides/slide-{{slide_number}}.html)</action>

      <!-- Create empty state file for Epic 4 compatibility -->
      <action>Create state file at {{state_path}} with schema:
        {
          "slide": {{slide_number}},
          "edits": [],
          "lastModified": null
        }
      </action>

      <!-- Plan.yaml already lives at output/{{deck_slug}}/plan.yaml - no copy needed -->

      <output>
**Slide {{slide_number}} Generated**

Output folder: `output/{{deck_slug}}/`
Files created:
- `{{output_path}}`
- `{{state_path}}`
      </output>
    </check>

    <check if="single mode">
      <!-- Create output/singles/ directory if it doesn't exist -->
      <action>Ensure output/singles/ directory exists (create if needed)</action>

      <!-- Save slide HTML to new output location -->
      <action>Save slide HTML to {{output_path}} (output/singles/{{slide_slug}}.html)</action>

      <output>
**Slide Generated**

File: `{{output_path}}`
      </output>
    </check>

    <goto step="4B">Generate Viewer</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4B: Generate Viewer and Manifest (Deck Mode Only)                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4B" goal="Regenerate viewer and manifest for deck">

    <check if="single mode">
      <!-- Skip viewer generation for single slides -->
      <goto step="5">Update Progress</goto>
    </check>

    <check if="deck mode">
      <!-- Viewer and manifest generation for deck mode -->
      <viewer-generation critical="true">
        <mandate>Viewer and manifest MUST be regenerated after EVERY slide build</mandate>
        <mandate>Use regenerate-viewer.js script to ensure consistency</mandate>

        <!-- Run the regenerate script -->
        <action>Execute: node scripts/regenerate-viewer.js {{deck_slug}}</action>

        <output>
**Viewer & Manifest Generated**

Manifest: `output/{{deck_slug}}/slides/manifest.json`
Viewer: `output/{{deck_slug}}/index.html`
        </output>
      </viewer-generation>
    </check>

    <goto step="5">Update Progress</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5: Update Progress and Status                                      -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Update plan.yaml status and status.yaml progress">

    <check if="deck mode">
      <!-- Update plan.yaml slide status -->
      <action>Read output/{{deck_slug}}/plan.yaml</action>
      <action>Find slide with number: {{slide_number}}</action>
      <action>Update slide status: "pending" -> "built"</action>
      <action>Save updated output/{{deck_slug}}/plan.yaml</action>

      <!-- Update status.yaml -->
      <action>Read status.yaml</action>
      <action>Update current_slide: {{slide_number}}</action>
      <action>Increment built_count by 1</action>
      <action>Set output_folder: "output/{{deck_slug}}"</action>
      <action>Set deck_slug: "{{deck_slug}}"</action>
      <action>Set last_action: "Built slide {{slide_number}}: {{slide.intent}}"</action>
      <action>Set last_modified: current ISO 8601 timestamp</action>
      <action>Append to history array:
        {
          action: "Built slide {{slide_number}}: {{slide.intent}}",
          timestamp: current ISO 8601 timestamp
        }
      </action>
      <action>Save updated status.yaml</action>

      <!-- Calculate remaining slides -->
      <action>Count remaining pending slides in plan.yaml</action>
      <action>Set {{remaining_count}} = count of slides with status: "pending"</action>
      <action>Set {{total_slides}} = total slides in plan</action>
      <action>Set {{built_count}} = updated built_count from status.yaml</action>

      <output>
**Slide {{slide_number}} Built Successfully**

Progress: {{built_count}}/{{total_slides}} slides built
Remaining: {{remaining_count}} slides

Build Type: {{build_type}}
Intent: {{slide.intent}}

**Output:**
- Folder: `output/{{deck_slug}}/`
- Slide: `output/{{deck_slug}}/slides/slide-{{slide_number}}.html`
- State: `output/{{deck_slug}}/slides/slide-{{slide_number}}-state.json`

**Next Steps:**
- Run `/sb:build-one` to build the next slide
- Run `/sb:build-all` to build all remaining slides
- Open the slide file in browser to preview
      </output>
    </check>

    <check if="single mode">
      <!-- Update status.yaml for single mode -->
      <action>Read status.yaml</action>
      <action>Set last_action based on build type:
        - If template: "Built slide using {{template}} template"
        - If custom: "Built custom slide via frontend-design skill"
      </action>
      <action>Set output_folder: "output/singles"</action>
      <action>Set last_modified: current ISO 8601 timestamp</action>
      <action>Append to history array with action and timestamp</action>
      <action>Save updated status.yaml</action>

      <output>
**Slide Generated Successfully**

Saved to: `output/singles/{{slide_slug}}.html`

**Details:**
- Build Type: {{build_type}}
- Theme: {{theme.name}}
- Dimensions: 1920x1080

**Features:**
- All text is editable (click to edit in browser)
- Changes auto-save to localStorage
- Theme colors and fonts applied

**Next Steps:**
- Open the file in your browser to preview and edit
- Run `/sb:edit` to make layout changes via natural language
- Run `/sb:export` when ready to export to Google Slides
      </output>
    </check>

    <browser-preview>
      <action>Resolve absolute path for the slide file</action>

      <output>
**Slide File Path:**
`{{absolute_path}}`
      </output>

      <ask>Open in browser? (y/n)</ask>

      <check if="user says yes">
        <action>Detect platform (darwin/linux/windows)</action>
        <action>Execute appropriate open command:
          - macOS: open "{{absolute_path}}"
          - Linux: xdg-open "{{absolute_path}}"
          - Windows: start "" "{{absolute_path}}"
        </action>
      </check>
    </browser-preview>
  </step>

</workflow>
```

## Template File Mapping

| template | Sample Reference |
|----------|------------------|
| layout-title | 01-title.html |
| layout-list | 02-agenda.html |
| layout-flow | 03-flow.html |
| layout-columns-2 | 04-comparison.html |
| layout-columns-3 | 04-comparison.html |
| layout-callout | 05-callout.html |
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
      /* Layout-specific styles */
    }

    /* Contenteditable focus styles */
    [contenteditable]:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 4px;
    }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="{{slide_number}}">
    <!-- All text elements MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Title</h1>
    <p contenteditable="true" data-field="subtitle">Subtitle</p>
    <!-- More content with contenteditable -->
  </div>

  <script>
    // Auto-save script for contenteditable elements
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
        localStorage.setItem('slide-{{slide_number}}-edits', JSON.stringify({
          slide: {{slide_number}},
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

    // Restore edits on load
    const restoreEdits = () => {
      if (!localStorageEnabled) return;
      try {
        const stored = localStorage.getItem('slide-{{slide_number}}-edits');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.slide === {{slide_number}} && Array.isArray(data.edits)) {
            data.edits.forEach(edit => {
              const el = document.querySelector(edit.selector);
              if (el) el.innerHTML = edit.content;
            });
          }
        }
      } catch (e) {
        localStorage.removeItem('slide-{{slide_number}}-edits');
      }
    };

    restoreEdits();
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

This enables Epic 4 edit preservation across regenerations.
