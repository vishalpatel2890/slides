# Plan One Workflow Instructions

This workflow captures intent for a single slide through a 5-phase process.

```xml
<critical>This workflow creates output/singles/plan.yaml</critical>
<critical>Requires theme.json to exist before proceeding</critical>
<critical>Updates status.yaml with mode: "single" upon completion</critical>

<workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 1: Theme Verification                                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="1" goal="Verify theme exists">
    <action>Check if .slide-builder/config/theme.json exists</action>

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
  <!-- PHASE 3: Template Matching (Catalog-Driven)                              -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="3" goal="Match intent to template using catalog">
    <critical>Template matching is now catalog-driven. Read catalog.json first.</critical>

    <action>Read `.slide-builder/config/catalog/catalog.json`</action>
    <action>Parse the `templates` array to get available templates</action>

    <action>Display available templates from catalog:
      ```
      **Available Templates:**
      {{for each template in catalog.templates}}
      - **{{template.name}}** ({{template.id}}): {{template.description}}
        Keywords: {{template.use_cases.join(", ")}}
      {{end for}}
      - **custom**: Generate a unique layout for novel content
      ```
    </action>

    <action>Scan {{user_intent}} for template matching using catalog use_cases:
      1. For each template in catalog.templates:
         - Check if any word in {{user_intent}} matches template.use_cases (case-insensitive)
         - Calculate match score (number of matching keywords)
      2. Select template with highest match score
      3. If no matches found → set suggested_template to "custom"
    </action>

    <template-matching-algorithm>
      ```
      matchTemplate(userIntent, catalog):
        bestMatch = null
        bestScore = 0

        for template in catalog.templates:
          score = countMatches(userIntent.words, template.use_cases)
          if score > bestScore:
            bestMatch = template.id
            bestScore = score

        if bestMatch:
          return { template: bestMatch, confidence: "high" if bestScore > 1 else "low" }
        else:
          return { template: "custom", confidence: "fallback" }
      ```
    </template-matching-algorithm>

    <action>If catalog match found → set {{suggested_template}} to matched template.id</action>
    <action>If no catalog match → set {{suggested_template}} to "custom"</action>
    <action>Log the decision reasoning with template name and description</action>
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
      <action>Proceed to optional discovery</action>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 4.5: Optional Quick Discovery (Story 13.4)                         -->
  <!-- Lighter version of plan-deck's discovery - just message framing          -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="4.5" goal="Optional message discovery for enhanced slide generation">
    <critical>This step is optional - user can skip for faster workflow</critical>

    <action>Initialize discovery object: {{discovery}} = null</action>

    <ask>
**Quick Discovery (Optional)**

Would you like to refine the message approach for better slide generation?

- **[y]es** - Choose a message framing style (adds ~30 seconds)
- **[n]o** - Skip and proceed directly to build

This helps generate more targeted content but is not required.
    </ask>

    <check if="user chooses yes (y, yes, Y, Yes)">
      <action>Use AskUserQuestion tool to present framing options:

        {
          "questions": [{
            "question": "What message approach works best for this slide?",
            "header": "Message",
            "options": [
              {"label": "Direct", "description": "Clear statement of the value or main point"},
              {"label": "Question", "description": "Engage with a thought-provoking question"},
              {"label": "Story", "description": "Narrative approach with context and resolution"},
              {"label": "Data", "description": "Lead with evidence, statistics, or proof"}
            ],
            "multiSelect": false
          }]
        }

        Note: User can select "Other" to provide custom framing approach.
      </action>

      <action>Wait for user response from AskUserQuestion</action>

      <check if="user selected one of the provided options (Direct, Question, Story, Data)">
        <action>Map selection to framing:
          - "Direct" → key_message_framing = "direct"
          - "Question" → key_message_framing = "question"
          - "Story" → key_message_framing = "story"
          - "Data" → key_message_framing = "data"
        </action>
        <action>Generate a contextual key message based on the framing and intent:
          - For "direct": Create a clear statement from slide_purpose
          - For "question": Formulate a thought-provoking question from intent
          - For "story": Create narrative setup from context
          - For "data": Frame as data-driven claim from key_elements
        </action>
        <action>Set {{discovery}} = {
          key_message: "{{generated_key_message}}",
          key_message_framing: "{{key_message_framing}}"
        }</action>
      </check>

      <check if="user selected 'Other' and provided custom text">
        <action>Set {{discovery}} = {
          key_message: "{{user_custom_text}}",
          key_message_framing: "custom"
        }</action>
      </check>

      <output>
✓ Message framing set: {{discovery.key_message_framing}}
"{{discovery.key_message}}"

Proceeding to save plan...
      </output>
    </check>

    <check if="user chooses no (n, no, N, No, skip, Skip)">
      <action>Set {{discovery}} = null</action>
      <output>
Skipping discovery. Proceeding to save plan...
      </output>
    </check>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- PHASE 5: State Persistence                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <step n="5" goal="Save plan and update status">
    <action>Create output/singles/ directory if it doesn't exist</action>

    <action>Save plan.yaml to output/singles/plan.yaml with schema:
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

      # Discovery (Story 13.4 - optional, from Phase 4.5)
      # Included only if user engaged with quick discovery
      {{if discovery is not null}}
      discovery:
        key_message: "{{discovery.key_message}}"
        key_message_framing: "{{discovery.key_message_framing}}"
      {{end if}}

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

    <!-- Generate slug for preview of output location -->
    <slug-generation>
      <action>Generate slug from intent (first 30 chars):
        1. Convert to lowercase
        2. Replace spaces with hyphens
        3. Remove special characters (keep only a-z, 0-9, hyphens)
        4. Truncate to 30 characters
        5. Remove trailing hyphens
      </action>
      <action>Set {{slide_slug}} = generated slug</action>
    </slug-generation>

    <output>
**Plan Saved**

Your slide plan is ready at `output/singles/plan.yaml`

**Summary:**
- Template: {{suggested_template}}
- Mode: single slide
- Output will be: `output/singles/{{slide_slug}}.html`

**Next step:** Run `/sb:build-one` to generate your slide.
    </output>
  </step>

</workflow>
```

## Template Reference (Catalog-Driven)

Templates are now loaded dynamically from `.slide-builder/config/catalog/catalog.json`.

Each template entry includes:
- **id**: Template identifier used in plan.yaml
- **name**: Human-readable name
- **description**: What the template is best for
- **use_cases**: Keywords for automatic matching

The `custom` option is always available for novel layouts that don't match any catalog template. Custom slides are generated via the frontend-design skill.

**Note:** Run `/sb:theme` to see current available templates with their descriptions.
