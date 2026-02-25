# Animate Workflow - Instructions

```xml
<critical>Read the workflow configuration at {installed_path}/workflow.yaml before executing</critical>
<critical>Follow each step in exact numerical order</critical>

<workflow>

  <step n="1" goal="Mode detection and slide validation">
    <action>Check if the prompt/arguments contain a "Deck: {slug}" context line (provided when invoked from the viewer's Animate with AI button)</action>
    <check if="prompt contains 'Deck: {slug}' line">
      <action>Extract the deck slug from the "Deck:" line and store as {deck_slug}</action>
      <action>Skip the status.yaml deck selection protocol below</action>
    </check>
    <check if="no 'Deck:' context line found (e.g., manual /sb-create:animate invocation)">
      <action>Read .slide-builder/status.yaml to get the deck registry from the `decks` field</action>
      <action>Follow deck selection protocol:
        - If zero decks registered: output "No decks found. Run /sb:plan-deck or /sb:plan-one first." and HALT
        - If one deck registered: auto-select that deck slug
        - If multiple decks registered: present a numbered list and ask the user which deck to animate
      </action>
    </check>
    <action>Store the selected deck as {deck_slug}</action>
    <action>Resolve paths:
      - slide_dir = output/{deck_slug}/slides/
      - manifest_path = output/{deck_slug}/slides/manifest.json
      - plan_path = output/{deck_slug}/plan.yaml
    </action>
    <action>Parse slide_number from command argument (e.g., /sb:animate 6 → slide_number = 6)</action>
    <action>If no slide_number provided, ask: "Which slide number would you like to animate?"</action>
    <action>Read manifest.json from {manifest_path}</action>
    <action>Validate slide_number exists in the manifest slides array (number field must match)</action>
    <action>If slide_number is out of range or not found, show "Slide {N} not found. Valid slides: {list of slide numbers}" and HALT</action>
    <action>Store the slide's manifest entry (title, filename, existing animations) for later use</action>
  </step>

  <step n="2" goal="Load slide context and detect existing animations">
    <action>Read the slide HTML from output/{deck_slug}/slides/slide-{N}.html (COMPLETE file, no offset/limit)</action>
    <action>Read plan.yaml from output/{deck_slug}/plan.yaml (COMPLETE file)</action>
    <action>Find this slide's entry in plan.yaml → slides array where number == {slide_number}</action>
    <action>Extract from the plan entry:
      - template_type: the "template" field (e.g., "process-flow", "comparison", "callout", "title", "agenda", "technical", "section-interstitial", "team-grid", "rocd-initiative-template", "title-hero-image", "custom")
      - agenda_section_id: the "agenda_section_id" field (e.g., "agenda-3")
      - storyline_role: the "storyline_role" field (e.g., "resolution", "opening", "tension")
    </action>
    <action>If agenda_section_id is present, find the matching section in plan.yaml → agenda.sections array and extract:
      - narrative_role: the "narrative_role" field (e.g., "opening", "context", "solution", "evidence", "cta")
    </action>
    <action>Read the slide's existing animations from the manifest entry:
      - Check if the slide's manifest entry has an "animations" field with a "groups" array
    </action>

    <check if="slide already has animations.groups in manifest with at least one group">
      <ask>Slide {N} ("{slide_title}") has {X} existing animation groups:
{For each group: "  Group {order}: {elementIds count} elements ({elementIds list})"}

Would you like to:
- **Replace** — Remove all existing groups and generate fresh animations
- **Modify** — Keep existing groups, identify missing elements, suggest additions
      </ask>
      <action>Store user choice as animation_mode ("replace" or "modify")</action>
    </check>
    <check if="no existing animations or animations.groups is empty">
      <action>Set animation_mode = "fresh"</action>
    </check>
  </step>

  <step n="3" goal="Analyze slide structure and generate animation groups">
    <critical>This is the core intelligence step. Analyze the slide HTML carefully and methodically.</critical>

    <!-- Sub-step 3a: Find all animatable elements -->
    <action>Parse the slide HTML and find ALL elements that have the attribute data-animatable="true"</action>
    <action>For each animatable element, record:
      - tag: the HTML tag name (e.g., div, h1, h2, svg, g, p, span, section)
      - classes: all CSS class names on the element
      - data_field: value of data-field attribute if present
      - data_build_id: value of data-build-id attribute if present (may be absent)
      - id: value of id attribute if present
      - text_content: a brief summary of the element's text content (first 50 chars)
      - position_context: what parent container the element is in
    </action>
    <action>If no animatable elements found, output "No animatable elements found on slide {N}. Add data-animatable='true' attributes to elements you want to animate." and HALT</action>

    <!-- Sub-step 3b: Handle nested animatable elements -->
    <action>Check for nested animatable elements (an element with data-animatable="true" that is a descendant of another element with data-animatable="true"). If found:
      - Keep the PARENT element in the animatable list
      - REMOVE the child element from the animatable list (the parent's animation will include the child)
      - Note: This prevents double-animating nested content
    </action>

    <!-- Sub-step 3c: Classify each element by semantic role -->
    <action>Classify each remaining animatable element into one of these semantic roles using the heuristic signals below:

**HEADER** — Title and heading elements that should appear first:
  - Tag is h1 or h2
  - Has class: section-label, eyebrow, subtitle
  - Has data-field containing: "title", "section-label", "eyebrow", "subtitle"
  - Is the first text element in the slide header area

**CONTENT** — Primary content blocks that form the main body:
  - Has class: card, product-card, step, step-card, loop-step, column, item, box, initiative-card, benefit-card, phase, bullet-item, agenda-item, code-block, stat-card
  - Is a div or section containing substantial content in the main content area
  - Contains lists, paragraphs, or rich content

**CONNECTOR** — Arrows, lines, and connecting elements between content:
  - Tag is svg g or path (within an SVG)
  - Has class: arrow
  - Contains arrow or connector shapes
  - Has data-build-id containing "arrow" or "connector"

**DETAIL** — Supporting information, insights, and secondary content:
  - Has class: insight-card, caption, footnote, key-insight, callout-note, attribution
  - Has data-field containing: "insight", "key-insight", "footnote", "caption"
  - Is positioned at the bottom or side of the slide

**DECORATIVE** — Visual accents and non-informational elements:
  - Has class: accent-bar, shared-core, core-badge, decorative, background-element, dot-pattern
  - Is a purely visual element with no text content
  - Decorative shapes, patterns, or background elements
    </action>

    <!-- Sub-step 3d: Determine template strategy -->
    <action>Based on {template_type} from plan.yaml, select the animation strategy:

**title** — Minimal, dramatic reveal:
  - Group 1: All HEADER elements together (eyebrow + title + subtitle)
  - Group 2: Any DECORATIVE elements (accent bars, background shapes)
  - Maximum 2 groups. Title slides should feel like a single, impactful reveal.

**agenda** — Progressive list reveal:
  - Group 1: HEADER elements (section label + title)
  - Groups 2-N: Each agenda/bullet item as its own group, in document order (top to bottom)
  - Final group: Any DETAIL or DECORATIVE elements
  - Each bullet gets its own build step for pacing.

**process-flow** — Sequential steps with connectors:
  - Group 1: HEADER elements (section label + title)
  - For each step in sequence: group the step element + the CONNECTOR arrow that PRECEDES it
    - Exception: Step 1 (first step) gets its own group without an arrow
    - Arrow grouping: each forward arrow goes WITH the step it points TO
  - Loop-back arrows or return connectors: separate group at the end
  - DETAIL elements (insight cards, footnotes): final group(s)
  - This creates the build: Header → Step 1 → Arrow+Step 2 → Arrow+Step 3 → ... → Details

**comparison** — Column-based reveal:
  - Group 1: HEADER elements (section label + title)
  - Groups 2-N: Each column/card as its own group, left to right
  - Final group: Shared/bottom elements (shared-core, key-insight badges)
  - For 2-column: 3 groups total. For 3-column: 4-5 groups total.

**callout** — Impact-first reveal:
  - Group 1: HEADER elements (headline, section label)
  - Group 2: Primary stat, quote, or callout content (the main impact element)
  - Group 3: Attribution, source, or supporting detail
  - Maximum 3 groups. Callout slides focus on one key message.

**technical** — Code-focused reveal:
  - Group 1: HEADER elements (section label + title)
  - Group 2: Code block or technical content area
  - Group 3: Explanation, annotations, or insight cards
  - Code blocks should appear as a single unit.

**section-interstitial** — Single dramatic reveal:
  - Group 1: ALL elements together as one dramatic reveal
  - Maximum 1 group. Interstitials are meant to hit all at once.
  - Exception: If there are clearly distinct subtitle elements, use 2 groups max.

**team-grid** — Team showcase:
  - Group 1: HEADER elements (section title, team description)
  - Group 2: All team member cards together as a single reveal
  - Maximum 2 groups. Team grids look best with everyone appearing together.

**rocd-initiative-template** — Split-panel initiative:
  - Group 1: HEADER elements (section label, title)
  - Group 2: Left panel content (solution/transformation visual)
  - Group 3: Right panel content (benefits, value propositions)
  - Group 4: Any bottom CTAs or DETAIL elements

**title-hero-image** — Hero image title:
  - Group 1: Title text and branding elements
  - Group 2: Hero image or background visual (if animatable)
  - Maximum 2 groups.

**custom** — Intelligent inference from DOM:
  - When template is "custom", there is no predefined strategy
  - Analyze the DOM structure to infer the best grouping:
    1. HEADER elements first
    2. Group major content sections by their visual containers
    3. Aim for 3-7 groups for typical content density
    4. DETAIL and DECORATIVE elements last
    </action>

    <!-- Sub-step 3e: Apply narrative role enhancement -->
    <action>If {narrative_role} is available from the agenda section, adjust the grouping:

**opening** — Dramatic, fewer groups:
  - Prefer larger groups with more elements each
  - Collapse CONTENT items into fewer groups (e.g., 2 cards in one group instead of 2 separate)
  - Goal: 2-3 build steps maximum for dramatic impact

**context** — Standard pacing:
  - Use the template strategy as-is, no modification
  - Normal number of groups

**problem** — Build tension with granularity:
  - Break CONTENT into more individual groups
  - Each data point, statistic, or evidence item gets its own group
  - Goal: more build steps to create anticipation

**solution** — Progressive reveal:
  - Reveal solution components step-by-step
  - Each component builds on the previous
  - Moderate number of groups (template default is usually right)

**evidence** — Sequential data presentation:
  - Each piece of evidence, case study, or data point in its own group
  - Present sequentially to build a cumulative argument
  - More groups than default

**cta** — Impact-last ordering:
  - Build all supporting context first
  - The CTA/action element should be in the LAST group
  - Reorder if needed so the call-to-action reveals last
    </action>

    <!-- Sub-step 3f: Generate the animation groups -->
    <action>Combine the classified elements into ordered animation groups:
      1. Start with HEADER group(s)
      2. Add CONTENT groups following the template strategy ordering
      3. CONNECTOR elements placed per template strategy (with the content they introduce, or separately)
      4. DETAIL elements in penultimate group(s)
      5. DECORATIVE elements in final group (or merged with DETAIL)
      6. Apply narrative role adjustments to consolidate or split groups
    </action>

    <action>Assign group metadata:
      - id: "group-1", "group-2", etc. (sequential)
      - order: 1, 2, 3, etc. (matches id numbering)
      - elementIds: array of data-build-id values for elements in this group
        - For elements WITHOUT data-build-id: plan a new ID using convention: build-{semantic-role}-{counter}
          Examples: build-header-1, build-header-2, build-card-1, build-card-2, build-arrow-1, build-step-1, build-detail-1, build-accent-1
        - For elements WITH existing data-build-id: use the existing ID
      - colorIndex: cycle 0, 1, 2, 3, 4, 0, 1, 2, ... (5-color palette matching builder UI)
    </action>

    <action>Create a human-readable description for each group:
      - "Header (section label + title)"
      - "Step 1 — Claude Responds"
      - "Arrow 1 + Step 2 — Tool Call"
      - "Insight cards"
      - etc.
    </action>

    <check if="animation_mode == 'modify'">
      <action>Compare the proposed groups against existing groups in the manifest</action>
      <action>Identify animatable elements that have data-animatable="true" but are NOT in any existing group</action>
      <action>For each ungrouped element, suggest:
        - Adding it to an existing group (if semantically related)
        - Creating a new group for it
      </action>
      <action>Present BOTH the current group structure AND the proposed modifications side by side</action>
    </check>
  </step>

  <step n="4" goal="Present animation plan to user for approval">
    <output>
**Slide {N}: "{slide_title}" ({template_type} template)**
{If narrative_role: "Narrative role: {narrative_role}"}
Found {element_count} animatable elements.

**Proposed animation sequence:**
{For each group:
  "  Group {order}: {description}
    Elements: {elementIds list}
    Color: {color name for colorIndex}"}

{If animation_mode == "modify":
  "**Existing groups retained:** {existing_group_count}
  **New additions:** {new_elements_description}"}

    </output>
    <ask>Apply these animations? (yes / edit / cancel)</ask>

    <check if="user says edit">
      <action>Ask user what changes they want to the grouping (e.g., "merge groups 2 and 3", "move element X to group Y", "add a new group for...")</action>
      <action>Adjust groups accordingly</action>
      <action>Re-present the plan with updated groups</action>
      <ask>Apply these updated animations? (yes / edit / cancel)</ask>
    </check>
    <check if="user says cancel">
      <action>Output "Animation generation cancelled. No changes made." and HALT</action>
    </check>
  </step>

  <step n="5" goal="Apply animations to slide HTML and manifest">
    <critical>Elements use data-build-id attribute (NOT id). All three viewers find elements via querySelector('[data-build-id="..."]') — never getElementById(). See build-one/instructions.md Viewer DOM Contract for full specification.</critical>

    <!-- Sub-step 5a: Assign build IDs to slide HTML -->
    <action>For each animatable element that does NOT already have a data-build-id attribute:
      - Add data-build-id="{planned_id}" to the element's opening tag
      - Use the build ID planned in Step 3 (build-{semantic-role}-{counter})
      - DO NOT modify elements that already have data-build-id (preserve existing IDs)
    </action>
    <action>Write the modified slide HTML back to output/{deck_slug}/slides/slide-{N}.html</action>
    <action>Verify the write was successful by reading back the first few lines</action>

    <!-- Sub-step 5b: Update manifest.json -->
    <action>Read manifest.json from output/{deck_slug}/slides/manifest.json</action>
    <action>Find the target slide entry in the "slides" array where number == {slide_number}</action>
    <action>Set or update the "animations" field on the slide entry:
      {
        "groups": [
          { "id": "group-1", "order": 1, "elementIds": ["build-header-1", "build-header-2"], "colorIndex": 0 },
          { "id": "group-2", "order": 2, "elementIds": ["build-step-1"], "colorIndex": 1 },
          ...
        ]
      }
    </action>
    <check if="animation_mode == 'modify'">
      <action>Merge new groups with existing groups:
        - Keep all existing groups with their current IDs and orders
        - Append new groups after the last existing group
        - Renumber orders to be sequential
        - Add new elements to existing groups where specified
      </action>
    </check>
    <check if="animation_mode == 'replace' or animation_mode == 'fresh'">
      <action>Replace the entire animations.groups array with the newly generated groups</action>
    </check>
    <action>Write updated manifest.json back, preserving all other slide entries and top-level manifest fields</action>

    <!-- Sub-step 5c: Regenerate viewer -->
    <action>Run viewer regeneration: node scripts/regenerate-viewer.js {deck_slug}</action>
    <action>Verify the command completed successfully (exit code 0)</action>

    <!-- Sub-step 5d: Update status.yaml -->
    <action>Read .slide-builder/status.yaml</action>
    <action>Add a history entry:
      - action: "Generated {group_count}-group animation for slide {slide_number} ({slide_title})"
      - deck: {deck_slug}
      - timestamp: current ISO timestamp
    </action>
    <action>Write updated status.yaml</action>
  </step>

  <step n="6" goal="Review and report">
    <action>Open browser to deck viewer: open output/{deck_slug}/index.html</action>

    <output>
Applied {group_count} animation groups to slide {slide_number} ("{slide_title}").
Viewer regenerated and opening in browser.

**Animation summary:**
{For each group: "  Group {order}: {description} ({elementIds count} elements)"}

**Next steps:**
- Navigate to slide {slide_number} in the viewer
- Press **F** for fullscreen, then **→** to step through builds
- Click **Build** button to enter builder mode for manual adjustments
- Run `/sb:animate` on another slide to generate more animations
    </output>
  </step>

</workflow>
```
