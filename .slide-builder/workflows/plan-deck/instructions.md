# Plan Deck Workflow Instructions

Version 2.0 - Implements Story 5.1 acceptance criteria for deck planning initiation.

```xml
<critical>This workflow creates output/{deck_slug}/plan.yaml with rich narrative context</critical>
<critical>Requires theme.json to exist (AC5.1.9)</critical>
<critical>Prompts must be sequential: purpose, audience, key points, length (AC5.1.1-4)</critical>
<critical>Narrative must include storyline structure (AC5.1.5)</critical>
<critical>Each slide must show number, intent, template, storyline_role (AC5.1.6)</critical>

<workflow>

  <step n="1" goal="Verify prerequisites">
    <action>Check if .slide-builder/config/theme.json exists</action>

    <check if="theme.json does not exist">
      <output>
**Theme Required**

You need a brand theme before planning a deck.

Run `/sb:setup` to create your theme from brand assets.
      </output>
      <action>HALT</action>
    </check>

    <action>Read status.yaml to check if current_deck_slug is set</action>
    <action>If current_deck_slug exists, check if output/{current_deck_slug}/plan.yaml exists</action>

    <check if="existing deck plan found">
      <output>
**Existing Deck Plan Found**

A deck plan already exists at `output/{{current_deck_slug}}/plan.yaml`.

What would you like to do?
- **[c]ontinue** - Resume editing the existing plan
- **[n]ew** - Start fresh with a new deck (existing deck is preserved)
- **[l]ist** - List all existing decks
      </output>
      <ask>Your choice (c/n/l):</ask>

      <check if="user chooses continue">
        <action>Load existing plan.yaml from output/{current_deck_slug}/</action>
        <goto step="4">Plan modification</goto>
      </check>

      <check if="user chooses list">
        <action>Scan output/ directory for folders containing plan.yaml</action>
        <output>
**Existing Decks:**
{{for each deck folder with plan.yaml}}
- {{deck_slug}}: {{deck_name from plan.yaml}}
{{end for}}
        </output>
        <ask>Enter deck slug to edit, or "new" for a new deck:</ask>
        <check if="user enters existing deck slug">
          <action>Set current_deck_slug = user's choice</action>
          <action>Load plan.yaml from output/{current_deck_slug}/</action>
          <goto step="4">Plan modification</goto>
        </check>
        <check if="user enters 'new'">
          <action>Continue with fresh planning</action>
        </check>
      </check>

      <check if="user chooses new">
        <action>Continue with fresh planning (existing decks preserved)</action>
      </check>
    </check>
  </step>

  <step n="2" goal="Collect presentation context sequentially">
    <critical>Each prompt must be asked separately and wait for response (AC5.1.1-4)</critical>

    <!-- Step 2.1: Purpose (AC5.1.1) -->
    <ask>
**Step 1 of 4: Presentation Purpose**

What is the goal of this presentation? What outcome do you want?

Examples:
- "Partnership pitch to close Q4 deal"
- "Product demo for technical evaluation"
- "Quarterly business review for executives"
- "Training session for new team members"

**Your presentation purpose:**
    </ask>
    <action>Store response as {{purpose}}</action>
    <action>Extract deck_name from purpose if not explicitly provided</action>

    <!-- Step 2.2: Audience (AC5.1.2) -->
    <ask>
**Step 2 of 4: Target Audience**

Who will be viewing this presentation? What's their knowledge level?

Examples:
- "Technical decision makers - expert level"
- "C-suite executives - high-level overview"
- "Engineering team - deep technical detail"
- "New customers - beginner level"

**Your audience:**
    </ask>
    <action>Store response as {{audience}}</action>
    <action>Infer audience_knowledge_level: beginner | intermediate | expert</action>

    <!-- Step 2.3: Key Points (AC5.1.3) -->
    <ask>
**Step 3 of 4: Key Points to Convey**

What are the main points you want the audience to remember?
List 3-5 key messages (one per line or comma-separated).

Examples:
- ROI and cost savings
- Time-to-value
- Risk mitigation
- Competitive advantage

**Your key points:**
    </ask>
    <action>Store response as {{key_points}} array</action>
    <action>Extract audience_priorities from key points</action>

    <!-- Step 2.4: Length (AC5.1.4) -->
    <ask>
**Step 4 of 4: Deck Length (Optional)**

How many slides do you want? Press Enter to accept the default (6-10 slides).

Recommendations:
- 5-7 slides: Quick pitch or update
- 8-10 slides: Standard presentation
- 12-15 slides: Comprehensive deep-dive

**Desired slide count (default: 6-10):**
    </ask>
    <action>If empty, set {{desired_length}} = "6-10"</action>
    <action>Parse response to get min and max slide counts</action>
  </step>

  <step n="2.5" goal="Generate and refine agenda structure">
    <critical>This step proposes high-level agenda sections BEFORE generating individual slides</critical>
    <critical>AskUserQuestion tool has 4-option limit per question - split into multiple calls if needed</critical>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- AGENDA PROPOSAL LOGIC                                                -->
    <!-- Analyze collected context to propose 4-8 narrative sections          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Analyze {{purpose}}, {{audience}}, {{key_points}}, and {{desired_length}} to determine appropriate agenda structure</action>

    <action>Generate 4-8 proposed agenda sections where each section has:
      - id: unique identifier (agenda-1, agenda-2, etc.)
      - title: section name (e.g., "Opening Hook", "The Problem", "Our Solution", "Results")
      - narrative_role: one of: opening | context | problem | solution | evidence | cta
      - estimated_slides: 1-3 slides per section (based on complexity)
      - description: 1-sentence purpose description

      Use these heuristics based on purpose keywords:
      - "pitch" / "proposal" / "sell" → Opening Hook, Problem, Solution, Proof, CTA
      - "demo" / "walkthrough" → Overview, Key Features, Demo Flow, Technical Details, Next Steps
      - "update" / "review" / "status" → Context, Progress, Results, Challenges, Next Steps
      - "training" / "onboarding" → Introduction, Concepts, Examples, Practice, Resources
      - Default fallback → Opening, Context, Main Content, Evidence, Conclusion
    </action>

    <action>Store generated sections as {{proposed_agenda}} array</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION SELECTION VIA AskUserQuestion                                -->
    <!-- Present sections in groups of 4 (tool limit) with multiSelect: true  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <output>
**Proposed Agenda Structure**

Based on your presentation purpose and audience, here's a suggested narrative structure:

{{for each section in proposed_agenda}}
**{{section.id}}:** {{section.title}} ({{section.narrative_role}})
- {{section.description}}
- Estimated slides: {{section.estimated_slides}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <action>Present agenda sections for selection using AskUserQuestion tool:
      - Use multiSelect: true to allow selecting multiple sections
      - Split into multiple questions if more than 4 sections (tool limit)
      - For each option: label = section.title, description = section.description
      - User can always add custom sections via "Other" option

      Example tool call structure:
      {
        "questions": [{
          "question": "Which agenda sections should we include? (Select all that apply)",
          "header": "Agenda",
          "options": [
            {"label": "{{section_1.title}}", "description": "{{section_1.description}}"},
            {"label": "{{section_2.title}}", "description": "{{section_2.description}}"},
            {"label": "{{section_3.title}}", "description": "{{section_3.description}}"},
            {"label": "{{section_4.title}}", "description": "{{section_4.description}}"}
          ],
          "multiSelect": true
        }]
      }

      If more than 4 sections proposed, use second question for remaining sections:
      {
        "questions": [{
          "question": "Any additional sections to include?",
          "header": "More",
          "options": [
            {"label": "{{section_5.title}}", "description": "{{section_5.description}}"},
            ...
          ],
          "multiSelect": true
        }]
      }
    </action>

    <action>Wait for user response from AskUserQuestion</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- HANDLE CUSTOM SECTIONS VIA "Other"                                   -->
    <!-- Parse custom input into proper section structure                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <check if="user provided custom input via 'Other' option">
      <action>Parse custom section text to extract:
        - title: Use the provided text as the section title
        - Generate unique id: agenda-N where N is next available number
        - Infer narrative_role based on keywords:
          * "intro" / "hook" / "opening" → opening
          * "background" / "context" / "situation" → context
          * "problem" / "challenge" / "pain" → problem
          * "solution" / "approach" / "how" → solution
          * "results" / "proof" / "data" / "case" → evidence
          * "next" / "action" / "call" → cta
          * Default: evidence
        - Set estimated_slides: 2 (default for custom sections)
        - Generate description: "Custom section covering {{title}}"
      </action>
      <action>Add custom section to selected sections list</action>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MINIMUM SECTIONS VALIDATION                                          -->
    <!-- Warn if fewer than 3 sections - presentation may be too brief        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Count total selected sections (including any custom sections)</action>

    <check if="fewer than 3 sections selected">
      <output>
**⚠️ Warning: Minimal Agenda**

You've selected only {{selected_count}} section(s). A presentation with fewer than 3 sections may feel too brief or lack narrative depth.

**Recommendations:**
- Most effective presentations have 4-6 sections
- Consider adding context or evidence sections
- At minimum, include: Opening, Core Content, and Conclusion/CTA
      </output>

      <ask>
Would you like to:
- **[a]dd** more sections (return to selection)
- **[p]roceed** anyway with {{selected_count}} section(s)
      </ask>

      <check if="user chooses to add more sections">
        <goto step="2.5">Return to section selection</goto>
      </check>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- STORE CONFIRMED AGENDA                                               -->
    <!-- Save selected sections for use in narrative generation (Step 3)      -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Store confirmed sections as {{agenda_sections}} array with full structure:
      - Each section includes: id, title, narrative_role, estimated_slides, description
      - Preserve selection order as presentation order
      - This variable is available for Phase 2 discovery (Story 13.2)
    </action>

    <output>
**Agenda Confirmed**

Your presentation will follow this structure:

{{for each section in agenda_sections}}
{{loop_index}}. **{{section.title}}** ({{section.narrative_role}}) - ~{{section.estimated_slides}} slide(s)
{{end for}}

Total estimated slides: {{sum of estimated_slides}}

Proceeding to generate detailed slide breakdown...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- STEP 2.6: SECTION MESSAGE DISCOVERY (Story 13.2)                         -->
  <!-- Deep discovery loop: For each agenda section, discover key message       -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->

  <step n="2.6" goal="Deep discovery for each agenda section" for-each="section in agenda_sections">
    <critical>Use AskUserQuestion with multiSelect: false (single-select) for message framings</critical>
    <critical>Store selection in section.discovery.key_message</critical>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION HEADER - Show progress through sections                      -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Section Discovery: {{section.title}}** ({{loop_index}} of {{total_sections}})
Role: {{section.narrative_role}} | Estimated slides: {{section.estimated_slides}}

{{section.description}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- INITIALIZE DISCOVERY OBJECT                                          -->
    <!-- Create discovery object to store message selection                   -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Initialize {{section.discovery}} = {} if not already present</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- GENERATE MESSAGE FRAMING OPTIONS                                     -->
    <!-- Options are contextual to section.narrative_role                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Generate 4 message framing options based on {{section.narrative_role}}:

      For narrative_role = "opening":
        - Direct: Provocative statement about audience's current situation
        - Question: "What if {{desirable_outcome}}?"
        - Story: "{{time_reference}}, {{relatable_scenario}}..."
        - Data: "{{surprising_statistic}} of {{audience_group}} {{situation}}"

      For narrative_role = "context":
        - Direct: Scene-setting statement about current landscape
        - Question: "What's driving this change in {{industry/domain}}?"
        - Story: "Here's where we stand today..."
        - Data: "{{market_data}} shows {{trend}}"

      For narrative_role = "problem":
        - Direct: "{{pain_point}} is costing you {{consequence}}"
        - Question: "Why do {{audience_group}} struggle with {{challenge}}?"
        - Story: "Meet {{persona}}, who faces {{challenge}} every day"
        - Data: "{{statistic}} shows the impact of {{problem}}"

      For narrative_role = "solution":
        - Direct: "{{solution}} delivers {{key_benefit}}"
        - Question: "What would {{desirable_outcome}} mean for your team?"
        - Story: "Here's how {{customer}} achieved {{result}}"
        - Data: "{{solution}} reduces {{metric}} by {{percentage}}"

      For narrative_role = "evidence":
        - Direct: "The results speak for themselves"
        - Question: "How do we know this works?"
        - Story: "{{customer_name}}'s transformation"
        - Data: "{{metric_improvement}} across {{number}} implementations"

      For narrative_role = "cta":
        - Direct: "Let's start with {{specific_next_step}}"
        - Question: "Ready to {{action}}?"
        - Story: "Join {{number}} teams who have already {{action}}"
        - Data: "{{time_to_value}} to see first results"

      Replace template variables with contextual content from:
      - {{purpose}} - presentation purpose
      - {{audience}} - target audience
      - {{key_points}} - key messages to convey
      - {{section.title}} - current section title
      - {{section.description}} - section description
    </action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ASK USER TO SELECT MESSAGE FRAMING                                   -->
    <!-- Uses AskUserQuestion tool with single-select (multiSelect: false)    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Use AskUserQuestion tool to present message options:

      {
        "questions": [{
          "question": "Which message framing resonates best for '{{section.title}}'?",
          "header": "Message",
          "options": [
            {"label": "Direct", "description": "{{generated_direct_framing}}"},
            {"label": "Question", "description": "{{generated_question_framing}}"},
            {"label": "Story", "description": "{{generated_story_framing}}"},
            {"label": "Data", "description": "{{generated_data_framing}}"}
          ],
          "multiSelect": false
        }]
      }

      Note: User can always select "Other" to provide custom message framing.
    </action>

    <action>Wait for user response from AskUserQuestion</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- HANDLE USER SELECTION                                                -->
    <!-- Store selection or custom input in discovery.key_message             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <check if="user selected one of the provided options (Direct, Question, Story, Data)">
      <action>Get the description text from the selected option</action>
      <action>Store in {{section.discovery.key_message}} = selected description text</action>
    </check>

    <check if="user selected 'Other' and provided custom text">
      <action>Store user's custom text exactly as entered</action>
      <action>Set {{section.discovery.key_message}} = custom text</action>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- CONFIRM SELECTION                                                    -->
    <!-- Show what was stored for this section                                -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <output>
✓ **{{section.title}}** key message set:
"{{section.discovery.key_message}}"

    </output>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- OPTIONAL DEEP DISCOVERY (Story 13.3)                                -->
    <!-- Single multi-select to choose which discovery areas to explore       -->
    <!-- Only opens discovery for selected items - reduces friction           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Initialize discovery defaults:
      {{section.discovery.diagram_requirements}} = null
      {{section.discovery.visual_metaphor}} = null
      {{section.discovery.research_findings}} = []
    </action>

    <action>Use AskUserQuestion tool to ask which discovery areas to explore:

      {
        "questions": [{
          "question": "Want to define specific visual/content guidance for '{{section.title}}'? (Optional - skip to auto-generate)",
          "header": "Discovery",
          "options": [
            {"label": "Diagram Style", "description": "Specify diagram types like flowchart, timeline, comparison, hierarchy"},
            {"label": "Visual Metaphor", "description": "Guide imagery theme like journey, growth, transformation, building"},
            {"label": "Deep Research", "description": "Search for statistics, quotes, case studies to include"}
          ],
          "multiSelect": true
        }]
      }

      Note: User can select none to skip all optional discovery and proceed quickly.
    </action>

    <action>Wait for user response from AskUserQuestion</action>

    <action>Store selected discovery areas in {{selected_discovery_areas}} array</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- DIAGRAM STYLE DISCOVERY (only if selected)                          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <check if="'Diagram Style' in selected_discovery_areas">
      <action>Use AskUserQuestion tool to present diagram type options:

        {
          "questions": [{
            "question": "What diagram style works best for '{{section.title}}'?",
            "header": "Diagrams",
            "options": [
              {"label": "Flowchart", "description": "Process flow, steps, decision points"},
              {"label": "Comparison", "description": "Side-by-side, before/after, vs layout"},
              {"label": "Timeline", "description": "Chronological sequence, phases, milestones"},
              {"label": "Hierarchy", "description": "Org chart, tree structure, nested items"}
            ],
            "multiSelect": true
          }]
        }
      </action>

      <action>Wait for user response from AskUserQuestion</action>

      <check if="user selected diagram options or provided 'Other' text">
        <action>Store selections in {{section.discovery.diagram_requirements}} array</action>
      </check>

      <output>
✓ Diagram style: {{section.discovery.diagram_requirements | join(", ") | default("None specified")}}
      </output>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- VISUAL METAPHOR DISCOVERY (only if selected)                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <check if="'Visual Metaphor' in selected_discovery_areas">
      <action>Use AskUserQuestion tool to present visual metaphor options:

        {
          "questions": [{
            "question": "What visual metaphor or imagery theme for '{{section.title}}'?",
            "header": "Visuals",
            "options": [
              {"label": "Journey", "description": "Path, roadmap, progression toward destination"},
              {"label": "Growth", "description": "Seeds, trees, upward arrows, expansion"},
              {"label": "Transformation", "description": "Before/after, metamorphosis, evolution"},
              {"label": "Technology", "description": "Modern, digital, abstract tech imagery"}
            ],
            "multiSelect": true
          }]
        }
      </action>

      <action>Wait for user response from AskUserQuestion</action>

      <check if="user selected metaphor options or provided 'Other' text">
        <action>Store selections in {{section.discovery.visual_metaphor}} array</action>
      </check>

      <output>
✓ Visual metaphor: {{section.discovery.visual_metaphor | join(", ") | default("None specified")}}
      </output>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- DEEP RESEARCH DISCOVERY (only if selected)                          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <check if="'Deep Research' in selected_discovery_areas">
      <action>Construct search queries based on section context:
        - Query 1: "{{section.title}} statistics data {{purpose_keywords}}"
        - Query 2: "{{section.title}} case study examples results"
      </action>

      <action>Use WebSearch tool to find relevant supporting data</action>

      <action>Parse search results and extract top 3-4 most relevant findings:
        - For each finding, extract: source URL, key content/statistic
        - Filter for credible sources (prefer .gov, .edu, industry publications)
        - Prioritize findings with specific data points or quotable content
      </action>

      <check if="search returned relevant findings">
        <action>Use AskUserQuestion tool to present research findings:

          {
            "questions": [{
              "question": "Which findings to include for '{{section.title}}'?",
              "header": "Research",
              "options": [
                {"label": "Finding 1", "description": "{{finding_1_summary}} ({{finding_1_source}})"},
                {"label": "Finding 2", "description": "{{finding_2_summary}} ({{finding_2_source}})"},
                {"label": "Finding 3", "description": "{{finding_3_summary}} ({{finding_3_source}})"},
                {"label": "Finding 4", "description": "{{finding_4_summary}} ({{finding_4_source}})"}
              ],
              "multiSelect": true
            }]
          }

          Note: Present only as many options as findings found (up to 4).
        </action>

        <action>Wait for user response from AskUserQuestion</action>

        <check if="user selected research findings">
          <action>For each selected finding, add to {{section.discovery.research_findings}}:
            {
              "source": "{{finding_source_url}}",
              "content": "{{finding_content_text}}",
              "selected": true
            }
          </action>
        </check>

        <output>
✓ Research: {{section.discovery.research_findings.length}} finding(s) added
        </output>
      </check>

      <check if="search returned no relevant findings">
        <output>
ℹ️ No highly relevant findings found. Proceeding without research data.
        </output>
      </check>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION COMPLETE - Show summary and continue                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <output>
✓ **{{section.title}}** complete ({{loop_index}} of {{total_sections}})
  Message: "{{section.discovery.key_message | truncate(50)}}"
  {{if section.discovery.diagram_requirements}}Diagrams: {{section.discovery.diagram_requirements | join(", ")}}{{end if}}
  {{if section.discovery.visual_metaphor}}Visuals: {{section.discovery.visual_metaphor | join(", ")}}{{end if}}
  {{if section.discovery.research_findings.length > 0}}Research: {{section.discovery.research_findings.length}} finding(s){{end if}}

    </output>

  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- END STEP 2.6 - Sections have discovery data (optional fields may be null) -->
  <!--   - key_message (required, from Story 13.2)                              -->
  <!--   - diagram_requirements (optional, Story 13.3)                          -->
  <!--   - visual_metaphor (optional, Story 13.3)                               -->
  <!--   - research_findings (optional, Story 13.3)                             -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->

  <step n="3" goal="Generate narrative structure (AC5.1.5-6) - Catalog-Driven, Agenda-Based">
    <critical>Template suggestions are now catalog-driven. Read catalog.json first.</critical>
    <critical>Slides are now generated FROM agenda_sections - each section produces estimated_slides number of slides</critical>
    <critical>Each slide MUST have agenda_section_id linking to its parent section</critical>

    <action>Read `.slide-builder/config/catalog/catalog.json`</action>
    <action>Parse the `templates` array to get available template IDs and use_cases</action>

    <action>Analyze collected inputs: purpose, audience, key_points, desired_length</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- STORYLINE DERIVED FROM AGENDA SECTIONS                               -->
    <!-- Map narrative_role to storyline components                           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Generate storyline structure by extracting from agenda_sections:
      - opening_hook: From section with narrative_role="opening" → use section.discovery.key_message
      - tension: From section with narrative_role="problem" → use section.discovery.key_message
      - resolution: From section with narrative_role="solution" → use section.discovery.key_message
      - call_to_action: From section with narrative_role="cta" → use section.discovery.key_message

      Fallback if role not present:
      - opening_hook: From first section's key_message
      - tension: From section with role="context" or generate from purpose
      - resolution: From section with role="evidence" or generate from key_points
      - call_to_action: Generate specific next step from purpose
    </action>

    <action>Identify recurring_themes from key_points</action>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SLIDE GENERATION FROM AGENDA SECTIONS                                -->
    <!-- Each section generates its estimated_slides number of slides         -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <action>Generate slide breakdown from agenda_sections:
      Initialize slide_number = 1

      For each section in agenda_sections:
        Generate {{section.estimated_slides}} slides where each slide has:

        - number: {{slide_number}} (increment after each slide)
        - intent: Derive from section context:
          * First slide of section: Use section.discovery.key_message or section.description
          * Additional slides: Expand on section content with specific aspects
        - template: Match to catalog template using use_cases:
          1. Check section.discovery.diagram_requirements for hints (flowchart → process-flow)
          2. Scan slide intent for keywords
          3. For each catalog template, check if any use_case matches
          4. Use matched template.id (e.g., "title", "agenda", "process-flow")
          5. If no catalog match → use "custom"
        - status: "pending"
        - storyline_role: Map from section.narrative_role:
          * "opening" → "opening"
          * "context" → "tension"
          * "problem" → "tension"
          * "solution" → "resolution"
          * "evidence" → "evidence"
          * "cta" → "cta"
        - agenda_section_id: "{{section.id}}"  ← CRITICAL: Link slide to its parent section
        - key_points: Extract from section context and key_message
        - visual_guidance: Derive from section.discovery:
          * Use diagram_requirements if present (e.g., "Flowchart layout")
          * Use visual_metaphor if present (e.g., "Journey imagery")
          * Otherwise generate from intent
        - tone: professional | bold | warm | technical | urgent (based on section.narrative_role)

        Increment slide_number by 1 for each slide generated
    </action>

    <template-matching-from-catalog>
      ```
      For each slide intent:
        # First check discovery hints
        If section.discovery.diagram_requirements contains "Flowchart":
          Use "process-flow" template
        If section.discovery.diagram_requirements contains "Comparison":
          Use "comparison" template
        If section.discovery.diagram_requirements contains "Timeline":
          Use "timeline" template

        # Then check intent keywords
        For each template in catalog.templates:
          If any word in intent matches template.use_cases:
            Use template.id as the template value
            Break (first match wins)
        If no match:
          Use "custom" (allows novel layouts via frontend-design skill)
      ```
    </template-matching-from-catalog>

    <output>
**Proposed Narrative Structure**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Deck:** {{deck_name}}
**Audience:** {{audience}} ({{audience_knowledge_level}})
**Purpose:** {{purpose}}
**Key Message:** {{key_message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Storyline Arc:**

- **Opening Hook:** {{storyline.opening_hook}}
- **Tension:** {{storyline.tension}}
- **Resolution:** {{storyline.resolution}}
- **Call to Action:** {{storyline.call_to_action}}

**Recurring Themes:** {{recurring_themes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Slide Breakdown ({{slide_count}} slides):**

{{for each slide in slides}}
**Slide {{slide.number}}:** {{slide.intent}}
- Template: {{slide.template}}
- Role: {{slide.storyline_role}}
- Section: {{slide.agenda_section_id}}
- Key points: {{slide.key_points}}
- Tone: {{slide.tone}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <step n="4" goal="Plan modification loop (Story 5.2: AC5.2.1-AC5.2.8)">
    <critical>Save plan.yaml after EACH modification (AC5.2.7)</critical>
    <critical>Display updated plan after EACH modification (AC5.2.5)</critical>
    <critical>Renumber slides after structural changes (AC5.2.6)</critical>
    <critical>Warn if built slides affected by reorder (AC5.2.8)</critical>

    <ask>
**Review Your Deck Plan**

Would you like to make any changes?

- Type **done** to finalize and save the plan
- Type **add** to add a slide (e.g., "Add a slide about ROI after slide 3")
- Type **remove** to remove a slide (e.g., "Remove slide 5")
- Type **move** to reorder (e.g., "Move slide 7 to position 2")
- Type **change** to modify a slide (e.g., "Change slide 3 to focus on security")
- Type **start over** to begin fresh with new inputs

**Your choice:**
    </ask>

    <!-- Done/Finalize Commands -->
    <check if="user types 'done' or 'approve' or 'looks good' or 'save'">
      <goto step="5">Save plan</goto>
    </check>

    <!-- Start Over Command -->
    <check if="user types 'start over' or 'restart' or 'new plan'">
      <goto step="2">Collect inputs</goto>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ADD SLIDE COMMAND (AC5.2.1)                                         -->
    <!-- Patterns: "Add a slide about X after slide N"                       -->
    <!--          "Add slide about X at position N"                          -->
    <!--          "Insert a slide about X after N"                           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <check if="user command contains 'add' or 'insert' followed by slide content">
      <action>Parse ADD command using these patterns:
        - Pattern 1: "add (a )?(slide )?(about|on|for|covering) {topic} after (slide )?(number )?(N)"
        - Pattern 2: "add (a )?(slide )?(about|on|for|covering) {topic} (at|to) position (N)"
        - Pattern 3: "insert (a )?(slide )?(about|on|for|covering) {topic} after (slide )?(N)"
        - Pattern 4: "add (a )?(slide )?(about|on|for|covering) {topic}" (defaults to end)
        Extract: topic (content description), position (where to insert, default: after last slide)
      </action>

      <check if="command cannot be parsed">
        <output>
**I couldn't understand that add command.**

Try one of these formats:
- "Add a slide about ROI after slide 3"
- "Add slide about security at position 5"
- "Insert a slide covering pricing after slide 2"
- "Add a slide about next steps" (adds at end)
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Validate position is within valid range (0 to {{total_slides}}):
        - Position 0 means "at the beginning" (becomes slide 1)
        - Position after last slide means "at the end"
      </action>

      <check if="position out of range">
        <output>
**Invalid position.** Valid range: 0-{{total_slides}}

Position 0 = insert at beginning
Position {{total_slides}} = insert at end
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Generate new slide entry:
        - number: {{insert_position}} (will be set after insertion)
        - intent: Construct from topic (e.g., topic "ROI" → "ROI Analysis and Impact")
        - template: Match using intent keywords:
          * "title", "intro", "opening" → layout-title
          * "list", "bullets", "points", "agenda" → layout-list
          * "flow", "process", "timeline", "steps" → layout-flow
          * "compare", "vs", "two", "comparison" → layout-columns-2
          * "three", "triad", "options", "trio" → layout-columns-3
          * "key", "insight", "callout", "cta", "quote" → layout-callout
          * "code", "technical", "api", "demo" → layout-code
          * "ROI", "numbers", "metrics", "data", "stats" → layout-columns-2
          * "security", "compliance", "risk", "checklist" → layout-list
          * Default: layout-content
        - status: "pending"
        - storyline_role: Infer from position context:
          * Position 1: "opening"
          * Position 2-3: "tension"
          * Middle positions: "evidence"
          * Second-to-last: "resolution"
          * Last position: "cta"
        - key_points: Generate 2-3 relevant points based on topic and surrounding slides
        - visual_guidance: Brief suggestion based on template and topic
        - tone: Inherit from surrounding slides or use "professional" default
      </action>

      <action>Insert slide at specified position (0-indexed array insert)</action>

      <action>Renumber ALL slides sequentially starting from 1:
        for i from 0 to slides.length-1:
          slides[i].number = i + 1
      </action>

      <action>Check if any slides with status "built" were affected by renumbering</action>
      <check if="built slides were renumbered">
        <output>
**Note:** Slide files are not renamed. Built slides (HTML files) retain their original names.
The plan numbers have been updated but existing slide-{n}.html files are unchanged.
        </output>
      </check>

      <action>IMMEDIATELY save updated plan.yaml to disk (AC5.2.7)</action>

      <action>Update status.yaml total_slides count</action>

      <output>
**Slide Added**

✓ New slide inserted at position {{insert_position}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Updated Slide Breakdown ({{total_slides}} slides):**

{{for each slide in slides}}
{{if slide.number == insert_position}}**→ Slide {{slide.number}}:** {{slide.intent}} ← NEW{{else}}**Slide {{slide.number}}:** {{slide.intent}}{{end if}}
   - Template: {{slide.template}}
   - Role: {{slide.storyline_role}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>

      <goto step="4">Continue modification loop</goto>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- REMOVE SLIDE COMMAND (AC5.2.2)                                      -->
    <!-- Patterns: "Remove slide N"                                          -->
    <!--          "Delete slide N"                                           -->
    <!--          "Drop slide N"                                             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <check if="user command contains 'remove' or 'delete' or 'drop' followed by slide number">
      <action>Parse REMOVE command using these patterns:
        - Pattern 1: "(remove|delete|drop) (slide )?(number )?(N)"
        - Pattern 2: "take out slide (N)"
        - Pattern 3: "get rid of slide (N)"
        Extract: target_slide (the slide number to remove)
      </action>

      <check if="command cannot be parsed or no slide number found">
        <output>
**I couldn't understand that remove command.**

Try one of these formats:
- "Remove slide 5"
- "Delete slide 3"
- "Drop slide 7"
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Validate slide number exists (1 to {{total_slides}})</action>

      <check if="slide number out of range">
        <output>
**Invalid slide number.** Valid range: 1-{{total_slides}}

You have {{total_slides}} slides. Please specify a number between 1 and {{total_slides}}.
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <check if="total_slides == 1">
        <output>
**Cannot remove the only slide.**

Your deck has only 1 slide. Use "change slide 1 to focus on..." to modify it instead.
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Store the removed slide's intent for confirmation message</action>

      <action>Remove slide at target position from slides array</action>

      <action>Renumber ALL remaining slides sequentially starting from 1:
        for i from 0 to slides.length-1:
          slides[i].number = i + 1
      </action>

      <action>Check if any remaining slides with status "built" were renumbered</action>
      <check if="built slides were renumbered">
        <output>
**Note:** Slide files are not renamed. Built slides (HTML files) retain their original names.
The plan numbers have been updated but existing slide-{n}.html files are unchanged.
        </output>
      </check>

      <action>IMMEDIATELY save updated plan.yaml to disk (AC5.2.7)</action>

      <action>Update status.yaml total_slides count (decrement by 1)</action>

      <output>
**Slide Removed**

✓ Removed slide {{removed_number}}: "{{removed_intent}}"
✓ Remaining slides renumbered (now {{total_slides}} slides)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Updated Slide Breakdown ({{total_slides}} slides):**

{{for each slide in slides}}
**Slide {{slide.number}}:** {{slide.intent}}
   - Template: {{slide.template}}
   - Role: {{slide.storyline_role}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>

      <goto step="4">Continue modification loop</goto>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MOVE/REORDER SLIDE COMMAND (AC5.2.3)                                -->
    <!-- Patterns: "Move slide N to position M"                              -->
    <!--          "Reorder slide N to position M"                            -->
    <!--          "Move slide N before slide M"                              -->
    <!--          "Move slide N after slide M"                               -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <check if="user command contains 'move' or 'reorder' or 'swap' followed by slide positions">
      <action>Parse MOVE command using these patterns:
        - Pattern 1: "(move|reorder) slide (N) to position (M)"
        - Pattern 2: "(move|reorder) slide (N) to (M)"
        - Pattern 3: "move slide (N) before slide (M)" → target = M-1 or M (insert before)
        - Pattern 4: "move slide (N) after slide (M)" → target = M+1 (insert after)
        - Pattern 5: "swap slide (N) (with|and) slide (M)" → exchange positions
        Extract: source_slide (N), target_position (M)
      </action>

      <check if="command cannot be parsed">
        <output>
**I couldn't understand that move command.**

Try one of these formats:
- "Move slide 7 to position 2"
- "Move slide 3 to position 1" (move to beginning)
- "Move slide 2 after slide 5"
- "Move slide 4 before slide 2"
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Validate source slide exists (1 to {{total_slides}})</action>
      <action>Validate target position is valid (1 to {{total_slides}})</action>

      <check if="source or target out of range">
        <output>
**Invalid slide number or position.** Valid range: 1-{{total_slides}}

You have {{total_slides}} slides. Both source and target must be between 1 and {{total_slides}}.
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <check if="source_slide == target_position">
        <output>
**No change needed.** Slide {{source_slide}} is already at position {{target_position}}.
        </output>
        <goto step="4">Continue modification loop</goto>
      </check>

      <action>Check if source slide OR any slides between source and target have status "built"</action>
      <check if="built slides will be affected by this move">
        <output>
**Warning:** This move affects slides that have already been built.

Built slide files (HTML) will NOT be renamed or moved.
The plan numbers will be updated, but slide-{n}.html files retain their original names.

Affected built slides: {{list_affected_built_slides}}

Proceeding with plan update...
        </output>
      </check>

      <action>Extract slide from source position (remove from array)</action>
      <action>Insert slide at target position</action>

      <action>Renumber ALL slides sequentially starting from 1:
        for i from 0 to slides.length-1:
          slides[i].number = i + 1
      </action>

      <action>IMMEDIATELY save updated plan.yaml to disk (AC5.2.7)</action>

      <output>
**Slide Moved**

✓ Moved slide from position {{source_slide}} to position {{target_position}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Updated Slide Breakdown ({{total_slides}} slides):**

{{for each slide in slides}}
{{if slide.number == target_position}}**→ Slide {{slide.number}}:** {{slide.intent}} ← MOVED{{else}}**Slide {{slide.number}}:** {{slide.intent}}{{end if}}
   - Template: {{slide.template}}
   - Role: {{slide.storyline_role}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>

      <goto step="4">Continue modification loop</goto>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODIFY/CHANGE SLIDE COMMAND (AC5.2.4)                               -->
    <!-- Patterns: "Change slide N to focus on Y"                            -->
    <!--          "Update slide N to cover Y"                                -->
    <!--          "Modify slide N to be about Y"                             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <check if="user command contains 'change' or 'modify' or 'update' or 'edit' followed by slide reference">
      <action>Parse CHANGE command using these patterns:
        - Pattern 1: "(change|modify|update|edit) slide (N) to (focus on|cover|be about|discuss) {new_focus}"
        - Pattern 2: "(change|modify|update|edit) slide (N): {new_focus}"
        - Pattern 3: "(change|modify|update|edit) slide (N) {new_focus}"
        - Pattern 4: "make slide (N) about {new_focus}"
        Extract: target_slide (N), new_focus (the new intent/topic)
      </action>

      <check if="command cannot be parsed">
        <output>
**I couldn't understand that change command.**

Try one of these formats:
- "Change slide 3 to focus on security compliance"
- "Update slide 5 to cover pricing options"
- "Modify slide 2 to be about customer success stories"
- "Edit slide 4: technical architecture overview"
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Validate slide number exists (1 to {{total_slides}})</action>

      <check if="slide number out of range">
        <output>
**Invalid slide number.** Valid range: 1-{{total_slides}}

You have {{total_slides}} slides. Please specify a number between 1 and {{total_slides}}.
        </output>
        <goto step="4">Retry modification</goto>
      </check>

      <action>Update the target slide:
        - intent: Replace with new_focus (formatted as proper slide intent)
        - key_points: Regenerate 2-3 relevant points based on new focus
        - template: Re-evaluate using intent keyword matching:
          * "title", "intro", "opening" → layout-title
          * "list", "bullets", "points", "agenda" → layout-list
          * "flow", "process", "timeline", "steps" → layout-flow
          * "compare", "vs", "two", "comparison" → layout-columns-2
          * "three", "triad", "options", "trio" → layout-columns-3
          * "key", "insight", "callout", "cta", "quote" → layout-callout
          * "code", "technical", "api", "demo" → layout-code
          * "ROI", "numbers", "metrics", "data", "stats" → layout-columns-2
          * "security", "compliance", "risk", "checklist" → layout-list
          * Keep current template if no clear match
        - visual_guidance: Update based on new intent
        - tone: Keep existing unless new focus suggests different tone
        - status: Keep as "pending" (if was "built", stays "built")
        - storyline_role: Keep existing unless position context suggests change
      </action>

      <action>IMMEDIATELY save updated plan.yaml to disk (AC5.2.7)</action>

      <output>
**Slide Modified**

✓ Updated slide {{target_slide}}

**Before:** {{old_intent}}
**After:** {{new_intent}}
{{if template_changed}}**Template:** {{old_template}} → {{new_template}}{{end if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Slide {{target_slide}} Details:**

- **Intent:** {{slide.intent}}
- **Template:** {{slide.template}}
- **Role:** {{slide.storyline_role}}
- **Key Points:**
{{for each point in slide.key_points}}
  • {{point}}
{{end for}}
- **Visual Guidance:** {{slide.visual_guidance}}
- **Tone:** {{slide.tone}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Full Slide Breakdown ({{total_slides}} slides):**

{{for each slide in slides}}
{{if slide.number == target_slide}}**→ Slide {{slide.number}}:** {{slide.intent}} ← MODIFIED{{else}}**Slide {{slide.number}}:** {{slide.intent}}{{end if}}
   - Template: {{slide.template}}
   - Role: {{slide.storyline_role}}
{{end for}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>

      <goto step="4">Continue modification loop</goto>
    </check>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- UNRECOGNIZED COMMAND - HELP                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <check if="command not recognized by any pattern above">
      <output>
**I didn't recognize that command.**

Here are the available modification commands:

**Add a slide:**
- "Add a slide about ROI after slide 3"
- "Insert a slide covering security at position 2"

**Remove a slide:**
- "Remove slide 5"
- "Delete slide 3"

**Move/reorder a slide:**
- "Move slide 7 to position 2"
- "Move slide 3 before slide 1"

**Change a slide:**
- "Change slide 3 to focus on security compliance"
- "Update slide 4 to cover pricing"

**Finish editing:**
- "done" or "looks good" to save and finalize

**Start fresh:**
- "start over" to begin new planning
      </output>
      <goto step="4">Retry modification</goto>
    </check>
  </step>

  <step n="5" goal="Save plan and update status (AC5.1.7-8)">
    <!-- Generate deck slug from deck_name -->
    <slug-generation critical="true">
      <action>Generate slug from deck_name:
        1. Convert to lowercase
        2. Replace spaces with hyphens
        3. Remove special characters (keep only a-z, 0-9, hyphens)
        4. Remove consecutive hyphens
        5. Trim hyphens from start and end
      </action>
      <action>Set {{deck_slug}} = generated slug</action>
      <example>
        "Claude Code Fundamentals" → "claude-code-fundamentals"
        "Q4 2026 Strategy" → "q4-2026-strategy"
      </example>
    </slug-generation>

    <!-- Create output directory for this deck -->
    <action>Create output/{{deck_slug}}/ directory if it doesn't exist</action>
    <action>Create output/{{deck_slug}}/slides/ directory if it doesn't exist</action>

    <action>Write plan.yaml to output/{{deck_slug}}/plan.yaml with full schema:
```yaml
# Deck Metadata
deck_name: "{{deck_name}}"
created: "{{current_date}}"
last_modified: "{{current_timestamp}}"

# Audience Context
audience: "{{audience}}"
audience_knowledge_level: {{audience_knowledge_level}}
audience_priorities:
{{for each priority in audience_priorities}}
  - "{{priority}}"
{{end for}}

# Purpose & Outcome
purpose: "{{purpose}}"
desired_outcome: "{{desired_outcome}}"
key_message: "{{key_message}}"

# Agenda Structure with Discovery (Story 13.4)
# Each section contains discovery data collected during planning
agenda:
  total_sections: {{agenda_sections.length}}
  sections:
{{for each section in agenda_sections}}
    - id: "{{section.id}}"
      title: "{{section.title}}"
      narrative_role: "{{section.narrative_role}}"
      estimated_slides: {{section.estimated_slides}}
      description: "{{section.description}}"
      discovery:
        key_message: "{{section.discovery.key_message}}"
        key_message_framing: "{{section.discovery.key_message_framing | default: 'direct'}}"
        diagram_requirements: {{section.discovery.diagram_requirements | default: [] | to_yaml_array}}
        visual_metaphor: {{section.discovery.visual_metaphor | default: [] | to_yaml_array}}
        research_findings:
{{for each finding in section.discovery.research_findings | default: []}}
          - source: "{{finding.source}}"
            content: "{{finding.content}}"
            selected: {{finding.selected | default: true}}
{{end for}}
{{if section.discovery.research_findings is empty or null}}
          []
{{end if}}
{{end for}}

# Narrative Structure (derived from agenda sections)
storyline:
  opening_hook: "{{storyline.opening_hook}}"
  tension: "{{storyline.tension}}"
  resolution: "{{storyline.resolution}}"
  call_to_action: "{{storyline.call_to_action}}"

recurring_themes:
{{for each theme in recurring_themes}}
  - "{{theme}}"
{{end for}}

# Slide Breakdown with Rich Context (linked to agenda sections)
slides:
{{for each slide in slides}}
  - number: {{slide.number}}
    intent: "{{slide.intent}}"
    template: "{{slide.template}}"
    status: pending
    storyline_role: "{{slide.storyline_role}}"
    agenda_section_id: "{{slide.agenda_section_id}}"
    key_points:
{{for each point in slide.key_points}}
      - "{{point}}"
{{end for}}
    visual_guidance: "{{slide.visual_guidance}}"
    tone: "{{slide.tone}}"
{{end for}}
```
    </action>

    <action>Update .slide-builder/status.yaml:
      - Set mode: "deck"
      - Set current_deck_slug: "{{deck_slug}}"
      - Set deck_slug: "{{deck_slug}}"
      - Set current_slide: 0
      - Set total_slides: {{slide_count}}
      - Set built_count: 0
      - Set output_folder: "output/{{deck_slug}}"
      - Set last_action: "Deck plan created with {{slide_count}} slides"
      - Set last_modified: {{current_timestamp}}
      - Add to history array: { action: "Deck plan '{{deck_name}}' created with {{slide_count}} slides", timestamp: {{current_timestamp}} }
    </action>

    <output>
**Deck Plan Saved**

Your narrative deck plan is ready!

**Summary:**
- Deck: {{deck_name}}
- Slug: {{deck_slug}}
- Slides: {{slide_count}}
- Plan file: `output/{{deck_slug}}/plan.yaml`
- Slides output: `output/{{deck_slug}}/slides/`
- Mode: deck

**Next Steps:**
- `/sb:build-one` - Build slides one at a time (recommended for review)
- `/sb:build-all` - Build all {{slide_count}} slides at once
- Edit `output/{{deck_slug}}/plan.yaml` directly to fine-tune any slide

**Note:** Each deck has its own folder in `output/`. You can work on multiple decks without overwriting plans.

**Tip:** Each slide will be generated based on its intent and template. You can edit the generated HTML or run `/sb:edit` to modify layouts.
    </output>
  </step>

</workflow>
```
