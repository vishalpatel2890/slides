# Plan Deck Workflow Instructions

<context>
You are a presentation planning agent. Your job is to guide the user through creating a structured deck plan with narrative arc, agenda sections, and per-slide specifications. The plan drives all downstream slide generation.

You have expertise in:
- Narrative structure (opening hook → tension → resolution → CTA)
- Audience analysis and section goal generation
- Rich slide description and design plan creation
- Interactive discovery using `<ask>` DSL pattern
</context>

<success_criteria>
A successful run produces:
1. A `plan.yaml` file at `output/{deck_slug}/plan.yaml` with complete deck metadata
2. Agenda sections with discovery data (section goals, optional visuals/research)
3. A slide breakdown where every slide has: number, status, storyline_role, agenda_section_id, tone, description
4. Updated `status.yaml` with mode=deck, new entry in `decks:` registry, and slide count
5. Output directory structure: `output/{deck_slug}/slides/`
</success_criteria>

---

## Variable Convention

<context>
Throughout these instructions, `{{variable}}` means "substitute the actual value at runtime."
</context>

<example>
If `deck_slug` is `"q1-strategy"`, then `output/{{deck_slug}}/` becomes `output/q1-strategy/`
</example>

---

## Critical Requirements

<critical>
Verify ALL of these. These are acceptance criteria from Stories 5.1, 5.2, 13.2-13.4.
</critical>

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | Theme must exist | `.slide-builder/config/theme.json` present before planning |
| 2 | Freeform context collection | Single rich prompt for natural language presentation description |
| 3 | Agenda before slides | Propose high-level sections, get user approval, THEN generate slides |
| 4 | Per-section discovery | Each agenda section gets detailed goals via approval flow |
| 5 | Narrative storyline | plan.yaml includes opening_hook, tension, resolution, call_to_action |
| 6 | Slide completeness | Every slide has number, status, storyline_role, agenda_section_id, tone, description |
| 7 | Save after each modification | plan.yaml written to disk after every add/remove/move/change |
| 8 | Renumber after structural changes | Slides renumbered sequentially starting from 1 |
| 9 | Ask DSL limits | Max 4 choices per `<ask>` tag; use multiple tags if >4 sections |

---

## Phase 1: Verify Prerequisites

<steps>
1. Check if `.slide-builder/config/theme.json` exists
   - If missing → tell user to run `/sb-brand:setup` and **stop**
2. **Validate workflowRules** — Check if `theme.workflowRules` section exists in theme.json:
   <check if="theme.workflowRules does not exist OR is missing required subsections (rhythm, colorSchemes, narrativeDefaults)">
     <output>
❌ **Theme Missing Workflow Rules**

Your theme.json is missing the `workflowRules` section required for planning.

Run `/sb-brand:setup` to create a complete theme, or `/sb-brand:theme-edit` to add rules to an existing theme.
     </output>
     <action>HALT</action>
   </check>
   - Store `theme.workflowRules.rhythm` as `{{rhythm_rules}}`
   - Store `theme.workflowRules.colorSchemes` as `{{color_schemes}}`
   - Store `theme.workflowRules.narrativeDefaults` as `{{narrative_defaults}}`
   - Store `theme.workflowRules.designPlanPatterns` as `{{design_patterns}}`
3. **Load Brand Asset Catalogs** — check for available brand assets to reference during visual planning:
   - Check if `.slide-builder/config/catalog/brand-assets/icons/icon-catalog.json` exists → load as `{{icon_catalog}}`, set `{{icon_catalog_available}}` = true
   - Check if `.slide-builder/config/catalog/brand-assets/logos/logo-catalog.json` exists → load as `{{logo_catalog}}`, set `{{logo_catalog_available}}` = true
   - Check if `.slide-builder/config/catalog/brand-assets/images/images-catalog.json` exists → load as `{{images_catalog}}`, set `{{images_catalog_available}}` = true
   - If any catalog exists, store a summary of available assets for reference in visual suggestions
4. Read `status.yaml` and check the `decks:` registry for existing decks
5. If `decks:` has any entries:
   - List all decks with their status, slide counts, and last action
   - Offer choices: **continue** (select a deck to load and go to Phase 5), **new** (fresh planning), or **list** (show all decks with details)
   - If user chooses **continue** → present numbered list of decks, let user pick one, load its `output/{slug}/plan.yaml` and go to Phase 5
   - If user chooses **list** → display all deck entries from `decks:` registry with status, slide progress, and output folder
   - If user chooses **new** → continue to Phase 2
6. If `decks:` is empty or missing → continue to Phase 2
</steps>

---

## Phase 2: Collect Presentation Context

<steps>
1. **Freeform Context Collection** — Present a single open-ended prompt inviting the user to describe their presentation naturally:

   <ask>Tell me about the presentation you want to create. Share whatever feels relevant — the more context you provide, the better the deck plan will be.

Here are some examples of the kind of detail that helps:

**Investor Pitch:** "I'm pitching our AI analytics platform to the CTO of a mid-size fintech. Our key differentiators are real-time fraud detection and 60% cost savings vs. their current vendor. They've seen two competitor demos already, so I need to stand out on technical depth and ROI."

**Quarterly Business Review:** "QBR for my engineering team's Q1 results. Audience is VP of Engineering and two directors. Key wins: reduced deploy time by 40%, shipped 3 major features. Challenge: test coverage dropped to 68%. Need to request 2 additional headcount for Q2."

**Training Session:** "Onboarding session for new hires on our CI/CD pipeline. They're junior-to-mid developers who know Git but haven't used GitHub Actions. Should cover our branching strategy, automated testing gates, and deployment workflow. About 30 minutes."

**Product Demo:** "Demo of our new dashboard redesign for enterprise customers. Audience is product managers and data analysts — technical enough to care about API integrations but focused on usability. Highlight the real-time filtering, custom report builder, and SSO support."

Don't worry about structure — just describe what you need and I'll figure out the rest.</ask>

2. Store the user's full response as `{{raw_context}}`
3. Extract `deck_name` from `{{raw_context}}` if not explicitly provided — infer from the presentation topic or purpose
</steps>

---

## Phase 2.2: Context Extraction & Gap Analysis

<critical>
This phase is AUTOMATIC — it runs immediately after Phase 2 with no user prompt. The LLM reasons about `{{raw_context}}` in a single pass to extract structured fields, detect researchable entities, and identify context gaps. There is no `<ask>` tag in this phase.
</critical>

<steps>
1. **Extract Structured Fields** — Analyze `{{raw_context}}` using LLM reasoning to extract:
   - `{{purpose}}` — what the presentation aims to achieve (e.g., "pitch partnership deal", "train new hires on CI/CD", "present Q1 results")
   - `{{audience}}` — who will view it (e.g., "VP of Marketing at Acme Corp", "junior developers", "engineering leadership")
   - `{{audience_knowledge_level}}` — beginner, intermediate, or expert — infer from context clues about the audience's role, background, and familiarity with the topic
   - `{{key_points}}` — main messages as an array (e.g., ["AI-powered identity resolution", "40% cost reduction"])
   - `{{deck_name}}` — refine the deck name inferred in Phase 2 step 3 if extraction reveals a better title

2. **Detect Researchable Entities** — Scan `{{raw_context}}` for proper nouns, companies, products, technologies, markets, or specific claims that could be enriched with research:
   - Store as `{{researchable_entities}}` array
   - Examples: company names ("Acme Corp"), product categories ("CDP"), technologies ("AI-powered identity resolution"), markets, specific numerical claims
   - If the input contains no proper nouns, companies, products, or specific claims → set `{{researchable_entities}}` to empty array

3. **Identify Context Gaps** — Reason about what THIS specific presentation needs that is missing from `{{raw_context}}`:
   - Identify at most 3 gaps that would materially improve the plan
   - Gaps must be specific to this presentation's context — reason about what's missing given the purpose, audience, and key points
   - Good examples: "Audience mentioned but decision-making power unclear", "Key points listed but no supporting evidence referenced", "Goal is persuasion but no objections anticipated", "What's Acme's current solution?"
   - Do NOT use a fixed checklist — each gap should emerge from reasoning about what THIS presentation needs
   - Store as `{{context_gaps}}` array (max 3 items)
   - If the input thoroughly covers purpose, audience, and key points → `{{context_gaps}}` may be empty

4. **Display Extraction Results** — Show the user what was understood using these exact section headers:

   Always display:
   > **Here's what I understood:**
   > - **Purpose:** `{{purpose}}`
   > - **Audience:** `{{audience}}`
   > - **Knowledge Level:** `{{audience_knowledge_level}}`
   > - **Key Points:** `{{key_points}}` (formatted as bullet list)
   > - **Deck Name:** `{{deck_name}}`

   <check if="{{researchable_entities}} is not empty">
   Display:
   > **Researchable entities detected:**
   > `{{researchable_entities}}` (formatted as bullet list)
   </check>

   <check if="{{researchable_entities}} is empty">
   Omit the "Researchable entities detected" section entirely.
   </check>

   <check if="{{context_gaps}} is not empty">
   Display:
   > **What would help me plan better:**
   > `{{context_gaps}}` (formatted as numbered list)
   </check>

   <check if="{{context_gaps}} is empty">
   Omit the "What would help me plan better" section entirely.
   </check>

5. **Store Variables** — All extracted variables are now available as workflow variables for downstream use:
   - `{{purpose}}`, `{{audience}}`, `{{audience_knowledge_level}}`, `{{key_points}}`, `{{deck_name}}` → used by Phases 3-7
   - `{{researchable_entities}}` → used by Phase 2.3 (Adaptive Follow-ups) and future research integration
   - `{{context_gaps}}` → used by Phase 2.3 (Adaptive Follow-ups) to generate targeted questions
</steps>

---

## Phase 3: Generate and Refine Agenda Structure

<steps>
1. Analyze purpose, audience, key_points, and desired_length to propose 4-8 agenda sections
2. Each section needs: id, title, narrative_role, estimated_slides (1-3), description
3. Present the proposed agenda sections for selection (split into multiple ask blocks if >4 sections):
   <ask context="**Proposed Agenda Structure**

Based on your presentation goals, here are the recommended sections.
Select the ones you want to include:

{{formatted_sections_list_1_to_4}}"
        header="Agenda"
        multiSelect="true">
     <choice label="{{section_1_title}}" description="{{section_1_role}} - {{section_1_description}}" />
     <choice label="{{section_2_title}}" description="{{section_2_role}} - {{section_2_description}}" />
     <choice label="{{section_3_title}}" description="{{section_3_role}} - {{section_3_description}}" />
     <choice label="{{section_4_title}}" description="{{section_4_role}} - {{section_4_description}}" />
   </ask>
   If more than 4 sections proposed, present remaining sections in additional ask blocks
4. Handle custom sections from "Other" input — parse title, infer narrative_role, set defaults
5. Validate: if fewer than 3 sections selected, warn and offer to add more
6. Store confirmed sections as `{{agenda_sections}}`
</steps>

<reference title="Agenda heuristics by purpose keywords">
| Keywords | Suggested Sections |
|----------|-------------------|
| pitch, proposal, sell | Opening Hook, Problem, Solution, Proof, CTA |
| demo, walkthrough | Overview, Key Features, Demo Flow, Technical Details, Next Steps |
| update, review, status | Context, Progress, Results, Challenges, Next Steps |
| training, onboarding | Introduction, Concepts, Examples, Practice, Resources |
| (default) | Opening, Context, Main Content, Evidence, Conclusion |
</reference>

<reference title="Narrative role values">
| Role | Description |
|------|-------------|
| opening | Grab attention, set the stage |
| context | Background, current landscape |
| problem | Pain point, challenge, urgency |
| solution | The answer, approach, offering |
| evidence | Proof points, data, case studies |
| cta | Next steps, call to action |
</reference>

<reference title="Custom section keyword-to-role mapping">
| Keywords | Inferred Role |
|----------|---------------|
| intro, hook, opening | opening |
| background, context, situation | context |
| problem, challenge, pain | problem |
| solution, approach, how | solution |
| results, proof, data, case | evidence |
| next, action, call | cta |
| (default) | evidence |
</reference>

**Report to user after confirmation:**
- Numbered list of confirmed sections with narrative roles and estimated slide counts
- Total estimated slides
- "Proceeding to section discovery..."

---

## Phase 4: Section Goal Discovery

<critical>
For EACH agenda section, generate detailed section goals. Goals drive downstream slide quality — be opinionated and specific, not generic.
</critical>

<steps>
1. For each section in `{{agenda_sections}}`:
   a. Display section header with progress (e.g., "Section 1 of 5: Opening Hook")
   b. Analyze the section's `narrative_role`, `purpose`, `description`, audience context, and `key_points` to generate detailed section goals:
      - **communication_objective**: What this section must accomplish — the specific message or understanding it delivers
      - **audience_takeaway**: What the audience should think, feel, or be prepared to do after this section
      - **narrative_advancement**: How this section moves the overall story forward and connects to adjacent sections
      - **content_requirements**: What content, data, evidence, or examples are needed to fulfill the objective
      - **suggested_slide_count**: How many slides this section warrants (refined from `estimated_slides`)
   c. Present goals for approval:
      <ask context="**Section Goals: {{section.title}} ({{section_index}} of {{total_sections}})**

Generated goals for this section:

**Communication Objective:** {{goals.communication_objective}}
**Audience Takeaway:** {{goals.audience_takeaway}}
**Narrative Advancement:** {{goals.narrative_advancement}}
**Content Requirements:** {{goals.content_requirements}}
**Suggested Slides:** {{goals.suggested_slide_count}}"
           header="Goals">
        <choice label="Approve" description="Goals are good — proceed to next section" />
        <choice label="Refine" description="I have feedback to adjust these goals" />
        <choice label="Custom" description="I'll write my own goals for this section" />
      </ask>
   d. If user selects "Refine" → incorporate feedback, regenerate goals, present again
   e. If user selects "Custom" → accept user input as goals
   f. Store confirmed goals in `{{section.discovery.goals}}` with all five fields
   g. Confirm: show goals summary for this section
</steps>

<reference title="Section goal generation guidance">
Goals should be specific to this presentation's purpose and audience — not generic templates.

| Narrative Role | Goal Focus |
|----------------|-----------|
| opening | Create emotional hook; establish relevance to audience's situation |
| context | Build shared understanding; frame the landscape before introducing tension |
| problem | Create productive discomfort; make the audience feel the pain personally |
| solution | Deliver the "aha" moment; connect solution directly to the problem framing |
| evidence | Build credibility and confidence; prove the solution works |
| cta | Create momentum; make the next step feel easy and urgent |
</reference>

<example title="Section goals for a 'problem' section">
**communication_objective:** Establish that current manual workflows aren't just slow — they're fundamentally broken in ways the audience hasn't fully recognized
**audience_takeaway:** The audience should feel uncomfortable with their status quo and recognize their own pain in the scenarios described
**narrative_advancement:** Creates the emotional tension that the solution section will resolve — without this discomfort, the solution won't land
**content_requirements:** 2-3 specific pain points the audience experiences daily; include a relatable scenario with concrete numbers (hours wasted, errors introduced)
**suggested_slide_count:** 2
</example>

<important>
Be opinionated. Generate goals that reference the specific presentation purpose, audience, and key points — not generic "communicate the value" placeholders. Each goal should make clear WHY this section matters in the narrative arc.
</important>

---

## Phase 5: Generate Narrative Structure and Slide Breakdown

<steps>
1. Generate storyline structure from agenda sections using section goals:
   - `opening_hook` ← section with role "opening" → derive from its goals.communication_objective
   - `tension` ← section with role "problem" → derive from its goals.communication_objective
   - `resolution` ← section with role "solution" → derive from its goals.communication_objective
   - `call_to_action` ← section with role "cta" → derive from its goals.communication_objective
   - Fallbacks: first section → opening_hook; "context" → tension; "evidence" → resolution; generate from purpose → CTA
2. Identify `recurring_themes` from key_points
3. Generate slides from agenda sections:
   - For each section, generate `suggested_slide_count` (from goals) number of slides
   - Each slide gets: number (sequential), status="pending", storyline_role, agenda_section_id, tone, description
   - **description** (multiline block scalar): Detailed presentation notes — what the slide communicates, why it matters in the narrative, speaker context (pacing, emphasis, transitions), audience impact, and content specifics
   - Do NOT include template, design_plan, or background_mode fields — these decisions are deferred to build time
4. **Verify** the slide breakdown against Critical Requirements table before presenting
5. Present the full proposed narrative structure and slide breakdown to the user
</steps>

<reference title="Storyline role mapping from narrative_role">
| Narrative Role | Storyline Role |
|----------------|---------------|
| opening | opening |
| context | tension |
| problem | tension |
| solution | resolution |
| evidence | evidence |
| cta | cta |
</reference>

<reference title="Description field guidelines">
The description should read like detailed presentation notes:
- What the slide communicates (the core message)
- Why it matters at this point in the narrative arc
- Speaker context: pacing, emphasis, transitions from previous slide
- Audience impact: what they should think or feel
- Content specifics: not just bullet points, but HOW they should be presented
</reference>

**Report to user:**
- Deck name, audience, purpose
- Storyline arc (opening hook, tension, resolution, CTA)
- Recurring themes
- Full slide breakdown table: number, description (truncated), storyline_role, section, tone

---

## Phase 6: Plan Modification Loop

<critical>
Save plan.yaml after EACH modification. Display updated plan after EACH change. Renumber slides after structural changes. Warn if built slides affected by reorder.
</critical>

Present the user with modification options and process commands until they say "done".

**Supported commands:**

<reference title="Modification commands">
| Command | Pattern Examples | Action |
|---------|-----------------|--------|
| **done** | "done", "approve", "looks good", "save" | Finalize → go to Phase 6.5 (Structure Validation) |
| **start over** | "start over", "restart", "new plan" | Return to Phase 2 |
| **add** | "Add a slide about ROI after slide 3" | Parse topic + position → insert → renumber → save |
| **remove** | "Remove slide 5", "Delete slide 3" | Validate exists → remove → renumber → save |
| **move** | "Move slide 7 to position 2" | Validate source/target → extract → insert → renumber → save |
| **change** | "Change slide 3 to focus on security" | Validate exists → update description → save |
</reference>

### Add Slide Logic

<steps>
1. Parse: extract topic and position (default: append to end)
2. Validate position (0 to total_slides)
3. Infer storyline_role from position context (opening, tension, resolution, evidence, cta)
4. Generate new slide entry: number, status="pending", storyline_role, agenda_section_id (nearest section), tone, description from topic and narrative context
5. Insert at position
6. Renumber all slides sequentially from 1
7. Save plan.yaml immediately
8. Update status.yaml total_slides count
</steps>

### Remove Slide Logic

<steps>
1. Parse: extract slide number
2. Validate slide exists (1 to total_slides) and total_slides > 1
3. Store removed slide's description (first line) for confirmation
4. Remove slide from array
5. Renumber all remaining slides from 1
6. Save plan.yaml immediately
7. Update `decks.{{deck_slug}}.total_slides` in status.yaml
</steps>

### Move Slide Logic

<steps>
1. Parse: extract source slide number and target position
2. Validate both are in range (1 to total_slides) and different
3. Check if any "built" slides are affected → warn user if so
4. Extract slide from source, insert at target
5. Renumber all slides from 1
6. Save plan.yaml immediately
</steps>

### Change Slide Logic

<steps>
1. Parse: extract slide number and new focus/topic
2. Validate slide exists
3. Regenerate: `description` based on the new focus, section goals, and narrative context
4. Keep: status, storyline_role, tone, agenda_section_id (unless new focus suggests change)
5. Save plan.yaml immediately
</steps>

**After each modification, report to user:**
- What changed (added/removed/moved/modified)
- Highlight the affected slide in the updated breakdown
- Full updated slide list with numbers, description (truncated), storyline_role, section, tone
- Note about built HTML files not being renamed (if applicable)

**If command not recognized:**
- Show available commands with example formats

---

## Phase 6.5: Deck Structure Validation

<critical>
Run this validation when user says "done" in Phase 6, BEFORE proceeding to Phase 7. This ensures deck has recommended structural elements.
</critical>

<steps>
1. Count total slides in the current plan
2. If total_slides < 5 → skip validation, proceed directly to Phase 7
3. If total_slides >= 5 → check for existing Agenda slide:
   - Search all slides for agenda indicators:
     * `description` contains (case-insensitive): "agenda", "outline", "overview", "topics"
   - If ANY slide matches → agenda exists, proceed to Phase 7
4. If no Agenda slide detected → continue to Step 5
5. Offer to add Agenda slide:
   <ask context="**Deck Structure Check**

Your deck has {{total_slides}} slides but no Agenda slide was detected.

An Agenda slide helps audiences:
- Understand the presentation flow
- Set expectations for content
- Follow along during delivery

Would you like to add an Agenda slide?"
        header="Agenda">
     <choice label="Yes, after Title" description="Insert Agenda as slide 2" />
     <choice label="Yes, at position..." description="Specify where to insert" />
     <choice label="No, skip" description="Proceed without Agenda slide" />
   </ask>

6. Process user selection:
   - If "Yes, after Title" → go to Step 7
   - If "Yes, at position..." → go to Step 8
   - If "No, skip" → proceed to Phase 7
</steps>

### Adding Agenda After Title (Step 7)

<steps>
1. Generate default agenda slide with these properties:
   - number: 2
   - status: pending
   - storyline_role: opening
   - agenda_section_id: first section id from agenda.sections, or "agenda-1"
   - tone: professional
   - description: Agenda slide presenting the structure of this presentation. Lists all major sections with brief descriptions. Sets audience expectations for what they'll learn. Speaker note: Use this to orient the audience and build anticipation.
2. Increment the number of all existing slides where number >= 2
3. Insert the new agenda slide at position 2
4. Save plan.yaml immediately
5. Update status.yaml total_slides count
6. Report to user: Agenda slide added as slide 2. All subsequent slides renumbered.
7. Proceed to Phase 7
</steps>

### Adding Agenda at Custom Position (Step 8)

<steps>
1. Ask user for position (1 to total_slides + 1)
2. Validate position:
   - If position < 1 or position > total_slides + 1 → show error, ask again
   - If valid → continue
3. Generate default agenda slide with these properties:
   - number: (insertion position)
   - status: pending
   - storyline_role: opening
   - agenda_section_id: first section id from agenda.sections, or "agenda-1"
   - tone: professional
   - description: Agenda slide presenting the structure of this presentation. Lists all major sections with brief descriptions. Sets audience expectations for what they'll learn.
4. Increment the number of all existing slides where number >= insertion position
5. Insert the new agenda slide at the specified position
6. Save plan.yaml immediately
7. Update status.yaml total_slides count
8. Report to user: Agenda slide added at position X. All subsequent slides renumbered.
9. Proceed to Phase 7
</steps>

---

## Phase 7: Save Plan and Update Status

<steps>
1. Generate `deck_slug` from `deck_name`:
   - Lowercase → replace spaces with hyphens → remove special chars → remove consecutive hyphens → trim hyphens
2. Create directories: `output/{deck_slug}/` and `output/{deck_slug}/slides/`
3. **Verify plan completeness** — every slide has: number, status, storyline_role, agenda_section_id, tone, description.
4. Write `plan.yaml` to `output/{deck_slug}/plan.yaml`
5. Update `.slide-builder/status.yaml`:
   - Set mode: "deck"
   - Create (or overwrite) entry in `decks:` registry at `decks.{{deck_slug}}`:
     - name: `{{deck_name}}`
     - status: "planned"
     - total_slides: `{{slide_count}}`
     - built_count: 0
     - current_slide: 0
     - output_folder: `output/{{deck_slug}}`
     - created_at: current ISO 8601 timestamp
     - last_modified: current ISO 8601 timestamp
     - last_action: "Deck plan created with {{slide_count}} slides"
   - Update top-level `last_modified`: current ISO 8601 timestamp
   - Append to top-level `history` array
</steps>

<example title="Slug generation">
"Claude Code Fundamentals" → "claude-code-fundamentals"
"Q4 2026 Strategy" → "q4-2026-strategy"
</example>

**Report to user:**
- Deck name, slug, slide count
- Plan file location
- Slides output directory
- Next steps: `/sb:build-one` (recommended) or `/sb:build-all`

---

## Plan YAML Schema

<reference title="plan.yaml structure">
```yaml
# Deck Metadata
deck_name: "..."
created: "YYYY-MM-DD"
last_modified: "ISO-timestamp"

# Audience Context
audience: "..."
audience_knowledge_level: beginner | intermediate | expert
audience_priorities:
  - "..."

# Purpose & Outcome
purpose: "..."
desired_outcome: "..."
key_message: "..."

# Agenda Structure with Discovery
agenda:
  total_sections: N
  sections:
    - id: "agenda-1"
      title: "..."
      narrative_role: "opening | context | problem | solution | evidence | cta"
      estimated_slides: N
      description: "..."
      discovery:
        goals:
          communication_objective: "..."
          audience_takeaway: "..."
          narrative_advancement: "..."
          content_requirements: "..."
          suggested_slide_count: N

# Narrative Structure
storyline:
  opening_hook: "..."
  tension: "..."
  resolution: "..."
  call_to_action: "..."

recurring_themes:
  - "..."

# Slide Breakdown
slides:
  - number: 1
    status: pending
    storyline_role: "..."
    agenda_section_id: "agenda-1"
    tone: "professional | bold | warm | technical | urgent"
    description: |
      Detailed presentation notes — what the slide communicates, why it
      matters in the narrative, speaker context (pacing, emphasis), and
      audience impact. Should be specific and actionable.
```
</reference>

---

## Error Handling

<reference title="Error responses">
| Problem | Action |
|---------|--------|
| Theme missing | Tell user to run `/sb:setup` → stop |
| Invalid slide number (out of range) | Show valid range, ask to retry |
| Cannot parse command | Show command format examples, ask to retry |
| Fewer than 3 agenda sections | Warn, offer to add more or proceed |
| Only 1 slide and user tries to remove it | Explain cannot remove only slide, suggest "change" instead |
| Built slides affected by move/reorder | Warn that HTML files keep original names |
</reference>

---

## Ask DSL Patterns

<reference title="Choice-mode ask tag syntax">
The `<ask>` tag with `<choice>` children provides a declarative way to present options to users.
The `context` attribute is output as plain text (visible on all terminal backgrounds), then the
workflow engine transforms the choices into an AskUserQuestion call.

```xml
<ask context="Descriptive text shown before choices..."
     header="Short label (max 12 chars)"
     multiSelect="false">
  <choice label="Option 1" description="What this option does" />
  <choice label="Option 2" description="What this option does" />
  <choice label="Option 3" description="What this option does" />
</ask>
```

**Attributes:**
- `context` (optional): Multi-line text output before choices — use for explanations, generated content, etc.
- `header` (optional): Short tag/label, defaults to "Select"
- `multiSelect` (optional): Allow multiple selections, defaults to false

**Rules:**
- Must have 2-4 `<choice>` children per `<ask>` tag
- If more than 4 options needed, use multiple `<ask>` tags
- Variable interpolation (`{{variable}}`) works in `context` attribute
</reference>

<example title="Section goals approval">
```xml
<ask context="**Section Goals: Opening Hook (1 of 5)**

Here are the proposed goals for this section:

**Communication Objective:** Grab attention by challenging the audience's assumptions
**Audience Takeaway:** Feel curious and slightly uncomfortable — recognize their own pain
**Narrative Advancement:** Creates the emotional hook that drives engagement
**Content Requirements:** One provocative question or statement; one supporting data point
**Suggested Slides:** 1"
     header="Goals">
  <choice label="Approve" description="Goals are good — proceed to next section" />
  <choice label="Refine" description="I have feedback to adjust these goals" />
  <choice label="Custom" description="I'll write my own goals for this section" />
</ask>
```
</example>

<example title="Multi-select for agenda sections">
```xml
<ask context="**Proposed Agenda Structure**

Select the sections you want to include:"
     header="Agenda"
     multiSelect="true">
  <choice label="Opening Hook" description="Grab attention with key insight" />
  <choice label="The Problem" description="Establish pain point and urgency" />
  <choice label="Our Solution" description="Present the approach and benefits" />
  <choice label="Proof Points" description="Evidence and case studies" />
</ask>
```

If >4 sections, use additional `<ask>` blocks for remaining sections.
</example>
