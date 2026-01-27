# Build One Workflow Instructions

This workflow generates a single slide from plan.yaml using the matching template.

```xml
<critical>This workflow generates HTML slides from plan.yaml</critical>
<critical>Requires theme.json and a plan (single or deck mode)</critical>
<critical>In single mode, builds from .slide-builder/single/plan.yaml</critical>
<critical>Output saved to .slide-builder/single/slide.html</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: State Verification                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Verify plan exists and load context">
    <action>Read .slide-builder/status.yaml to determine current mode</action>

    <check if="mode is 'single'">
      <action>Verify .slide-builder/single/plan.yaml exists</action>
      <check if="plan.yaml does not exist">
        <output>
**No Plan Found**

No single slide plan found at `.slide-builder/single/plan.yaml`

Run `/sb:plan-one` first to create a plan for your slide.
        </output>
        <action>HALT</action>
      </check>
      <action>Load plan.yaml completely</action>
    </check>

    <check if="mode is 'deck'">
      <action>Verify .slide-builder/deck/plan.yaml exists</action>
      <action>Identify next unbuilt slide in deck plan</action>
      <action>Load that slide's plan details</action>
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

    <action>Load .slide-builder/theme.json</action>
    <check if="theme.json does not exist">
      <output>
**Theme Required**

No theme found. Run `/sb:setup` to create your brand theme first.
      </output>
      <action>HALT</action>
    </check>

    <output>
**Plan Loaded**

Mode: {{mode}}
Intent: {{plan.intent}}
Suggested template: {{plan.suggested_template}}
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 2: Template Decision                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Determine template to use">
    <action>Read suggested_template from plan.yaml</action>

    <template-mapping>
      <!-- Map suggested_template to actual template file -->
      <map from="layout-title" to="01-title.html" />
      <map from="layout-list" to="02-agenda.html" />
      <map from="layout-flow" to="03-flow.html" />
      <map from="layout-columns-2" to="04-comparison.html" />
      <map from="layout-columns-3" to="04-comparison.html" />
      <map from="layout-callout" to="05-callout.html" />
      <map from="layout-code" to="06-technical.html" />
    </template-mapping>

    <check if="suggested_template is 'custom'">
      <output>
**Custom Layout Requested**

The plan specifies a custom layout. This will use the frontend-design skill
to create a unique slide design.
      </output>
      <goto step="3B">Proceed to Custom Build</goto>
    </check>

    <check if="suggested_template maps to a known template file">
      <action>Set {{template_file}} to mapped template filename</action>
      <action>Check if .slide-builder/templates/{{template_file}} exists</action>

      <check if="template file exists">
        <output>
**Using Template**

Template: {{suggested_template}} -> {{template_file}}
        </output>
        <action>Proceed to Template Build (Phase 3)</action>
      </check>

      <check if="template file does NOT exist">
        <output>
**Template Missing**

Warning: Template file {{template_file}} not found.
Falling back to custom generation.
        </output>
        <goto step="3B">Proceed to Custom Build</goto>
      </check>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3: Template Build                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Generate slide from template">
    <action>Load template HTML from .slide-builder/templates/{{template_file}}</action>
    <action>Load theme.json for CSS variables</action>

    <css-variable-injection>
      <!-- Map theme.json values to CSS custom properties in :root -->
      <var name="--color-primary" value="{{theme.colors.primary}}" />
      <var name="--color-secondary" value="{{theme.colors.secondary}}" />
      <var name="--color-accent" value="{{theme.colors.accent}}" />
      <var name="--color-bg-default" value="{{theme.colors.background.default}}" />
      <var name="--color-bg-alt" value="{{theme.colors.background.alt}}" />
      <var name="--color-text-heading" value="{{theme.colors.text.heading}}" />
      <var name="--color-text-body" value="{{theme.colors.text.body}}" />
      <var name="--font-heading" value="{{theme.typography.fonts.heading}}" />
      <var name="--font-body" value="{{theme.typography.fonts.body}}" />
      <var name="--font-mono" value="{{theme.typography.fonts.mono}}" />
      <var name="--size-hero" value="{{theme.typography.scale.hero}}" />
      <var name="--size-h1" value="{{theme.typography.scale.h1}}" />
      <var name="--size-h2" value="{{theme.typography.scale.h2}}" />
      <var name="--size-h3" value="{{theme.typography.scale.h3}}" />
      <var name="--size-body" value="{{theme.typography.scale.body}}" />
      <var name="--corner-radius" value="{{theme.shapes.boxes.default.cornerRadius}}" />
      <var name="--box-shadow" value="{{theme.shapes.boxes.default.shadow}}" />
    </css-variable-injection>

    <content-generation>
      <!-- Generate slide content based on plan.yaml -->
      <action>Extract title from plan.intent (first line or main concept)</action>
      <action>Create subtitle from plan.context or plan.audience if present</action>
      <action>Generate body content from plan.key_points array</action>
      <action>Apply visual_guidance preferences to styling choices</action>
      <action>Respect plan.tone in content voice (professional, bold, warm, technical)</action>
    </content-generation>

    <contenteditable-requirements>
      <!-- CRITICAL: All text elements MUST have these attributes -->
      <mandate>Every text element (h1, h2, p, span with text) MUST have contenteditable="true"</mandate>
      <mandate>Every contenteditable element MUST have a unique data-field attribute</mandate>
      <example>
        <h1 contenteditable="true" data-field="title">Title Here</h1>
        <p contenteditable="true" data-field="subtitle">Subtitle Here</p>
        <p contenteditable="true" data-field="body-1">First point</p>
      </example>
    </contenteditable-requirements>

    <auto-save-script>
      <!-- Add JavaScript for auto-saving contenteditable changes -->
      <script>
        // Check if localStorage is available
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
          console.warn('[Slide Auto-Save] localStorage is disabled. Edits will not persist.');
        }

        // Auto-save script for contenteditable elements
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
            localStorage.setItem('slide-edits', JSON.stringify({
              slide: 'single',
              edits: edits,
              lastModified: new Date().toISOString()
            }));
            console.log('[Slide Auto-Save] Saved', edits.length, 'edits at', new Date().toLocaleTimeString());
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
            const stored = localStorage.getItem('slide-edits');
            if (stored) {
              const data = JSON.parse(stored);
              if (data.slide === 'single' && Array.isArray(data.edits)) {
                let restored = 0;
                let skipped = 0;
                data.edits.forEach(edit => {
                  const el = document.querySelector(edit.selector);
                  if (el) {
                    el.innerHTML = edit.content;
                    restored++;
                  } else {
                    console.warn('[Slide Auto-Save] Element not found:', edit.selector);
                    skipped++;
                  }
                });
                console.log('[Slide Auto-Save] Restored', restored, 'edits,', skipped, 'skipped');
              }
            }
          } catch (e) {
            console.error('[Slide Auto-Save] Failed to restore edits, clearing corrupted data:', e.message);
            localStorage.removeItem('slide-edits');
          }
        };

        restoreEdits();
      </script>
    </auto-save-script>

    <dimension-validation>
      <mandate>Slide MUST have viewport meta: width=1920, height=1080</mandate>
      <mandate>Body MUST have width: 1920px; height: 1080px</mandate>
      <mandate>.slide container MUST have width: 1920px; height: 1080px</mandate>
    </dimension-validation>

    <action>Assemble final HTML with:
      1. DOCTYPE and html structure
      2. Theme CSS variables in :root
      3. Google Fonts link for heading font
      4. Template layout and styles
      5. Generated content with contenteditable attributes
      6. Auto-save JavaScript
    </action>

    <check if="single mode">
      <action>Save to .slide-builder/single/slide.html</action>
    </check>

    <check if="deck mode">
      <action>Save to .slide-builder/deck/slides/slide-{{n}}.html</action>
      <action>Update deck plan.yaml to mark slide as "built"</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3B: Custom Build (via frontend-design skill)                       -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3B" goal="Generate custom slide via frontend-design skill">
    <output>
**Invoking frontend-design skill for custom layout**

Loading theme and plan context...
    </output>

    <action>Load complete theme.json from .slide-builder/theme.json</action>
    <action>Load plan.yaml from .slide-builder/single/plan.yaml (or current deck slide)</action>

    <custom-build-context>
      <!-- Prepare context for frontend-design skill invocation -->
      <context-item name="theme">
        Complete theme object including:
        - colors: primary, secondary, accent, background (default/alt), text (heading/body), semantic
        - typography: fonts (heading/body/mono), scale (hero/h1/h2/h3/body/small), weights
        - shapes: boxes (cornerRadius, border, shadow), arrows, lines
        - personality: classification, confidence
      </context-item>

      <context-item name="intent">
        From plan.yaml:
        - intent: The main purpose/content of the slide
        - key_points: Array of specific points to include
        - visual_guidance: How the slide should look
        - tone: professional/bold/warm/technical
        - audience: Who will view the slide
        - technical_depth: none/overview/detailed/deep-dive
      </context-item>

      <context-item name="constraints">
        MANDATORY requirements for all custom slides:
        - Dimensions: 1920x1080 (16:9 presentation standard)
        - All text elements MUST have contenteditable="true"
        - All text elements MUST have unique data-field attributes
        - MUST use theme CSS variables (--color-primary, --font-heading, etc.)
        - MUST be self-contained HTML (no external dependencies except Google Fonts)
        - MUST include viewport auto-scaling script
        - MUST include auto-save script for contenteditable elements
      </context-item>
    </custom-build-context>

    <skill-invocation name="frontend-design">
      <!-- Invoke the frontend-design skill with full context -->
      <prompt>
Create a production-quality HTML slide for a presentation with the following specifications:

**SLIDE INTENT:**
{{plan.intent}}

**KEY POINTS TO INCLUDE:**
{{plan.key_points}}

**VISUAL GUIDANCE:**
{{plan.visual_guidance}}

**TONE:**
{{plan.tone}}

**BRAND THEME:**
Use these exact CSS custom properties in :root:
- --color-primary: {{theme.colors.primary}}
- --color-secondary: {{theme.colors.secondary}}
- --color-accent: {{theme.colors.accent}}
- --color-bg-default: {{theme.colors.background.default}}
- --color-bg-alt: {{theme.colors.background.alt}}
- --color-text-heading: {{theme.colors.text.heading}}
- --color-text-body: {{theme.colors.text.body}}
- --font-heading: {{theme.typography.fonts.heading}}
- --font-body: {{theme.typography.fonts.body}}
- --font-mono: {{theme.typography.fonts.mono}}
- --size-hero: {{theme.typography.scale.hero}}
- --size-h1: {{theme.typography.scale.h1}}
- --size-h2: {{theme.typography.scale.h2}}
- --size-h3: {{theme.typography.scale.h3}}
- --size-body: {{theme.typography.scale.body}}
- --corner-radius: {{theme.shapes.boxes.default.cornerRadius}}
- --box-shadow: {{theme.shapes.boxes.default.shadow}}

**MANDATORY REQUIREMENTS:**
1. Slide MUST be exactly 1920x1080 pixels
2. Include viewport meta: width=1920, height=1080
3. ALL text elements MUST have contenteditable="true" attribute
4. ALL text elements MUST have unique data-field attribute (e.g., data-field="title", data-field="point-1")
5. Use Google Fonts link for the heading font family
6. Background should use theme colors with subtle gradients matching the brand personality: {{theme.personality.classification}}
7. Create actual visual elements (diagrams, shapes, etc.) - NOT placeholders
8. Output must be a complete, self-contained HTML file

**OUTPUT FORMAT:**
Return ONLY the complete HTML code, starting with <!DOCTYPE html>
      </prompt>
    </skill-invocation>

    <action>Capture the generated HTML from frontend-design skill</action>

    <validation name="custom-slide-validation">
      <!-- Validate and post-process the generated HTML -->

      <check name="contenteditable-check">
        <action>Scan all text elements (h1, h2, h3, h4, p, span, li, td, th)</action>
        <action if="element has text content AND lacks contenteditable">
          Add contenteditable="true" attribute
        </action>
      </check>

      <check name="data-field-check">
        <action>Scan all contenteditable elements</action>
        <action if="element lacks data-field attribute">
          Generate unique data-field value based on:
          - Element type (title, subtitle, heading, body, point, etc.)
          - Position/index if multiple of same type
          Example: data-field="title", data-field="point-1", data-field="point-2"
        </action>
      </check>

      <check name="css-variables-check">
        <action>Verify :root section contains theme CSS variables</action>
        <action if="CSS variables missing or incorrect">
          Inject correct CSS variables from theme.json
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
      <!-- Inject auto-save script if not present in generated HTML -->
      <check if="saveEdits function not found in generated HTML">
        <action>Inject the standard auto-save script before closing body tag:</action>
        <script>
    // Auto-save script for contenteditable elements
    const saveEdits = () => {
      const edits = [];
      document.querySelectorAll('[contenteditable]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field) {
          edits.push({ selector: `[data-field='${field}']`, content: el.innerHTML });
        }
      });
      localStorage.setItem('slide-edits', JSON.stringify({
        slide: 'single',
        edits: edits,
        lastModified: new Date().toISOString()
      }));
    };

    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('blur', saveEdits);
      el.addEventListener('input', () => setTimeout(saveEdits, 1000));
    });

    // Restore edits on load
    const stored = localStorage.getItem('slide-edits');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.slide === 'single') {
        data.edits.forEach(edit => {
          const el = document.querySelector(edit.selector);
          if (el) el.innerHTML = edit.content;
        });
      }
    }
        </script>
      </check>
    </script-injection>

    <script-injection name="viewport-scaling-script">
      <!-- Inject viewport auto-scaling script if not present -->
      <check if="scaleSlide function not found in generated HTML">
        <action>Ensure slide is wrapped in .slide-wrapper div</action>
        <action>Inject viewport scaling script:</action>
        <script>
    function scaleSlide() {
      const wrapper = document.querySelector('.slide-wrapper');
      if (wrapper) {
        const scaleX = (window.innerWidth * 0.95) / 1920;
        const scaleY = (window.innerHeight * 0.95) / 1080;
        wrapper.style.transform = `scale(${Math.min(scaleX, scaleY, 1)})`;
      }
    }
    window.addEventListener('load', scaleSlide);
    window.addEventListener('resize', scaleSlide);
    scaleSlide();
        </script>
      </check>
    </script-injection>

    <check if="single mode">
      <action>Save validated HTML to .slide-builder/single/slide.html</action>
    </check>

    <check if="deck mode">
      <action>Save validated HTML to .slide-builder/deck/slides/slide-{{n}}.html</action>
      <action>Update deck plan.yaml to mark slide as "built"</action>
    </check>

    <output>
**Custom Slide Generated**

Generated via frontend-design skill with full theme integration.
    </output>

    <goto step="4">Proceed to state update</goto>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4: State Update and Completion                                     -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Update status and notify user">
    <action>Update .slide-builder/status.yaml:
      - Increment built_count (or set to 1 if not exists)
      - Update last_action based on build type:
        - If template build: "Built slide using {{template_name}} template"
        - If custom build: "Built custom slide via frontend-design skill"
      - Update last_modified: current ISO timestamp
      - Append to history array with action and timestamp
    </action>

    <check if="template build (Phase 3)">
      <output>
**Slide Generated**

Saved to: `.slide-builder/single/slide.html`

**Details:**
- Template: {{suggested_template}}
- Theme: {{theme.meta.name}}
- Dimensions: 1920x1080

**Features:**
- All text is editable (click to edit in browser)
- Changes auto-save to localStorage
- Theme colors and fonts applied

Open the file in your browser to preview and edit.
      </output>
    </check>

    <check if="custom build (Phase 3B)">
      <output>
**Custom Slide Generated**

Saved to: `.slide-builder/single/slide.html`

**Details:**
- Build Type: Custom (frontend-design skill)
- Theme: {{theme.meta.name}}
- Dimensions: 1920x1080

**Features:**
- All text is editable (click to edit in browser)
- Changes auto-save to localStorage
- Theme colors and fonts applied
- Custom layout generated from intent

Open the file in your browser to preview and edit.
      </output>
    </check>

    <browser-preview>
      <!-- Determine absolute path for reliable browser opening -->
      <action>Resolve absolute path: {{project_root}}/.slide-builder/single/slide.html</action>
      <action>Store as {{absolute_slide_path}}</action>

      <output>
**Slide File Path:**
`{{absolute_slide_path}}`

(You can copy this path to open manually if needed)
      </output>

      <ask>
Open in browser? (y/n)
      </ask>

      <check if="user says yes">
        <!-- Platform-specific browser open commands -->
        <action>Detect platform from environment</action>

        <check if="platform is darwin (macOS)">
          <action>Execute via Bash: open "{{absolute_slide_path}}"</action>
        </check>

        <check if="platform is linux">
          <action>Execute via Bash: xdg-open "{{absolute_slide_path}}"</action>
        </check>

        <check if="platform is windows">
          <action>Execute via Bash: start "" "{{absolute_slide_path}}"</action>
        </check>

        <check if="browser open command succeeds">
          <output>
✅ Opened slide in your default browser.
          </output>
        </check>

        <check if="browser open command fails">
          <output>
⚠️ Could not open browser automatically.

Open the file manually at:
`{{absolute_slide_path}}`
          </output>
        </check>
      </check>

      <check if="user says no">
        <output>
No problem. You can open the slide manually at:
`{{absolute_slide_path}}`
        </output>
      </check>
    </browser-preview>

    <output>
**Slide ready. Edit text directly in browser.**

**Next Steps:**
- Edit text directly in the browser (click any text to edit)
- Run `/sb:edit` to make layout changes via natural language
- Run `/sb:export` when ready to export to Google Slides
    </output>
  </step>

</workflow>
```

## Template File Mapping

| suggested_template | Template File |
|-------------------|---------------|
| layout-title | 01-title.html |
| layout-list | 02-agenda.html |
| layout-flow | 03-flow.html |
| layout-columns-2 | 04-comparison.html |
| layout-columns-3 | 04-comparison.html |
| layout-callout | 05-callout.html |
| layout-code | 06-technical.html |
| custom | (use frontend-design skill) |

## Required HTML Structure

Every generated slide must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>{{slide_title}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family={{font_family}}&display=swap" rel="stylesheet">
  <style>
    :root {
      /* Theme CSS variables */
      --color-primary: {{theme.colors.primary}};
      --color-secondary: {{theme.colors.secondary}};
      /* ... all theme variables */
    }
    body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }
    .slide {
      width: 1920px;
      height: 1080px;
      /* Layout styles */
    }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="single">
    <!-- All text elements MUST have contenteditable and data-field -->
    <h1 contenteditable="true" data-field="title">Title</h1>
    <p contenteditable="true" data-field="subtitle">Subtitle</p>
    <!-- More content -->
  </div>
  <script>
    // Auto-save script (see instructions above)
  </script>
</body>
</html>
```
