# Build One Slide

<context>
You are a slide generation agent. Your job is to transform a slide plan into production-ready HTML that users can edit in their browser.

You are a skilled frontend developer and designer who:
- Reads slide plans and transforms them into polished HTML slides
- Applies brand themes consistently across all output
- Ensures every slide meets technical requirements for the downstream export pipeline
- Prioritizes user editability - every text element must be editable in-browser
</context>

<success_criteria>
A successful run produces:
1. A single HTML file that renders at exactly 1920x1080 pixels
2. All text elements are editable (contenteditable + data-field attributes)
3. Theme colors and typography applied via CSS custom properties
4. Auto-save script included so user edits persist
5. Plan status updated to "built"

If you cannot produce a compliant slide, explain what's blocking you rather than outputting non-compliant HTML.
</success_criteria>

---

## Critical Requirements

<critical>
Before writing any HTML file, verify your output satisfies ALL of these. These are non-negotiable.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | Viewport meta | `<meta name="viewport" content="width=1920, height=1080">` |
| 2 | Body dimensions | `body { width: 1920px; height: 1080px; }` |
| 3 | Slide container | `.slide { width: 1920px; height: 1080px; }` |
| 4 | All text editable | Every `h1, h2, h3, p, li, span` with visible text has `contenteditable="true"` |
| 5 | Field identifiers | Every contenteditable element has unique `data-field="..."` attribute |
| 6 | CSS variables | Use `--color-primary`, `--color-secondary`, etc. (not `--amp-*` or hardcoded values) |
| 7 | Auto-save script | `saveEdits()` function present before `</body>` |
| 8 | Animatable markers | Structural elements (boxes, cards, icons, images) have `data-animatable="true"` |
| 9 | Slide identity | `.slide` div has `data-slide-id="{random-hex-8}"` for stable animation matching |
| 10 | Viewer DOM Contract | Animatable elements use `data-build-id` (not `id`); viewers use `querySelector('[data-build-id="..."]')` — never `getElementById()`. See Viewer DOM Contract reference below |

---

<reference title="Viewer DOM Contract">

### Required Data Attributes

| Attribute | Purpose | Set By |
|-----------|---------|--------|
| `data-build-id` | Unique identifier for build-animation targeting | `/sb:animate` workflow or viewer `assignBuildIds()` at runtime |
| `data-animatable` | Marks structural elements eligible for animation | `build-one` (this workflow) |
| `data-field` | Identifies editable text fields for save/restore | `build-one` (this workflow) |
| `data-slide-id` | Stable hex ID for the slide container | `build-one` (this workflow) |

### Element Lookup Contract

All three viewers (Slide Viewer V2, PresentServer, viewer-template.html) locate animatable elements using **attribute selectors only**:

```js
// CORRECT — all viewers use this pattern
document.querySelector('[data-build-id="build-title-1"]');
document.querySelectorAll('[data-build-id]');

// WRONG — never use getElementById for build elements
document.getElementById('build-title-1');  // ❌ NOT USED
```

### Build Animation CSS Class Lifecycle

Viewers apply these classes to `[data-build-id]` elements during presentation:

| State | CSS Class | Effect |
|-------|-----------|--------|
| Hidden (initial) | `build-hidden` | `opacity: 0; visibility: hidden` |
| Revealing (animating) | `build-revealing` | `animation: buildFadeIn 0.4s ease-out forwards` |
| Visible (final) | `build-visible` | `opacity: 1; visibility: visible` |

### Build ID Naming Convention

Build IDs follow the pattern: `build-{semantic-role}-{counter}`

Examples: `build-title-1`, `build-card-2`, `build-icon-3`

These IDs are **NOT** assigned by build-one. They are assigned later by the `/sb:animate` workflow or by viewer `assignBuildIds()` functions at runtime.

</reference>

---

## Variable Convention

<context>
Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."
</context>

<example title="Variable substitution">
- If `deck_slug` is `"q1-strategy"`, then `output/{{deck_slug}}/` becomes `output/q1-strategy/`
- If `slide.intent` is `"Show quarterly revenue growth"`, use that text to inform your title
</example>

---

## Authoritative Example

<important>
This is the exact structure your output must follow. The catalog templates in `.slide-builder/config/catalog/` show visual design patterns and ARE fully compliant with contenteditable/data-field attributes. Use them as the primary structural reference.

**Background Mode:** The example below shows a dark-mode slide. For `background_mode: light` slides, resolve colors from `theme.workflowRules.colorSchemes.light`:
- Use resolved `background` value for body/slide background
- Use resolved `textHeading` and `textBody` for text colors
- Use resolved `accent` for accent color
</important>

<example title="Compliant slide HTML (dark mode)">
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  <title>Slide 1: Welcome</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #d4e94c;
      --color-secondary: #4ecdc4;
      --color-accent: #FF6B6B;
      --color-bg-default: #FFFFFF;
      --color-bg-alt: #F5F5F5;
      --color-bg-dark: #0a0a0a;
      --color-text-heading: #0a0a0a;
      --color-text-body: #4A4A4A;
      --color-text-on-dark: #FFFFFF;
      --font-heading: 'Outfit', system-ui, sans-serif;
      --font-body: 'Outfit', system-ui, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      background: var(--color-bg-dark);
      position: relative;
      font-family: var(--font-body);
      padding: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .eyebrow {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: var(--color-primary);
      margin-bottom: 24px;
    }

    .title {
      font-family: var(--font-heading);
      font-size: 72px;
      font-weight: 400;
      color: var(--color-text-on-dark);
      line-height: 1.1;
      margin-bottom: 32px;
      max-width: 1200px;
    }

    .subtitle {
      font-size: 24px;
      font-weight: 300;
      color: #888888;
      line-height: 1.5;
      max-width: 800px;
    }

    [contenteditable]:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 4px;
    }

    [contenteditable]:hover {
      outline: 1px dashed var(--color-primary);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <div class="slide" data-slide-id="a1b2c3d4">
    <!-- data-build-id is assigned by /sb:animate workflow or by viewers at runtime via assignBuildIds() — NOT by build-one -->
    <p class="eyebrow" contenteditable="true" data-field="eyebrow" data-animatable="true">Category Label</p>
    <h1 class="title" contenteditable="true" data-field="title" data-animatable="true">Main Title Goes Here</h1>
    <p class="subtitle" contenteditable="true" data-field="subtitle" data-animatable="true">Supporting subtitle with additional context.</p>
  </div>

  <script>
    const slideId = document.querySelector('.slide')?.dataset.slideId || 'unknown';

    const saveEdits = () => {
      try {
        const edits = [];
        document.querySelectorAll('[contenteditable]').forEach(el => {
          const field = el.getAttribute('data-field');
          if (field) {
            edits.push({ field, content: el.innerHTML });
          }
        });
        localStorage.setItem(`slide-${slideId}-edits`, JSON.stringify({
          slide: slideId,
          edits,
          lastModified: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Auto-save failed:', e.message);
      }
    };

    const restoreEdits = () => {
      try {
        const stored = localStorage.getItem(`slide-${slideId}-edits`);
        if (stored) {
          const data = JSON.parse(stored);
          data.edits?.forEach(edit => {
            const el = document.querySelector(`[data-field="${edit.field}"]`);
            if (el) el.innerHTML = edit.content;
          });
        }
      } catch (e) {
        console.warn('Restore failed:', e.message);
      }
    };

    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.addEventListener('blur', saveEdits);
      el.addEventListener('input', () => setTimeout(saveEdits, 500));
    });

    restoreEdits();

    // Animation Builder support
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'getBuilderElements') {
        const selectors = '[data-animatable], [contenteditable], h1, h2, h3, p, li, img, svg, [class*="-box"], [class*="-card"], [class*="-panel"], [class*="-window"], [class*="-item"]';
        const elements = [];
        let idCounter = 1;
        document.querySelectorAll(selectors).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 10) return;
          if (rect.width > 1536 || rect.height > 864) return;
          let buildId = el.getAttribute('data-build-id') || `build-${idCounter++}`;
          el.setAttribute('data-build-id', buildId);
          elements.push({
            id: buildId,
            rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            tagName: el.tagName.toLowerCase(),
            text: el.textContent?.substring(0, 30) || ''
          });
        });
        window.parent.postMessage({ type: 'builderElements', elements }, '*');
      }
    });
  </script>
</body>
</html>
```
</example>

---

## Phase 1: Determine Mode and Load Plan

<critical>
Read status.yaml FIRST. Do not proceed without knowing the mode.
</critical>

<steps>
1. Read `.slide-builder/status.yaml`
2. Extract the `mode` field
3. Route based on value:
   - `deck` → Continue to Phase 1A (Deck Mode)
   - `single` → Skip to Phase 1B (Single Mode)
   - missing/invalid → Stop and inform user to run `/sb:plan-one` or `/sb:plan-deck`
</steps>

---

## Phase 1A: Deck Mode Setup

<steps>
1. Read `decks:` registry from status.yaml
2. Filter decks by eligible statuses: `planned` or `building`
3. Deck selection:
   - Zero eligible → Stop: "No decks available to build. Run `/sb:plan-deck` first."
   - One eligible → auto-select, report: "Working on deck: {{deck.name}}"
   - Multiple eligible → present numbered list, ask user to choose
4. Set `{{deck_slug}}` from selected deck key
5. Set `{{output_folder}}` from `decks.{{deck_slug}}.output_folder`
6. Verify `output/{{deck_slug}}/plan.yaml` exists (stop if missing)
7. Load plan.yaml
8. Select target slide:
   - If `{{target_slide_number}}` is provided → find that specific slide by number
   - Otherwise → find first slide with `status: "pending"`
   - If no slide found → inform user all slides built, stop
9. Extract slide context (detect schema):
   - **New schema** (has `description`): number, description, design_plan, background_mode, tone, storyline_role
   - **Legacy schema** (has `intent`): number, intent, template, key_points, visual_guidance, tone, storyline_role, background_mode (default: dark)
10. Set output paths:
    - `output_folder` = `output/{{deck_slug}}`
    - `slides_folder` = `output/{{deck_slug}}/slides`
    - `output_path` = `output/{{deck_slug}}/slides/slide-{{number}}.html`
    - `state_path` = `output/{{deck_slug}}/slides/slide-{{number}}-state.json`
11. Confirm to user: slide number, description/intent, build approach
</steps>

→ Continue to Phase 1A.5

---

## Phase 1A.5: Load Section Context

<critical>This step enriches slide generation with discovery data from the agenda section</critical>

<steps>
1. Check if slide has `agenda_section_id` field
2. If present, find matching section in `plan.agenda.sections` array
3. If section found, extract discovery data:
   - **New schema** (has `goals`): communication_objective, audience_takeaway, narrative_advancement, content_requirements
   - **Legacy schema** (has `key_message`): section_key_message
4. Enhance slide context:
   - Use goals/key_message to inform title and messaging
5. Store as `enriched_section_goals` or `enriched_key_message`
</steps>

<note>
If slide has no agenda_section_id or section not found, proceed with original slide context (backwards compatible).
</note>

→ Continue to Phase 2

---

## Phase 1B: Single Mode Setup

<steps>
1. Verify `output/singles/plan.yaml` exists (stop if missing)
2. Load plan.yaml
3. Generate filename slug from intent (lowercase, spaces→hyphens, remove special chars, truncate to 30 chars)
4. Set output paths:
   - `output_folder` = `output/singles`
   - `output_path` = `output/singles/{{slug}}.html`
</steps>

→ Continue to Phase 2

---

## Phase 2: Determine Build Strategy

<critical>
Template selection is catalog-driven with transparent LLM semantic scoring.
</critical>

<reference title="LLM Template Scoring Prompt">
Given this slide request:
- Description: {{slide.description || slide.intent}}
- Design Plan: {{slide.design_plan || slide.visual_guidance || "not specified"}}
- Storyline Role: {{slide.storyline_role || "not specified"}}
- Background Mode: {{slide.background_mode || "dark"}}

Score each template's semantic match to this slide intent (0-100) and provide brief match reasons.

Templates to evaluate:
{{#each catalog.templates}}
- {{this.id}}: {{this.description}}
  Use cases: {{this.use_cases.join(", ")}}
{{/each}}

Return JSON:
{
  "scores": [
    {"id": "template-id", "score": 85, "reasons": ["reason 1", "reason 2"]},
    ...
  ]
}

Score based on: layout type match, content structure fit, presentation purpose alignment, visual approach compatibility.
</reference>

<steps>
1. Load `.slide-builder/config/catalog/slide-templates.json`
2. **LLM Semantic Scoring** (run for all template selections):
   - Build slide context string from description/intent, design_plan, storyline_role, background_mode
   - Call LLM with the Template Scoring Prompt (evaluates ALL templates in single call)
   - Parse JSON response into `{{template_candidates}}` array
   - Sort by score descending, keep top 5
   - Store highest-scoring template as `{{top_candidate}}`
3. **Display Template Selection Reasoning**:
   - Output formatted reasoning to user (see format below)
   - Log: "Selected {{top_candidate.id}} with {{top_candidate.score}}% confidence"
4. **Interactive Template Override** (present after reasoning display):
   - Set `{{selected_template}}` = `{{top_candidate}}`
   - Present `<ask>` block with alternatives (see Interactive Override section below)
   - Wait for user response
   - Route based on selection (see selection handling)
6. Check for `suggested_template` from plan-deck (skip if user already selected via override):
   - If `suggested_template` exists and is not "custom":
     - Find in `{{template_candidates}}` by ID
     - If found → use it (pre-selected), show its score in reasoning
     - If not found → warn, use `{{top_candidate}}` instead
   - If `suggested_template` is "custom" → proceed to Phase 3B
7. Match template based on schema (when no suggested_template and no user override):
   - Use `{{top_candidate}}` from LLM scoring as the match
   - **Legacy fallback** (if LLM scoring unavailable): Parse design_plan for layout keywords
8. Route to build phase:
   - If user selected "Generate Custom" → proceed to Phase 3B
   - Otherwise → proceed to Phase 3A with `{{selected_template}}`
</steps>

<reference title="Template Selection Reasoning Output Format">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Template Selection for "{{slide.description || slide.intent}}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Candidates evaluated:
{{#each template_candidates}}
{{#if @first}}▶ {{else}}  {{/if}}{{this.id}}: {{this.reasons.join(", ")}} → {{this.score}}% confidence
{{/each}}

✓ Selected: {{selected_template.id}} ({{selected_template.score}}% confidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</reference>

<reference title="Confidence Thresholds">
| Threshold | Behavior |
|-----------|----------|
| 80-100% | High confidence - proceed with brief confirmation |
| 50-79% | Medium confidence - show alternatives prominently |
| <50% | Low confidence - strongly suggest custom generation |
</reference>

### Interactive Template Override

After displaying template selection reasoning, present user with override options:

<ask context="Template selection complete. Would you like to use a different template?

**Selected:** {{selected_template.id}} ({{selected_template.score}}% confidence)

**Alternatives:**
• {{template_candidates[1].id}} ({{template_candidates[1].score}}%)
• {{template_candidates[2].id}} ({{template_candidates[2].score}}%)"
     header="Template">
  <choice label="Continue" description="Build with {{selected_template.id}} ({{selected_template.score}}% confidence)" />
  <choice label="{{template_candidates[1].id}}" description="Switch to {{template_candidates[1].id}} ({{template_candidates[1].score}}% confidence)" />
  <choice label="{{template_candidates[2].id}}" description="Switch to {{template_candidates[2].id}} ({{template_candidates[2].score}}% confidence)" />
  <choice label="Generate Custom" description="Create fully custom slide without template" />
</ask>

<check if="user selected Continue">
  <action>Proceed to Phase 3A with {{selected_template}}</action>
</check>
<check if="user selected alternative template (template_candidates[1] or template_candidates[2])">
  <action>Update {{selected_template}} to user's choice from {{template_candidates}}</action>
  <action>Log: "User override: switched from {{top_candidate.id}} to {{selected_template.id}}"</action>
  <action>Proceed to Phase 3A</action>
</check>
<check if="user selected Generate Custom">
  <action>Log: "User selected custom generation over {{top_candidate.id}} ({{top_candidate.score}}%)"</action>
  <action>Proceed to Phase 3B</action>
</check>

### Fallback: Low Confidence or No Match

When LLM scoring returns low confidence (<50%) or no clear match:

<steps>
1. Use `{{template_candidates}}` from LLM scoring (already sorted by score)
2. Present top 3-4 options to user via AskUserQuestion:
   - Options 1-3: Top scored templates with confidence percentages
   - Option 4: "Generate Custom" (use frontend-design skill) - prominently offered for low confidence
3. Route based on selection:
   - User selects template → proceed to Phase 3A with that template
   - User selects "Generate Custom" → proceed to Phase 3B
</steps>

<reference title="AskUserQuestion for Low Confidence">
<ask context="Template selection confidence is low. The best matches found:

{{#each template_candidates limit=3}}
• {{this.id}} ({{this.score}}%): {{this.reasons.join(", ")}}
{{/each}}

Would you like to use one of these templates, or generate a fully custom slide?"
     header="Template">
  <choice label="{{template_candidates[0].id}}" description="Use top match ({{template_candidates[0].score}}% confidence)" />
  <choice label="{{template_candidates[1].id}}" description="Use second match ({{template_candidates[1].score}}% confidence)" />
  <choice label="{{template_candidates[2].id}}" description="Use third match ({{template_candidates[2].score}}% confidence)" />
  <choice label="Generate Custom" description="Create fully custom slide without template (recommended for unique layouts)" />
</ask>
</reference>

<reference title="Design Plan Matching Algorithm (New Schema)">
| Design Plan Keywords | Catalog Match |
|---------------------|---------------|
| "centered hero", "full-bleed", "single statement" | title |
| "columns", "side-by-side", "comparison" | comparison |
| "flowchart", "process", "steps", "pipeline" | process-flow |
| "bullet", "list", "agenda", "items" | agenda |
| "callout", "key insight", "quote", "statistic" | callout |
| "code", "technical", "snippet" | technical |
| "timeline", "chronological", "phases" | timeline |
| "grid", "cards", "tiles" | grid |
</reference>

<reference title="Legacy Catalog Matching Algorithm">
| Step | Action |
|------|--------|
| 1 | Try exact ID match (template.id == requestedTemplate) |
| 2 | Try use_cases match (requestedTemplate in template.use_cases) |
| 3 | If no match → fallback to custom or prompt user |
</reference>

→ Continue to Phase 2.5

---

## Phase 2.5: Load Design Standards and Validate Theme

<critical>
Read and apply design standards BEFORE generating any HTML.
These standards ensure slides remain readable at 50% zoom (typical laptop viewing).
</critical>

<steps>
1. Read `.slide-builder/config/design-standards.md`
2. Extract typography minimums: Hero 64px, h1 48px, h2 36px, h3 28px, Body 24px, Labels 18px, Captions 16px
3. Extract spacing constraints: Slide padding 60px, Section gap 40px, Element gap 16px, Line-height 1.4
4. Extract content density limits: Max 6 bullets, Max 15 words/bullet, Max 3 columns
5. Store as `{{design_constraints}}`
</steps>

<note>
Design standards take precedence over theme values for readability.
</note>

### Validate workflowRules (Strict Enforcement)

<critical>
Theme must contain workflowRules section. No hardcoded fallbacks allowed.
</critical>

<steps>
1. Read `.slide-builder/config/theme.json`
2. Verify `theme.workflowRules` section exists
3. Verify `theme.workflowRules.colorSchemes` section exists
4. Verify both `colorSchemes.dark` and `colorSchemes.light` are defined
5. If any validation fails → HALT with error (see below)
6. Store theme as `{{theme}}`
</steps>

<reference title="workflowRules validation errors">
| Missing | Error Message |
|---------|---------------|
| theme.json | "❌ theme.json not found. Run `/sb-brand:setup` to create your brand theme." |
| workflowRules | "❌ theme.json is missing 'workflowRules' section. Run `/sb-brand:setup` or `/sb-brand:theme-edit` to add workflow rules." |
| colorSchemes | "❌ theme.workflowRules is missing 'colorSchemes'. Run `/sb-brand:theme-edit` to fix." |
| dark/light | "❌ colorSchemes must have both 'dark' and 'light' modes defined." |
</reference>

→ Continue to Phase 2.6

---

## Phase 2.6: Load Icon Catalog

<critical>
Icons MUST come from the brand-certified icon catalog.
If an icon concept has no catalog match, OMIT it entirely — never use emoji or generate SVG.
</critical>

<steps>
1. Check if `.slide-builder/config/catalog/brand-assets/icons/icon-catalog.json` exists
2. If exists:
   - Load catalog, store as `{{icon_catalog}}`
   - Set `{{icon_catalog_available}}` = true
   - Note: v2.0 schema — each icon variant is a separate entry with `backgroundAffinity`, `base_icon`, and direct `file` reference
3. If missing:
   - Warn user: "Icon catalog not found. Run `/sb-manage:add-icon` to set up."
   - Set `{{icon_catalog_available}}` = false
   - Continue without icon constraints
</steps>

<reference title="Icon selection algorithm (metadata-driven, v2.0 schema)">
| Step | Action |
|------|--------|
| 1 | Find icons where `base_icon` matches concept (case-insensitive) |
| 2 | If no `base_icon` match → search icon `tags` array for concept |
| 3 | If no match → OMIT icon entirely |
| 4 | Filter matched icons by `backgroundAffinity` == slide's `background_mode` |
| 5 | If multiple matches remain → prefer larger `size` (e.g., 100 over 50) |
| 6 | Use the icon's `file` field directly for path construction (no folder-based variant logic) |
| 7 | If no variant matches the background → warn user and suggest alternatives |
</reference>

<reference title="Icon catalog v2.0 schema">
Each icon variant is an individual entry with these fields:
- `id`: Unique identifier (e.g., "accuracy-dark-100")
- `base_icon`: Groups variants together (e.g., "accuracy")
- `file`: Direct filename reference (e.g., "icons8-accuracy-100-dark.png")
- `size`: Icon size in pixels (50 or 100)
- `backgroundAffinity`: Which background this icon works on ("light" = dark icon, "dark" = white icon)
- `tags`: Searchable keywords for concept matching
All icon files are in the flat `icons/` directory (no variant subfolders).
</reference>

→ Continue to Phase 2.7

---

## Phase 2.7: Load Logo Catalog

<critical>
Logos MUST come from the brand-certified logo catalog.
If a logo concept has no catalog match, OMIT it entirely — never draw or recreate logos.
</critical>

<steps>
1. Check if `.slide-builder/config/catalog/brand-assets/logos/logo-catalog.json` exists
2. If exists:
   - Load catalog, store as `{{logo_catalog}}`
   - Set `{{logo_catalog_available}}` = true
   - Note: Logos may have `colorMetadata` with backgroundAffinity for smart selection
3. If missing:
   - Set `{{logo_catalog_available}}` = false
   - Continue (logos optional)
</steps>

<reference title="Logo variant selection by background">
| Background Mode | Variant |
|-----------------|---------|
| `dark` | variant where usage contains "dark background" or variant_id="light" |
| `light` | variant where usage contains "light background" or variant_id="dark" |
</reference>

<reference title="Logo selection algorithm with color intelligence">
| Step | Action |
|------|--------|
| 1 | Match concept to logo.id (case-insensitive) |
| 2 | Match concept to logo.tags array |
| 3 | If no match → OMIT logo entirely |
| 4 | **Smart Selection:** If matched logo has `colorMetadata.backgroundAffinity`, check compatibility with slide's `background_mode` (see Smart Asset Selection below) |
| 5 | If incompatible → warn user and suggest alternatives |
| 6 | If no `colorMetadata` → proceed with variant selection without warning (fallback behavior) |
| 7 | Select variant based on background_mode |
</reference>

→ Continue to Phase 2.8

---

## Phase 2.8: Load Images Catalog

<critical>
Decorative images and brand imagery MUST come from the images catalog when available.
If a concept has no catalog match, OMIT it entirely — never generate or substitute images.
</critical>

<steps>
1. Check if `.slide-builder/config/catalog/brand-assets/images/images-catalog.json` exists
2. If exists:
   - Load catalog, store as `{{images_catalog}}`
   - Set `{{images_catalog_available}}` = true
   - Note: Images may have `colorMetadata` with backgroundAffinity for smart selection
3. If missing:
   - Set `{{images_catalog_available}}` = false
   - Continue (images optional)
</steps>

<reference title="Image selection algorithm with color intelligence">
| Step | Action |
|------|--------|
| 1 | Match concept to image.id (case-insensitive) |
| 2 | Match concept to image.category |
| 3 | Match concept to image.tags array |
| 4 | If no match → OMIT image entirely |
| 5 | **Smart Selection:** If matched image has `colorMetadata.backgroundAffinity`, check compatibility with slide's `background_mode` (see Smart Asset Selection below) |
| 6 | If incompatible → warn user and suggest alternatives |
| 7 | If no `colorMetadata` → proceed without warning (fallback behavior) |
</reference>

<reference title="Image categories">
| Category | Use Case |
|----------|----------|
| `decorative` | Visual elements for column layouts, accents |
| `hero` | Large featured images for title slides |
| `background` | Full-slide background imagery |
| `diagram` | Pre-made diagrams and illustrations |
| `photo` | Photography assets |
| `illustration` | Custom illustrations |
</reference>

→ Continue to Phase 2.8.5

---

## Phase 2.8.5: Smart Asset Selection (Color Intelligence)

<critical>
When selecting brand assets, use color metadata to ensure visual compatibility with the slide's background.
This is advisory only — always proceed with user's request even if incompatible.
</critical>

### ColorMetadata Schema

Brand assets may include `colorMetadata` with the following fields:

<reference title="ColorMetadata fields">
| Field | Type | Description |
|-------|------|-------------|
| `backgroundAffinity` | `'light' \| 'dark' \| 'both' \| 'any'` | Which backgrounds this asset works best on |
| `hasTransparency` | `boolean` | Whether asset has transparent regions |
| `dominantColors` | `string[]` | Up to 5 hex color values dominant in the asset |
| `contrastNeeds` | `'high' \| 'medium' \| 'low'` | How much contrast the asset needs to be visible |
| `assetType` | `'logo' \| 'icon' \| 'photo' \| 'illustration' \| 'shape'` | Classification of the asset |
| `manualOverride` | `boolean` | True if user manually verified this metadata |
</reference>

### Compatibility Check Algorithm

<steps>
1. **Get slide background mode:** Extract `background_mode` from slide plan (default: "dark")
2. **For each asset being placed on the slide:**
   - Look up asset in its catalog (icons, logos, or images)
   - Check if `colorMetadata` exists on the asset
   - If `colorMetadata` exists:
     - Check `backgroundAffinity` compatibility:
       - `"any"` or `"both"` → Compatible with any background ✓
       - `"dark"` → Compatible only with dark backgrounds
       - `"light"` → Compatible only with light backgrounds
     - If `backgroundAffinity` matches `background_mode` → Proceed silently ✓
     - If incompatible → Show warning and suggest alternatives
   - If `colorMetadata` does NOT exist → Proceed without warning (fallback)
</steps>

<reference title="Compatibility matrix">
| Slide Background | backgroundAffinity | Compatible? |
|------------------|-------------------|-------------|
| `dark` | `"dark"` | ✓ Yes |
| `dark` | `"light"` | ✗ No - warn |
| `dark` | `"both"` | ✓ Yes |
| `dark` | `"any"` | ✓ Yes |
| `light` | `"light"` | ✓ Yes |
| `light` | `"dark"` | ✗ No - warn |
| `light` | `"both"` | ✓ Yes |
| `light` | `"any"` | ✓ Yes |
| any | (no metadata) | ✓ Yes (fallback) |
</reference>

### Mismatch Warning Format

When an asset has incompatible `backgroundAffinity`, display this warning:

<reference title="Asset compatibility warning template">
```
⚠️ Asset Compatibility Warning

The requested asset '{{asset_name}}' has backgroundAffinity='{{asset_affinity}}'
but this slide has a {{slide_background_mode}} background.

Consider these compatible alternatives:
{{#each compatible_alternatives limit=3}}
• {{this.name}}: {{this.description}} (affinity: {{this.backgroundAffinity}})
{{/each}}

Proceeding with original selection. The asset may not display optimally.
```
</reference>

### Finding Compatible Alternatives

<steps>
1. When mismatch detected, scan the same catalog (icons/logos/images) for alternatives
2. Filter to assets where:
   - `colorMetadata.backgroundAffinity` matches slide's `background_mode`, OR
   - `colorMetadata.backgroundAffinity` is `"both"` or `"any"`
3. Rank by semantic similarity to the original concept (tags, description)
4. Return top 1-3 alternatives
5. If no compatible alternatives exist, note: "No compatible alternatives available"
</steps>

### Fallback Behavior

<critical>
Assets without `colorMetadata` MUST work unchanged for backwards compatibility.
</critical>

<reference title="Fallback rules">
| Scenario | Behavior |
|----------|----------|
| Asset has no `colorMetadata` | Proceed without warning |
| Asset has `colorMetadata` but no `backgroundAffinity` | Proceed without warning |
| Catalog not loaded | Proceed with standard selection |
| User explicitly requests incompatible asset | Warn, then proceed with their request |
</reference>

### Integration with Phase 3A

During template build (Phase 3A), apply smart selection when placing brand assets:

<steps>
1. For each icon/logo/image to be placed:
   - Run compatibility check (above)
   - If compatible → use asset silently
   - If incompatible → display warning, suggest alternatives, then use original
   - If no metadata → use asset silently (fallback)
2. Log asset selection decisions: "Selected {{asset_name}} ({{compatibility_status}})"
</steps>

→ Continue to Phase 2.9

---

## Phase 2.9: Content-Template Fit Validation

<critical>
Before building, validate that the matched template can actually accommodate the content structure.
Adapting a close template is ALWAYS preferred over building from scratch.
</critical>

<steps>
1. Parse `design_plan` (or `key_points` for legacy) to identify content structure:
   - Count items: "2-4 cards", "3 columns", "5 bullet points"
   - Identify layout type: grid, columns, single-focus, sequential
   - Note special requirements: icons, images, stats
2. Compare content structure against matched template capabilities:
   - Single-stat templates (callout): Can only hold 1 main item
   - Column templates (three-column-icons, comparison): Can hold 2-4 parallel items
   - List templates (agenda): Can hold 3-8 sequential items
   - Flow templates (process-flow): Can hold 3-6 connected steps
3. If **content exceeds template capacity** → find better match:
   - 4+ parallel items needed but callout matched → switch to three-column-icons
   - 2 items needed but three-column matched → switch to comparison
   - Sequential items needed but columns matched → switch to agenda or process-flow
4. If **no catalog template fits**, find the CLOSEST adaptable template:
   - Prefer templates that need minor adaptation (column count, background mode)
   - Avoid templates requiring fundamental layout changes
5. Set `{{selected_template}}` and `{{adaptation_required}}` (boolean)
6. Log decision: "Selected [template] for [content structure]. Adaptation: [yes/no]"
</steps>

<reference title="Content-to-Template Fit Matrix">
| Content Pattern | Best Templates | Avoid |
|-----------------|---------------|-------|
| Single stat/quote/insight | callout | columns, grid |
| 2 parallel items | comparison | callout, three-column |
| 3 parallel items with details | three-column-icons | callout, comparison |
| 4 parallel items (cards/asks) | three-column-icons (adapt to 4) | callout |
| 3-6 sequential steps | process-flow | columns, callout |
| 4-8 bullet list | agenda | callout, columns |
| Hero statement | title, title-hero-image | columns, agenda |
| Team/people showcase | team-grid | callout, agenda |
</reference>

<important>
If `suggested_template` from plan doesn't fit the content, override it with a better match.
The plan's suggestion is a hint, not a mandate. Content structure determines the right template.
</important>

### Step 7: Identify Similar Templates for Few-Shot Learning

<critical>
ALWAYS identify 2-3 semantically similar templates regardless of whether a template match was found.
These provide few-shot examples for custom generation in Phase 3B.
</critical>

<steps>
1. Compile slide context for semantic analysis:
   - **New schema**: description, design_plan keywords, storyline_role, background_mode
   - **Legacy schema**: intent, template keywords, visual_guidance, storyline_role, background_mode
2. Build template summaries for comparison:
   - For each template in catalog: `{{template.id}}: {{template.description}} (use_cases: {{template.use_cases.join(", ")}})`
3. Use LLM to rank templates by semantic similarity:

<reference title="LLM Semantic Similarity Prompt">
```
Given this slide request:
- Intent/Description: {{slide_description}}
- Design Plan: {{design_plan}}
- Storyline Role: {{storyline_role}}
- Background Mode: {{background_mode}}

Analyze these templates and rank by how well their PURPOSE matches the slide intent (1=best match):

{{#each catalog.templates}}
{{@index}}. {{this.id}}: {{this.description}}
   Use cases: {{this.use_cases}}
{{/each}}

Return the top 3 most similar template IDs as a JSON array: ["id1", "id2", "id3"]
Consider: layout type, content structure, presentation purpose, visual approach.
```
</reference>

4. Store result as `{{similar_templates}}` array (2-3 template IDs)
5. Log: "Similar templates identified: [{{similar_templates.join(", ")}}]"
</steps>

<note>
This step runs regardless of whether Phase 2.9 found a matching template.
- If template match found → similar_templates provides validation/alternatives
- If no match found → similar_templates guides Phase 3B custom generation
</note>

→ Continue to Phase 2.9.5

---

## Phase 2.9.5: Extract Few-Shot Patterns

<critical>
Extract abbreviated structural excerpts from similar templates to guide custom generation.
These excerpts provide concrete examples of CSS patterns, layout structure, and attribute conventions.
</critical>

<steps>
1. For each template ID in `{{similar_templates}}`:
   - Look up template in catalog by ID
   - Read HTML file from `.slide-builder/config/catalog/{{template.file}}`
2. Extract abbreviated structural excerpt from each template:
   - **CSS :root block**: First 10-12 custom property declarations
   - **Layout structure**: `.slide` CSS rules (display, grid/flex, padding)
   - **Primary component**: First major content container (columns, cards, or main content div)
   - **Attribute example**: One `contenteditable` element with `data-field` attribute
3. Format each excerpt with clear structure:

<reference title="Few-Shot Excerpt Format">
```
═══════════════════════════════════════
TEMPLATE: {{template.id}}
PURPOSE: {{template.description}}
BACKGROUND MODE: {{template.background_mode}} (this excerpt)
═══════════════════════════════════════

{{#if template.background_mode == "dark"}}
For LIGHT mode slides using this pattern:
- background: var(--color-bg-light) → #FFFFFF
- text: var(--color-text-on-light) → #0C0C0C
- accent: var(--color-accent-light) → #004b57 (Dusk)
{{else}}
For DARK mode slides using this pattern:
- background: var(--color-bg-dark) → #0C0C0C
- text: var(--color-text-on-dark) → #FFFFFF
- accent: var(--color-accent) → #EAFF5F (Amp Yellow)
{{/if}}

CSS CUSTOM PROPERTIES:
```css
:root {
  --color-primary: ...;
  --color-secondary: ...;
  /* First 10 variables */
}
```

LAYOUT STRUCTURE:
```css
.slide {
  /* Main container styles */
}
```

PRIMARY COMPONENT (abbreviated):
```html
<div class="[main-component-class]">
  <!-- First child structure only -->
</div>
```

ATTRIBUTE PATTERN:
```html
<h1 class="title" contenteditable="true" data-field="title">...</h1>
```
═══════════════════════════════════════
```
</reference>

<reference title="Color Scheme Values for Mode Adaptation">
When adapting a template to a different background mode, use these resolved values:

DARK MODE (from theme.workflowRules.colorSchemes.dark):
- background: #0C0C0C (colors.background.dark)
- textHeading: #FFFFFF (colors.text.onDark)
- textBody: #E8EDEF (colors.text.body)
- accent: #EAFF5F (colors.accent / Amp Yellow)

LIGHT MODE (from theme.workflowRules.colorSchemes.light):
- background: #FFFFFF (colors.background.light)
- textHeading: #0C0C0C (colors.text.onLight)
- textBody: #0C0C0C (colors.text.onLight)
- accent: #004b57 (colors.brand.dusk)
</reference>

4. Concatenate all excerpts into `{{few_shot_excerpts}}` variable
5. Log: "Extracted few-shot patterns from {{similar_templates.length}} templates"
</steps>

<important>
Keep excerpts ABBREVIATED - extract patterns, not full templates.
Goal is to show structural conventions, not provide copy-paste code.
</important>

→ Continue to Phase 2.95 (Design Checkpoint)

---

## Phase 2.95: Design Checkpoint

<critical>
This checkpoint presents an AI-generated design proposal using context unavailable at planning time:
the previous slide's actual template and background, section progress, and rhythm calculations.
Users approve or modify before generation proceeds.
</critical>

### Step 1: Check Skip Conditions

<steps>
1. Check if `{{skip_all_checkpoints}}` session flag is set (from previous "Skip All Checkpoints" selection)
   - If set → skip to Phase 3A/3B with current selections, log: "Checkpoint skipped (YOLO mode active)"
2. Check if invoked with `--yolo` or `#yolo` flag
   - If set → skip to Phase 3A/3B, log: "Checkpoint skipped (YOLO flag)"
3. Check if this is build-all context AND `{{yolo_batch}}` is true
   - If true → skip to Phase 3A/3B, log: "Checkpoint skipped (batch mode)"
4. Otherwise → proceed to Step 2
</steps>

### Step 2: Load Previous Slide Context

<critical>Load context about the previous slide to inform design decisions and maintain visual rhythm.</critical>

<steps>
1. Get current slide number from `{{slide.number}}`
2. If slide number > 1:
   - Find previous slide in `plan.yaml` slides array (number = current - 1)
   - Extract from previous slide:
     - `{{prev_template}}` = previous slide's `suggested_template` or template used
     - `{{prev_background_mode}}` = previous slide's `background_mode` (default: "dark")
     - `{{prev_status}}` = previous slide's build status
   - Check for previous slide's built HTML at `output/{{deck_slug}}/slides/slide-{{prev_number}}.html`
     - If exists → `{{prev_thumbnail_path}}` = that path
     - If not exists → `{{prev_thumbnail_path}}` = null
3. If slide number == 1:
   - Set `{{prev_template}}` = null
   - Set `{{prev_background_mode}}` = null
   - Set `{{prev_thumbnail_path}}` = null
   - Set `{{is_first_slide}}` = true
4. Store context as `{{previous_slide_context}}`
</steps>

### Step 3: Calculate Section Progress

<steps>
1. Get current slide's `agenda_section_id` (if present)
2. If agenda_section_id exists:
   - Count total slides in plan with same `agenda_section_id` → `{{section_total}}`
   - Count slides with same section before current slide → `{{section_position}}`
   - Format: "Slide {{section_position}} of {{section_total}} in '{{section_title}}'"
   - Store as `{{section_progress}}`
3. If no agenda_section_id:
   - Use overall position: "Slide {{slide.number}} of {{total_slides}}"
   - Store as `{{section_progress}}`
</steps>

### Step 4: Calculate Optimal Background Mode

<critical>Apply rhythm rules from theme to determine optimal background mode for visual variety.</critical>

<steps>
1. Load rhythm rules from `theme.workflowRules.rhythm`:
   - `{{max_consecutive_dark}}` = rhythm.maxConsecutiveDark (default: 3)
   - `{{max_consecutive_light}}` = rhythm.maxConsecutiveLight (default: 2)
   - `{{role_overrides}}` = rhythm.roleOverrides
2. Count consecutive slides with same background mode (look back from previous slide):
   - Scan backwards until mode changes
   - Store count as `{{consecutive_same_mode}}`
3. Check for role override:
   - If `{{slide.storyline_role}}` exists in `{{role_overrides}}`
     - `{{role_suggested_mode}}` = role_overrides[storyline_role]
4. Calculate optimal mode:
   - If role override exists → prefer `{{role_suggested_mode}}`
   - Else if consecutive dark >= max_consecutive_dark → suggest "light" (rhythm break)
   - Else if consecutive light >= max_consecutive_light → suggest "dark" (rhythm break)
   - Else → use plan's `background_mode` or default to "dark"
5. Store as `{{optimal_background_mode}}`
6. If optimal differs from plan's mode, note: "Rhythm adjustment: {{reason}}"
</steps>

### Step 5: Generate Design Proposal

<steps>
1. Compile proposal components:
   - `{{proposed_template}}` = `{{selected_template.id}}` from Phase 2 scoring
   - `{{proposed_background_mode}}` = `{{optimal_background_mode}}` from Step 4
   - `{{proposed_layout_approach}}` = summarize from `{{slide.design_plan}}` or generate brief description
   - `{{proposed_assets}}` = list any icons/images identified in Phase 2.6-2.8 that match slide content
2. Generate confidence indicator:
   - Template confidence: `{{selected_template.score}}%`
   - Background mode: "Based on rhythm rules" or "Plan specified"
3. Store complete proposal as `{{design_proposal}}`
</steps>

### Step 6: Display Design Checkpoint

<reference title="Checkpoint Display Format">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN CHECKPOINT — Slide {{slide.number}} of {{total_slides}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SLIDE INTENT
───────────────────────────────────────────────────────────────────────────────
{{slide.description || slide.intent}}

Role: {{slide.storyline_role}}  |  Tone: {{slide.tone}}
{{section_progress}}

📊 CONTEXT (Previous Slide)
───────────────────────────────────────────────────────────────────────────────
{{#if is_first_slide}}
This is the first slide — no previous context to reference.
{{else}}
Previous: Slide {{prev_number}} used **{{prev_template}}** template with **{{prev_background_mode}}** background
{{#if consecutive_same_mode > 1}}
⚠️ {{consecutive_same_mode}} consecutive {{prev_background_mode}} slides — consider rhythm break
{{/if}}
{{/if}}

🎯 DESIGN PROPOSAL
───────────────────────────────────────────────────────────────────────────────
**Template:** {{proposed_template}} ({{selected_template.score}}% confidence)
  → {{selected_template.reasons.join(", ")}}

**Background:** {{proposed_background_mode}}
  {{#if background_rhythm_note}}→ {{background_rhythm_note}}{{/if}}

**Layout Approach:**
  {{proposed_layout_approach}}

**Suggested Assets:**
  {{#each proposed_assets}}• {{this.type}}: {{this.name}} ({{this.path}}){{/each}}
  {{#if proposed_assets.length == 0}}No specific assets identified — will use theme defaults{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</reference>

<steps>
1. Output the formatted checkpoint display (above)
2. Present options using AskUserQuestion
</steps>

### Step 7: Handle User Response

<ask context="Review the design proposal above. How would you like to proceed?"
     header="Design">
  <choice label="Approve" description="Build with proposed design ({{proposed_template}}, {{proposed_background_mode}})" />
  <choice label="Change Template" description="Select a different template from the catalog" />
  <choice label="Change Background" description="Toggle between dark/light background mode" />
  <choice label="Edit Layout" description="Provide custom layout instructions" />
  <choice label="Skip All Checkpoints" description="Auto-approve all remaining slides (YOLO mode)" />
</ask>

<check if="user selected Approve">
  <action>Log: "Design approved: {{proposed_template}}, {{proposed_background_mode}}"</action>
  <action>Set `{{selected_template}}` = template from proposal</action>
  <action>Set `{{background_mode}}` = `{{proposed_background_mode}}`</action>
  <goto>Phase 3A or 3B based on template selection</goto>
</check>

<check if="user selected Change Template">
  <action>Display filtered template matches (top 5 from Phase 2 scoring)</action>
  <ask context="Available templates (sorted by match score):

{{#each template_candidates limit=5}}
{{@index + 1}}. **{{this.id}}** ({{this.score}}%): {{this.reasons.join(', ')}}
{{/each}}

Or type 'all' to see all {{catalog_total}} templates."
       header="Template">
    <choice label="{{template_candidates[0].id}}" description="{{template_candidates[0].score}}% match" />
    <choice label="{{template_candidates[1].id}}" description="{{template_candidates[1].score}}% match" />
    <choice label="{{template_candidates[2].id}}" description="{{template_candidates[2].score}}% match" />
    <choice label="Show all templates..." description="Browse complete template catalog" />
  </ask>
  <check if="user selected 'Show all templates...'">
    <action>List all templates from catalog with IDs and descriptions</action>
    <action>Ask user to select by name or number</action>
  </check>
  <action>Update `{{selected_template}}` to user's choice</action>
  <action>Log: "Template changed: {{previous_template}} → {{selected_template.id}}"</action>
  <goto>Phase 3A with new template</goto>
</check>

<check if="user selected Change Background">
  <action>Toggle background mode: dark ↔ light</action>
  <action>Show rhythm impact: "Changing to {{new_mode}} would result in {{new_consecutive}} consecutive {{new_mode}} slides"</action>
  <ask context="Background mode: **{{current_mode}}** → **{{new_mode}}**

Rhythm impact: {{rhythm_impact_message}}"
       header="Confirm">
    <choice label="Confirm {{new_mode}}" description="Use {{new_mode}} background for this slide" />
    <choice label="Keep {{current_mode}}" description="Stay with original background mode" />
  </ask>
  <action>Update `{{background_mode}}` to confirmed choice</action>
  <action>Log: "Background changed: {{previous_mode}} → {{background_mode}}"</action>
  <goto>Phase 3A or 3B with updated background</goto>
</check>

<check if="user selected Edit Layout">
  <action>Accept freeform text input for layout adjustments</action>
  <ask>Describe your layout adjustments (e.g., "Add a third column", "Use horizontal layout instead", "Include an icon for each point"):</ask>
  <action>Store input as `{{layout_adjustments}}`</action>
  <action>Merge adjustments with `{{slide.design_plan}}`</action>
  <action>Log: "Layout customized: {{layout_adjustments}}"</action>
  <goto>Phase 3A or 3B with merged design plan</goto>
</check>

<check if="user selected Skip All Checkpoints">
  <action>Set `{{skip_all_checkpoints}}` = true (session flag)</action>
  <action>Log: "YOLO mode activated — skipping all remaining checkpoints"</action>
  <output>✅ **YOLO mode activated** — remaining slides will auto-approve with AI-proposed designs.</output>
  <goto>Phase 3A or 3B with current proposal</goto>
</check>

### Step 8: Update Status with Design Choices

<steps>
1. After checkpoint approval (any path), record the final design choices in status.yaml:
   - `decks.{{deck_slug}}.last_slide_template` = `{{selected_template.id}}`
   - `decks.{{deck_slug}}.last_slide_background` = `{{background_mode}}`
   - This provides context for the NEXT slide's checkpoint
2. Proceed to appropriate build phase
</steps>

→ Continue to Phase 3A (if template selected) or Phase 3B (if custom generation needed)

---

## Phase 3A: Template Build

<critical>
Brand assets MUST come from approved catalogs when available.
- Icons: ONLY from icon-catalog.json — NEVER emoji or generated SVG
- Logos: ONLY from logo-catalog.json — NEVER draw or recreate
- Images: ONLY from images-catalog.json when decorative elements needed
If concept has no catalog match → OMIT element entirely. Do NOT substitute.
</critical>

<steps>
1. Read matched template HTML from `.slide-builder/config/catalog/{{matched_template.file}}`
2. Read theme from `.slide-builder/config/theme.json`
3. Study template structure: layout, spacing, decorative elements, typography
4. **If `{{adaptation_required}}` is true**, apply template adaptations (see rules below)
5. Map theme.json values to CSS custom properties
6. Generate content from plan (enriched with section discovery):
   - **New schema**: description → title/messaging, design_plan → layout, enriched_section_goals → content direction
   - **Legacy schema**: intent → title, key_points → body, enriched_key_message → headline guidance
   - Include `available_research` as supporting data if relevant
7. Apply brand asset selection from catalogs with **Smart Asset Selection** (Phase 2.8.5):
   **Icons** (if `{{icon_catalog_available}}`):
   - Find icons where `base_icon` matches concept OR `tags` contain concept
   - Filter by `backgroundAffinity` == slide's `background_mode`
   - Prefer larger `size` if multiple matches
   - Use icon's `file` field directly for path (flat directory, no variant subfolders)
   - If no match → OMIT icon entirely (no emoji, no generated SVG)
   **Logos** (if `{{logo_catalog_available}}`):
   - Match concept against `{{logo_catalog}}` using id or tags
   - **Color Intelligence:** Check `colorMetadata.backgroundAffinity` against slide's `background_mode`
     - If compatible or no metadata → proceed silently
     - If incompatible → warn user, suggest alternatives, then proceed
   - Select variant based on `background_mode` (dark bg → light variant, light bg → dark variant)
   - If no match → OMIT logo entirely (no drawing, no recreation)
   **Images** (if `{{images_catalog_available}}`):
   - Match concept against `{{images_catalog}}` using id, category, or tags
   - **Color Intelligence:** Check `colorMetadata.backgroundAffinity` against slide's `background_mode`
     - If compatible or no metadata → proceed silently
     - If incompatible → warn user, suggest alternatives, then proceed
   - If no match → OMIT image entirely (no generation, no substitution)
8. Apply `{{design_constraints}}`: font sizes, spacing, content density limits
9. Assemble complete HTML following Authoritative Example structure
10. **Verify compliance** against Critical Requirements table AND design standards
</steps>

<reference title="Template Adaptation Rules">
**Adaptations ALLOWED** (preserve template visual language):
| Adaptation | How to Apply |
|------------|--------------|
| Column count (3→4) | Duplicate column div, adjust `grid-template-columns` or flex proportions |
| Column count (3→2) | Remove one column div, adjust grid/flex |
| Background mode (light→dark) | Swap CSS variables: `--color-bg-light` → `--color-bg-dark`, text colors accordingly |
| Background mode (dark→light) | Swap CSS variables: `--color-bg-dark` → `--color-bg-light`, text colors accordingly |
| Content density | Add/remove bullet items, card items within same structure |
| Icon substitution | Replace icon paths with catalog matches |

**Adaptations NOT ALLOWED** (would break template identity):
| Change | Why Not |
|--------|---------|
| Callout → Multi-column | Fundamentally different layout purpose |
| Columns → Single-focus | Would lose the parallel comparison intent |
| Process-flow → Grid | Sequential vs. parallel are incompatible |
| Adding entirely new sections | Template structure should remain recognizable |

**Preserve these template elements**:
- Spacing ratios (padding, gaps, margins)
- Border styles and radii
- Typography hierarchy (relative sizes)
- Decorative elements (gradients, accents, dividers)
- Footer/header patterns
</reference>

<reference title="CSS variable mapping">
```css
:root {
  --color-primary: {{theme.colors.primary}};
  --color-secondary: {{theme.colors.secondary}};
  --color-accent: {{theme.colors.accent}};
  --color-bg-default: {{theme.colors.background.default}};
  --color-bg-alt: {{theme.colors.background.alt}};
  --color-bg-dark: {{theme.colors.background.dark}};
  --color-bg-light: {{theme.colors.background.light}};
  --color-text-heading: {{theme.colors.text.heading}};
  --color-text-body: {{theme.colors.text.body}};
  --color-text-on-dark: {{theme.colors.text.onDark}};
  --color-text-on-light: {{theme.colors.text.onLight}};
  --font-heading: {{theme.typography.fonts.heading}};
  --font-body: {{theme.typography.fonts.body}};
  --font-mono: {{theme.typography.fonts.mono}};
}
```
</reference>

<reference title="Color scheme resolution from theme">
Color values MUST come from `theme.workflowRules.colorSchemes`, not hardcoded values.

**Resolution Algorithm:**
1. Get `background_mode` from slide plan (default: "dark" if missing)
2. Look up scheme: `scheme = theme.workflowRules.colorSchemes[background_mode]`
3. For each key in scheme (background, textHeading, textBody, accent):
   - If value contains "." (is a path like "colors.background.dark"):
     - Resolve path against theme object (e.g., theme.colors.background.dark → "#0C0C0C")
   - Else use value directly
4. Store resolved colors as `{{resolved_colors}}`

**Example Resolution (dark mode):**
```
Input scheme:
  background: "colors.background.dark"
  textHeading: "colors.text.onDark"
  textBody: "colors.text.body"
  accent: "colors.accent"

Resolved:
  background: "#0C0C0C"    (from theme.colors.background.dark)
  textHeading: "#FFFFFF"   (from theme.colors.text.onDark)
  textBody: "#E8EDEF"      (from theme.colors.text.body)
  accent: "#EAFF5F"        (from theme.colors.accent)
```
</reference>

<critical>
If `background_mode` is missing from the slide, default to `dark` for backwards compatibility.
All color values must be resolved from theme - no hardcoded hex values in this workflow.
</critical>

→ Continue to Phase 4

---

## Phase 3B: Custom Build (Frontend Design Skill) — LAST RESORT

<critical>
Custom builds should be rare. Only use this path when:
1. `suggested_template` is explicitly `"custom"` in the plan, OR
2. NO catalog template can be reasonably adapted (must justify why)

If you reach this phase without explicit `"custom"` in plan, you MUST first present alternatives to the user.
</critical>

### Pre-Custom Gate (skip if `suggested_template: "custom"`)

<steps>
1. Identify the 2 closest catalog templates that COULD be adapted
2. Present to user via AskUserQuestion:
   - Option 1: "[Template A] - adapt by [specific changes]"
   - Option 2: "[Template B] - adapt by [specific changes]"
   - Option 3: "Build fully custom (no template base)"
3. If user selects Option 1 or 2 → return to Phase 3A with that template
4. If user selects Option 3 → proceed with custom build below
5. Log: "Custom build selected. Closest alternatives were: [A], [B]"
</steps>

### Custom Build Steps

<steps>
1. Read `.slide-builder/config/theme.json`
2. Read design standards from `{{design_constraints}}`
3. Invoke frontend-design skill with slide requirements (see prompt below)
4. Validate skill output against checklist and design standards
5. Fix any compliance issues
6. **Verify compliance** against Critical Requirements table
</steps>

<important>
Invoke the skill using the **Skill tool** with `skill: "frontend-design"`.
</important>

### Pre-Generation Confirmation Gate

<critical>
BEFORE invoking the frontend-design skill, confirm ALL of the following.
These are the most common failure points requiring post-generation fixes.
</critical>

<pre-generation-checklist>
CONFIRM your generated HTML will include:

[ ] CSS VARIABLES in :root:
    --color-primary, --color-secondary, --color-accent
    --color-bg-default, --color-bg-dark, --color-bg-light
    --color-text-heading, --color-text-body
    --font-heading, --font-body

[ ] DATA-FIELD NAMING: lowercase-hyphenated
    CORRECT: data-field="point-1", data-field="column-header"
    WRONG: data-field="Point1", data-field="column_header"

[ ] CONTENTEDITABLE on EVERY visible text element
    Each with both contenteditable="true" AND unique data-field

[ ] NESTING DEPTH: ≤ 4 levels from .slide to deepest text

[ ] CSS COLORS: var(--color-*) for all values (no hardcoded hex in component CSS)

[ ] VIEWPORT: width=1920, height=1080

[ ] DIMENSIONS: body AND .slide = 1920px x 1080px

[ ] AUTO-SAVE: saveEdits() function before </body>
</pre-generation-checklist>

<reference title="Prompt for frontend-design skill">
```
Create a presentation slide as a single HTML file.

SLIDE REQUIREMENTS (use whichever schema applies):
- New schema: Description, Design Plan, Background Mode, Tone, Storyline Role, Section Goals
- Legacy schema: Intent, Key Points, Visual Guidance, Background Mode, Tone, Storyline Role

BACKGROUND MODE COLORS (resolved from theme):
- Background: {{resolved_colors.background}}
- Text Heading: {{resolved_colors.textHeading}}
- Text Body: {{resolved_colors.textBody}}
- Accent: {{resolved_colors.accent}}

═══════════════════════════════════════════════════════════════
STRUCTURAL EXAMPLES (follow these patterns):
{{few_shot_excerpts}}
═══════════════════════════════════════════════════════════════

CRITICAL: Your output MUST follow the structural patterns demonstrated above:
- Use the SAME CSS variable naming conventions (--color-primary, --color-secondary, --font-heading, --font-body, etc.)
- Follow the SAME component structure patterns (grid/flex layouts, nesting depth)
- Apply contenteditable + data-field to ALL text elements exactly as shown
- Match spacing and typography scale patterns from examples
- Use the SAME data-field naming conventions: lowercase, hyphenated (title, subtitle, point-1, description)

PATTERN REQUIREMENTS (non-negotiable):
1. CSS Variables: :root MUST declare --color-primary, --color-secondary, --color-accent, --color-bg-*, --color-text-*, --font-heading, --font-body
2. data-field Naming: ALL values must be lowercase, hyphenated (e.g., "title", "subtitle", "point-1", "column-header")
3. Structure: Main content nesting depth should be ≤4 levels, similar to examples
4. Spacing: Slide padding 60-80px, section gaps 40px, element gaps 16-24px (match example patterns)

TECHNICAL: 1920x1080px, contenteditable on all text, unique data-field, CSS variables, auto-save script

BRAND ASSET RULES (if catalogs available):
Icons:
- ONLY from icon-catalog.json (v2.0 schema), NEVER emoji or generated SVG
- Select by: match `base_icon` or `tags`, filter by `backgroundAffinity` == slide's `background_mode`, prefer larger `size`
- Use `file` field directly for path (flat icons/ directory, no variant subfolders)
- If concept not in catalog → OMIT icon

Logos:
- ONLY from logo-catalog.json, NEVER draw or recreate
- Variant: dark bg → light variant, light bg → dark variant
- If concept not in catalog → OMIT logo

Images:
- ONLY from images-catalog.json for decorative elements
- Match by id, category, or tags
- If concept not in catalog → OMIT image

CRITICAL: If ANY asset type has no catalog match → OMIT entirely. Do NOT substitute.

═══════════════════════════════════════
PRE-OUTPUT CHECK:
✓ :root declares all --color-* and --font-* variables
✓ ALL text has contenteditable="true" + unique data-field
✓ data-field values are lowercase-hyphenated
✓ No hardcoded colors (use var(--color-*))
✓ Nesting ≤ 4 levels | saveEdits() present
═══════════════════════════════════════

Output only complete HTML starting with <!DOCTYPE html>.
```
</reference>

<checklist title="Validate skill output">
- [ ] All text elements have `contenteditable="true"`
- [ ] All contenteditable elements have unique `data-field`
- [ ] Viewport meta is `width=1920, height=1080`
- [ ] Body and .slide are 1920x1080px
- [ ] `saveEdits()` function exists
- [ ] CSS uses `--color-*` variables
- [ ] Background matches `background_mode`
- [ ] Text colors appropriate for background
- [ ] Icons use catalog paths only (no emoji, no generated SVG)
- [ ] Logos use catalog paths only (no drawn or recreated logos)
- [ ] Images use catalog paths only (no generated or substitute images)
- [ ] Missing catalog assets are OMITTED, not substituted
</checklist>

→ Continue to Phase 3B.5

---

## Phase 3B.5: Quality Validation (Few-Shot Pattern Compliance)

<critical>
After custom generation, validate that output matches the quality characteristics of the example templates.
This ensures custom slides feel cohesive with template-based slides in the same deck.
</critical>

<steps>
1. Compare generated HTML against `{{few_shot_excerpts}}` patterns
2. Run through compliance checklist below
3. For each failed check:
   - Log the specific issue
   - Attempt automatic fix if possible
   - If unfixable, warn user and note in output
4. Track compliance score: count passed checks / total checks
5. Log: "Pattern compliance: {{passed}}/{{total}} checks passed"
</steps>

<checklist title="CSS Variable Naming Compliance">
- [ ] :root block declares `--color-primary`
- [ ] :root block declares `--color-secondary`
- [ ] :root block declares `--color-accent`
- [ ] :root block declares `--color-bg-default` or `--color-bg-dark`/`--color-bg-light`
- [ ] :root block declares `--color-text-heading`
- [ ] :root block declares `--color-text-body`
- [ ] :root block declares `--font-heading`
- [ ] :root block declares `--font-body`
- [ ] No hardcoded color values in body/component CSS (use var(--color-*))
- [ ] CSS variable names match example template conventions exactly
</checklist>

<checklist title="data-field Convention Compliance">
- [ ] ALL contenteditable elements have unique `data-field` attributes
- [ ] data-field values are lowercase (no uppercase letters)
- [ ] data-field values use hyphens for multi-word names (e.g., "point-1", not "point1" or "point_1")
- [ ] data-field naming follows semantic patterns: title, subtitle, eyebrow, body, point-N, stat-value, stat-label
- [ ] No duplicate data-field values in the document
- [ ] data-field coverage: every visible text element has a field identifier
</checklist>

<checklist title="Structural Similarity Compliance">
- [ ] Layout uses similar approach as closest example (grid/flex, not absolute positioning)
- [ ] Main content nesting depth ≤ 4 levels (count from .slide to deepest text element)
- [ ] Component organization follows example patterns (header → content → footer flow)
- [ ] Spacing values are within expected ranges: slide padding 60-80px, gaps 16-40px
- [ ] Typography hierarchy is clear: headings > subheadings > body > captions
- [ ] Visual weight distribution similar to examples (not top-heavy or unbalanced)
</checklist>

<reference title="Auto-fix Rules">
| Issue | Auto-fix Action |
|-------|-----------------|
| Missing CSS variable | Add to :root block with theme value |
| Hardcoded color | Replace with appropriate var(--color-*) |
| Missing data-field | Generate semantic field name from element context |
| Uppercase in data-field | Convert to lowercase |
| Underscore in data-field | Replace with hyphen |
| Missing contenteditable | Add contenteditable="true" to text elements |
</reference>

<important>
If compliance score is below 80% (fewer than 80% of checks passed), warn user:
"⚠️ Custom slide has pattern compliance issues. Consider reviewing against template examples."
</important>

→ Continue to Phase 4

---

## Phase 4: Save Output Files

<steps>
1. Ensure output directory exists
2. Generate unique 8-character hex slide ID (e.g., `a1b2c3d4`)
3. Add `data-slide-id="{id}"` to `.slide` div
4. Write HTML file to `output_path`
5. (Deck mode) Create state file at `state_path`:
   ```json
   { "slide": {{number}}, "edits": [], "lastModified": null }
   ```
</steps>

→ Continue to Phase 4.5

---

## Phase 4.5: Browser Validation (Optional)

<context>
This phase validates the generated slide in a real browser when a browser-capable MCP is available.
Validation only runs if a browser-capable MCP is detected. If no MCP is available, this phase
skips gracefully and proceeds directly to Phase 5 without blocking the build.
</context>

### Step 1: Detect Browser MCP Availability

<steps>
1. Query for browser-capable MCP tools using ToolSearch:
   - Query: "browser screenshot puppeteer chrome"
   - This searches for tools matching browser/screenshot/puppeteer/chrome patterns
2. Evaluate ToolSearch results:
   - If tools found matching browser/screenshot/puppeteer patterns:
     - Set `{{browser_mcp_available}}` = true
     - Store matching tool names as `{{browser_tools}}`
   - If no tools found:
     - Set `{{browser_mcp_available}}` = false
</steps>

### Step 2: Route Based on MCP Availability

<check if="{{browser_mcp_available}} == false">
  <output>ℹ️ Browser validation skipped (no MCP available)</output>
  <goto>Phase 5</goto>
</check>

<check if="{{browser_mcp_available}} == true">
  <action>Log: "Browser MCP detected: {{browser_tools}}"</action>
  <action>Continue to browser validation steps below</action>
</check>

### Step 3: Technical Validation

<critical>All validation steps are wrapped in error handling. Any failure skips validation gracefully.</critical>

<steps>
1. **Render slide in browser:**
   - Use browser MCP to navigate to the generated HTML file at `{{output_path}}`
   - Set viewport to 1920x1080
   - If navigation fails → Set `{{validation_error}}` = "Browser navigation failed", skip to Step 5

2. **Perform technical checks:**
   - Query `.slide` element dimensions:
     - Expected: exactly 1920px width × 1080px height
     - Store result as `{{dim_check}}` = PASS/FAIL with actual dimensions
   - Query `[contenteditable]` elements:
     - All visible text elements should have `contenteditable="true"`
     - Store result as `{{edit_check}}` = PASS/FAIL with element count
   - Capture browser console output:
     - Check for JavaScript errors (filter out warnings)
     - Store result as `{{console_check}}` = PASS/FAIL with error list
   - If any query fails → Note partial validation, continue with available results

3. **Store technical validation results:**
   ```
   {{technical_validation}} = {
     dimensions: { passed: bool, actual: "WxH", expected: "1920x1080" },
     contenteditable: { passed: bool, count: N, missing: [] },
     console: { passed: bool, errors: [] }
   }
   ```
</steps>

### Step 4: Visual Quality Assessment

<steps>
1. **Capture screenshot:**
   - Use browser MCP screenshot capability to capture full-page screenshot
   - Store screenshot for LLM visual analysis
   - If screenshot fails → Set `{{screenshot_error}}` = true, skip visual assessment

2. **Analyze content density:**
   - Compare actual content density to expected for `{{slide.storyline_role}}`
   <reference title="Density Expectations by Role">
   | Role | Expected Density | Description |
   |------|------------------|-------------|
   | opening | Sparse (20-30%) | Bold visual impact, minimal text |
   | tension | Moderate (40-50%) | Problem statement, focused content |
   | resolution | Substantive (50-60%) | Solution details, supporting points |
   | evidence | Moderate to Dense (50-70%) | Data, proof points, charts |
   | cta | Sparse to Moderate (30-50%) | Clear call-to-action, clean layout |
   </reference>
   - Store finding as `{{density_assessment}}`

3. **Analyze whitespace distribution:**
   - Check for empty regions > 30% of slide with no content
   - Check for text/content clustered in one area leaving large voids
   - Check if visual anchors would improve balance
   - Store findings as `{{whitespace_findings}}`

4. **Assess proportional sizing:**
   - Check text sizes relative to slide area
   - Flag headlines < 36pt as potentially too small
   - Flag single bullets at small font as "timid"
   - Store findings as `{{sizing_findings}}`

5. **Check icon color contrast:**
   - For each icon, identify its immediate parent background (card, panel, box)
   - NOT the slide background - the container element's background
   - Verify icon color contrasts with immediate background:
     - White icons on light containers = FAIL (washed out)
     - Dark icons on dark containers = FAIL (washed out)
   - Store findings as `{{icon_contrast_findings}}`

6. **Verify logo catalog compliance:**
   - Find all `<img>` elements that appear to be logos
   - Check src paths against logo catalog location:
     - Valid: `.slide-builder/config/catalog/brand-assets/logos/*`
     - Invalid: External URLs, other paths, inline SVG recreations
   - Verify correct variant for background mode:
     - Dark background → light/white logo variant
     - Light background → dark logo variant
   - Store findings as `{{logo_compliance_findings}}`
</steps>

### Step 5: Compile Validation Report

<check if="{{validation_error}} is set">
  <output>⚠️ Browser validation encountered an error: {{validation_error}}
Skipping validation and proceeding to Phase 5.</output>
  <goto>Phase 5</goto>
</check>

<reference title="Validation Report Format">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BROWSER VALIDATION — Slide {{slide.number}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 TECHNICAL CHECKS
───────────────────────────────────────────────────────────────────────────────
{{#if technical_validation.dimensions.passed}}✅{{else}}❌{{/if}} Dimensions: {{technical_validation.dimensions.actual}} (expected 1920x1080)
{{#if technical_validation.contenteditable.passed}}✅{{else}}❌{{/if}} Contenteditable: {{technical_validation.contenteditable.count}} elements found
{{#if technical_validation.console.passed}}✅{{else}}❌{{/if}} Console: {{#if technical_validation.console.passed}}No errors{{else}}{{technical_validation.console.errors.length}} error(s){{/if}}

🎨 VISUAL QUALITY
───────────────────────────────────────────────────────────────────────────────
{{#if screenshot_error}}
⚠️ Screenshot capture failed — visual assessment skipped
{{else}}
• **Density:** {{density_assessment}}
• **Whitespace:** {{whitespace_findings}}
• **Sizing:** {{sizing_findings}}
• **Icon Contrast:** {{icon_contrast_findings}}
• **Logo Compliance:** {{logo_compliance_findings}}
{{/if}}

{{#if has_issues}}
💡 RECOMMENDATIONS
───────────────────────────────────────────────────────────────────────────────
{{#each recommendations}}
• {{this}}
{{/each}}
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</reference>

<steps>
1. Compile all validation findings into the report format above
2. Determine if any issues were found: `{{has_issues}}` = any FAIL results or visual quality concerns
3. Generate specific recommendations based on findings:
   - Dimensions wrong → "Check slide container CSS for fixed 1920x1080 dimensions"
   - Missing contenteditable → "Add contenteditable='true' to text elements: {{missing_elements}}"
   - Console errors → "Fix JavaScript errors: {{error_list}}"
   - Density mismatch → "Adjust content amount for {{storyline_role}} role (expected {{expected_density}})"
   - Whitespace issues → "{{whitespace_recommendation}}"
   - Icon contrast fail → "Select icon with backgroundAffinity matching {{background_type}} from catalog"
   - Logo non-compliant → "Replace with catalog logo from .slide-builder/config/catalog/brand-assets/logos/"
4. Display the compiled report to user
</steps>

### Step 6: Present User Options

<ask context="Review the validation findings above. How would you like to proceed?"
     header="Validate">
  <choice label="Accept" description="Slide passes validation, continue to Phase 5" />
  <choice label="Fix Issues" description="Return to Phase 3 to regenerate with corrections" />
  <choice label="Skip" description="Ignore findings and continue to Phase 5" />
</ask>

<check if="user selected Accept">
  <action>Log: "Validation accepted — proceeding to Phase 5"</action>
  <goto>Phase 5</goto>
</check>

<check if="user selected Skip">
  <action>Log: "Validation skipped by user — proceeding to Phase 5"</action>
  <goto>Phase 5</goto>
</check>

<check if="user selected Fix Issues">
  <action>Log: "User requested fixes — returning to Phase 3"</action>
  <action>Compile fix instructions from recommendations into `{{regeneration_context}}`</action>
  <action>Set `{{fix_mode}}` = true to indicate regeneration with corrections</action>
  <output>🔄 Returning to slide generation with the following corrections:
{{#each recommendations}}
• {{this}}
{{/each}}
  </output>
  <goto>Phase 3A or 3B with {{regeneration_context}}</goto>
</check>

→ Continue to Phase 5

---

## Phase 5: Update Viewer (Deck Mode Only)

<context>Skip this phase for single mode slides.</context>

<steps>
1. Run: `node scripts/regenerate-viewer.js {{deck_slug}}`
2. This updates manifest.json and index.html
</steps>

→ Continue to Phase 6

---

## Phase 6: Update Status

<critical>
This phase is MANDATORY — never skip it. The Plan Editor UI reads slide status directly from plan.yaml.
If you skip this step, built slides will still appear as "pending" in the UI.
</critical>

<steps>
1. (Deck mode) Update `output/{{deck_slug}}/plan.yaml`:
   <action>Read the file, find the slide entry where `number: {{slide_number}}`, change its `status` field from `"pending"` to `"built"`</action>
   <action>Write the updated plan.yaml back to disk</action>
   <action>Verify: re-read plan.yaml and confirm the slide's status is now `"built"`</action>

2. (Deck mode) Update `.slide-builder/status.yaml`:
   - `decks.{{deck_slug}}.built_count`: **Recompute from plan.yaml** — re-read `output/{{deck_slug}}/plan.yaml`, count all slides where `status === "built"`, and set `built_count` to that count (do NOT increment by 1). Log: `Status update: built_count recomputed to ${actual_built} (was ${previous_built_count})`.
   - `decks.{{deck_slug}}.current_slide`: Slide number just built
   - `decks.{{deck_slug}}.last_action`: Description
   - `decks.{{deck_slug}}.last_modified`: ISO 8601 timestamp
   - Status transitions: `planned` + first build → `building`; built_count == total → `complete`

3. Update top-level status.yaml: `last_modified`, append to `history`
</steps>

→ Continue to Phase 7

---

## Phase 7: Report Success

**Report to user based on mode:**

- **Deck mode**: Slide built (number + intent), progress (X of Y), remaining count, output path, next steps (`/sb:build-one`, `/sb:build-all`, `/sb:edit`)
- **Single mode**: Confirmation, output path, features (editable, auto-save, themed), next steps (open browser, `/sb:edit`, `/sb:export`)

<optional>
Ask if user wants browser preview. If yes, run platform-appropriate command:
- macOS: `open "{{path}}"`
- Linux: `xdg-open "{{path}}"`
- Windows: `start "" "{{path}}"`
</optional>

---

## Quick Reference

<reference title="data-field naming">
| Field | Use For |
|-------|---------|
| `title` | Main heading |
| `subtitle` | Secondary heading |
| `eyebrow` | Category label |
| `body` | Main paragraph |
| `point-1`, `point-2` | List items |
| `quote`, `attribution` | Quoted text |
| `stat-value`, `stat-label` | Statistics |
| `column-1-title` | Column headers |
</reference>

<reference title="data-animatable elements">
| Add to | Skip for |
|--------|----------|
| Headings, text blocks, cards, list items, icons, images, SVG | Decorative elements, container wrappers |
</reference>

<reference title="Common mistakes">
| Mistake | Fix |
|---------|-----|
| Hardcoded colors | Use `var(--color-*)` |
| Missing contenteditable | Check EVERY text element |
| Duplicate data-field | Each must be unique |
| `width=device-width` | Must be `width=1920, height=1080` |
| No auto-save script | Include `saveEdits()` |
</reference>

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Plan file missing | Stop → tell user which `/sb:plan-*` to run |
| Theme file missing | Stop → tell user to run `/sb:setup` |
| No pending slides | Inform all built → suggest `/sb:edit` or `/sb:export` |
| Template unknown | Fall back to custom build |
| Skill output invalid | Fix issues rather than failing |
</reference>

<critical>
Never output a non-compliant slide. If unfixable, explain what's wrong.
</critical>
