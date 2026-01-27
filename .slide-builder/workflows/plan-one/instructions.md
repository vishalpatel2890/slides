# Plan One Workflow Instructions

This workflow captures intent for a single slide through a 5-phase process.

```xml
<critical>This workflow creates .slide-builder/single/plan.yaml</critical>
<critical>Requires theme.json to exist before proceeding</critical>
<critical>Updates status.yaml with mode: "single" upon completion</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: Theme Verification                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Verify theme exists">
    <action>Check if .slide-builder/theme.json exists</action>

    <check if="theme.json does not exist">
      <output>
**Theme Required**

No theme found. You need a brand theme before creating slides.

Run `/sb:setup` to create your theme from brand assets.
      </output>
      <action>HALT - Cannot proceed without theme</action>
    </check>

    <check if="theme.json exists">
      <action>Load theme.json to understand available design primitives</action>
      <action>Note the theme personality ({{theme.personality.classification}})</action>
      <output>
**Theme Verified**

Found theme: {{theme.meta.name}}
Personality: {{theme.personality.classification}}
      </output>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 2: Intent Capture                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="2" goal="Capture slide intent">
    <ask>
**Single Slide Planning**

Describe the slide you need. Be specific about:
- What the slide should show (diagram, list, comparison, etc.)
- Key points or content to include
- Context (where will this slide be used?)

Examples:
- "An architecture diagram showing our 3-tier system with frontend, API, and database layers"
- "A bullet list of our 5 key differentiators for the sales pitch"
- "A comparison slide showing before/after implementation results"

What slide do you need?
    </ask>

    <action>Store user's description as {{user_intent}}</action>
    <action>Parse description to extract:
      - slide_purpose: What is the main goal of this slide?
      - content_type: What kind of content (diagram, list, comparison, flow, etc.)?
      - key_elements: What specific items/points should be included?
      - visual_guidance: Any visual preferences mentioned?
      - audience_context: Who will see this slide and where?
    </action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 3: Template Matching                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Match intent to template">
    <action>Scan {{user_intent}} for template-matching keywords (case-insensitive)</action>

    <template-matching-rules>
      <!-- Priority order: first match wins -->
      <rule keywords="title, intro, opening, welcome, cover" template="layout-title">
        Title/intro slides with hero text and subtitle
      </rule>
      <rule keywords="list, bullets, points, agenda, items, features" template="layout-list">
        Bulleted list or numbered agenda items
      </rule>
      <rule keywords="flow, process, timeline, steps, sequence, pipeline, workflow" template="layout-flow">
        Process flows, timelines, step sequences
      </rule>
      <rule keywords="compare, vs, versus, two, side-by-side, before, after, pros, cons" template="layout-columns-2">
        Two-column comparisons
      </rule>
      <rule keywords="three, triad, options, pillars, trio" template="layout-columns-3">
        Three-column layouts
      </rule>
      <rule keywords="key, insight, callout, cta, highlight, quote, stat, metric" template="layout-callout">
        Single key insight or call-to-action
      </rule>
      <rule keywords="code, technical, api, snippet, demo, terminal" template="layout-code">
        Technical/code-focused slides
      </rule>
    </template-matching-rules>

    <action>If keyword match found → set {{suggested_template}} to matched template name</action>
    <action>If no keyword match → set {{suggested_template}} to "custom"</action>
    <action>Log the decision reasoning</action>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4: Confirmation                                                    -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4" goal="Confirm understanding with user">
    <output>
**Slide Intent Captured**

I understand you need:
- **Purpose**: {{slide_purpose}}
- **Content type**: {{content_type}}
- **Suggested layout**: {{suggested_template}}

**Key elements to include:**
{{key_elements_formatted_list}}

**Visual approach**: {{visual_guidance_or_default}}
    </output>

    <ask>
Is this correct? (yes to proceed, or provide corrections)
    </ask>

    <check if="user says no or provides corrections">
      <action>Incorporate feedback into the parsed intent</action>
      <goto step="3">Re-match template with updated intent</goto>
    </check>

    <check if="user says yes or confirms">
      <action>Proceed to save</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5: State Persistence                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Save plan and update status">
    <action>Create .slide-builder/single/ directory if it doesn't exist</action>

    <action>Save plan.yaml to .slide-builder/single/plan.yaml with schema:
      ```yaml
      # Slide Metadata
      created: {{current_iso_timestamp}}
      last_modified: {{current_iso_timestamp}}

      # Core Intent
      intent: "{{user_intent}}"
      suggested_template: "{{suggested_template}}"

      # Audience Context (optional - include if mentioned)
      audience: "{{audience_if_mentioned}}"
      audience_knowledge_level: "{{knowledge_level_if_mentioned}}"  # beginner | intermediate | expert
      context: "{{slide_context_if_mentioned}}"

      # Content Details
      key_points:
        {{key_elements_as_yaml_list}}
      visual_guidance: "{{visual_guidance_or_default}}"
      tone: "{{tone_based_on_theme}}"  # professional | bold | warm | technical

      # Technical Details (if applicable)
      technical_depth: "{{depth_if_technical}}"  # none | overview | detailed | deep-dive
      include_elements:
        {{include_elements_if_specified}}
      exclude_elements:
        {{exclude_elements_if_specified}}
      ```
    </action>

    <action>Update .slide-builder/status.yaml:
      - Set mode: "single"
      - Set current_slide: 1
      - Set total_slides: 1
      - Set last_action: "Single slide planned"
      - Set last_modified: {{current_iso_timestamp}}
      - Append to history array: { action: "Single slide planned", timestamp: {{current_iso_timestamp}} }
    </action>

    <output>
**Plan Saved**

Your slide plan is ready at `.slide-builder/single/plan.yaml`

**Summary:**
- Template: {{suggested_template}}
- Mode: single slide

**Next step:** Run `/sb:build-one` to generate your slide.
    </output>
  </step>

</workflow>
```

## Template Reference

Available templates and their use cases:

| Template | Keywords | Best For |
|----------|----------|----------|
| layout-title | title, intro, opening, welcome, cover | Opening/title slides with hero text |
| layout-list | list, bullets, points, agenda, items, features | Bulleted content, agendas |
| layout-flow | flow, process, timeline, steps, sequence | Workflows, timelines, sequences |
| layout-columns-2 | compare, vs, two, side-by-side, before/after | Two-way comparisons |
| layout-columns-3 | three, triad, options, pillars | Three-column content |
| layout-callout | key, insight, callout, cta, highlight, quote | Key insights, stats, CTAs |
| layout-code | code, technical, api, snippet, demo | Technical/code content |
| custom | (no keywords match) | Novel layouts via frontend-design skill |
