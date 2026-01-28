# Enhanced Planning Sessions - Technical Specification

**Author:** Vishal
**Date:** 2026-01-28
**Project Level:** Quick Flow
**Change Type:** Feature Enhancement
**Development Context:** Brownfield - Enhancing existing planning workflows

---

## Context

### Available Documents

- Product briefs: None found
- Research documents: None found
- Brownfield documentation: Analyzed directly from codebase

### Project Stack

**Runtime:** Node.js (CommonJS modules)

**Dependencies (from package.json):**
- `puppeteer ^23.0.0` - Headless browser for screenshots
- `googleapis ^140.0.0` - Google Slides export

**Framework:** BMAD-pattern workflow system
- YAML workflow configs (workflow.yaml)
- XML/Markdown instruction files (instructions.md)
- Status tracking via status.yaml
- Skill registration via `.claude/commands/`

### Existing Codebase Structure

```
.slide-builder/
├── config/
│   ├── theme.json              ← Brand theme primitives
│   └── templates/
│       └── viewer-template.html ← HTML viewer template
├── workflows/
│   ├── plan-one/               ← Single slide planning (target)
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── plan-deck/              ← Full deck planning (primary target)
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── build-one/              ← Slide building
│   ├── build/                  ← Build orchestration
│   └── edit/                   ← Slide editing
└── status.yaml                 ← Current session state
```

**Key File:** `.slide-builder/workflows/plan-deck/instructions.md` (783 lines)
- Current flow: 4 sequential prompts → narrative generation → modification loop
- Uses `<ask>` tags for user input
- Template matching via keyword patterns
- Saves to `output/{deck_slug}/plan.yaml`

---

## The Change

### Problem Statement

Current planning workflows capture presentation intent in a single pass without deep content discovery. Users describe their presentation, the agent generates a slide breakdown, but there's no iterative brainstorming for:

- Story development per section
- Message refinement with options
- Visual asset ideation
- Research integration for supporting content

This leads to superficial plans that don't leverage the agent as a creative brainstorming partner.

### Proposed Solution

Enhance `/sb:plan-deck` with a **two-phase planning model**:

**Phase 1: Agenda Structure**
After collecting purpose/audience/key points, agent proposes a high-level agenda with 4-8 major sections. User selects/modifies agenda sections via Claude Code's `AskUserQuestion` multi-select UI. Each agenda section represents a narrative stage (not individual slides yet).

**Phase 2: Section-by-Section Deep Discovery**
For each agenda section, agent conducts structured discovery using `AskUserQuestion`:
1. **Key Message Options** - 3-4 message framings for the section (single-select)
2. **Supporting Content Types** - Stats, examples, quotes, case studies (multi-select)
3. **Visual Treatment Options** - Diagram types, visual metaphors, imagery themes (multi-select)

User can request web research on-demand for specific topics. Single round of refinement per section before advancing. Each section discovery produces rich context for eventual slide generation.

### Scope

**In Scope:**

- Modify `plan-deck/instructions.md` with two-phase planning flow
- Add agenda proposal step with multi-select section selection
- Add per-section discovery loop using `AskUserQuestion` tool
- Add visual asset ideation suggestions per section
- On-demand web research integration via WebSearch tool
- Enhanced plan.yaml schema with section-level context
- Apply consistent pattern to plan-one (lighter version)

**Out of Scope:**

- AI-generated images or mockups
- Automatic slide generation from agenda (still needs /sb:build-one)
- Third-party tool integrations (Figma, Canva)
- Persistent research database
- Collaborative multi-user planning
- Template catalog integration (separate epic)

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `.slide-builder/workflows/plan-deck/instructions.md` | MODIFY | Add Phase 1 (agenda) and Phase 2 (deep discovery) to workflow |
| `.slide-builder/workflows/plan-deck/workflow.yaml` | MODIFY | Add new variables for agenda and section discovery state |
| `.slide-builder/workflows/plan-one/instructions.md` | MODIFY | Add optional deep discovery for single slides |
| `.slide-builder/CONVENTIONS.md` | MODIFY | Document new planning patterns and AskUserQuestion usage |

### Technical Approach

**Phase 1 Implementation: Agenda Generation**

After step 2 (collect presentation context), insert new step 2.5:

```xml
<step n="2.5" goal="Generate and refine agenda structure">
  <action>Analyze purpose, audience, and key_points to propose 4-8 agenda sections</action>

  <action>Generate agenda_sections array where each section has:
    - id: unique identifier (agenda-1, agenda-2, etc.)
    - title: section name (e.g., "The Problem", "Our Solution", "Results")
    - narrative_role: opening | context | problem | solution | evidence | cta
    - estimated_slides: 1-3 slides per section
    - description: 1-sentence purpose
  </action>

  <action>Use AskUserQuestion tool with multiSelect: true to let user confirm sections:
    - Present each section as an option with description
    - User can select which to keep
    - User can add custom sections via "Other"
  </action>

  <action>Store confirmed sections as {{agenda_sections}}</action>
</step>
```

**Phase 2 Implementation: Section Discovery Loop**

After agenda confirmation, iterate through each section:

```xml
<step n="2.6" goal="Deep discovery for each agenda section" for-each="section in agenda_sections">

  <!-- Sub-step A: Key Message Discovery -->
  <action>Generate 3-4 key message options for {{section.title}}:
    - Option 1: Direct/assertive framing
    - Option 2: Question-based framing
    - Option 3: Story-based framing
    - Option 4: Data-driven framing
  </action>

  <action>Use AskUserQuestion tool to present message options (single-select)</action>
  <action>Store selection as {{section.key_message}}</action>

  <!-- Sub-step B: Supporting Content Discovery -->
  <action>Use AskUserQuestion tool with multiSelect: true for content types:
    - Statistics/data points
    - Customer quotes/testimonials
    - Case study examples
    - Industry benchmarks
    - Expert opinions
    - Visual demonstrations
  </action>
  <action>Store selections as {{section.content_types}}</action>

  <!-- Sub-step C: Visual Treatment Discovery -->
  <action>Use AskUserQuestion tool with multiSelect: true for visual options:
    - Diagram type: flowchart, comparison, timeline, hierarchy
    - Visual metaphor: journey, building, growth, transformation
    - Imagery theme: technology, people, nature, abstract
    - Icon style: outlined, filled, illustrated
  </action>
  <action>Store selections as {{section.visual_treatment}}</action>

  <!-- Sub-step D: Optional Research -->
  <action>Ask user if they need research for this section:
    "Would you like me to research any supporting data for {{section.title}}?"
  </action>
  <check if="user requests research">
    <action>Use WebSearch tool to find relevant statistics, examples, or quotes</action>
    <action>Present findings via AskUserQuestion for user to select which to include</action>
    <action>Store as {{section.research_findings}}</action>
  </check>

  <!-- Sub-step E: Section Refinement -->
  <action>Display section summary and ask for refinements</action>
  <check if="user provides refinements">
    <action>Update section properties</action>
  </check>

  <action>Mark section as complete, move to next</action>
</step>
```

**AskUserQuestion Integration Pattern**

The key technical change is using Claude Code's `AskUserQuestion` tool for structured discovery:

```javascript
// Example: Key message selection
{
  "questions": [{
    "question": "Which message framing resonates best for 'The Problem' section?",
    "header": "Key Message",
    "options": [
      {"label": "Direct Challenge", "description": "\"Most teams waste 40% of meeting time on slides\""},
      {"label": "Question Hook", "description": "\"What if your slides could build themselves?\""},
      {"label": "Story Setup", "description": "\"Last month, a SC spent 6 hours on one deck...\""},
      {"label": "Data Lead", "description": "\"73% of deals are won or lost at the presentation stage\""}
    ],
    "multiSelect": false
  }]
}
```

```javascript
// Example: Content type multi-select
{
  "questions": [{
    "question": "What supporting content should we include for 'Results' section?",
    "header": "Content Types",
    "options": [
      {"label": "Customer metrics", "description": "ROI numbers, time savings, efficiency gains"},
      {"label": "Testimonial quotes", "description": "Direct quotes from satisfied customers"},
      {"label": "Before/after comparison", "description": "Visual comparison of old vs new process"},
      {"label": "Industry benchmarks", "description": "How results compare to industry standards"}
    ],
    "multiSelect": true
  }]
}
```

### Existing Patterns to Follow

**Workflow XML Patterns (from plan-deck/instructions.md):**
- `<step n="N" goal="description">` for major steps
- `<action>` for instructions to execute
- `<ask>` for free-text user input (but we'll use AskUserQuestion for structured)
- `<check if="condition">` for conditional branching
- `<goto step="N">` for flow control
- `<output>` for displaying formatted text

**Variable Patterns:**
- Use `{{variable}}` for template substitution
- Store structured data in workflow variables
- Persist to plan.yaml at checkpoints

**Template Matching (existing):**
- Keywords map to layout templates
- Keep this pattern for slide-level decisions
- Agenda sections are higher-level than templates

### Integration Points

**Internal Integration:**
- `AskUserQuestion` tool - Claude Code's multi-select UI capability
- `WebSearch` tool - On-demand research for supporting content
- `plan.yaml` schema - Extended to include section-level context
- `status.yaml` - Track discovery progress per section

**State Flow:**
```
User Input → Agenda Proposal → Section Selection →
  For each section:
    Message Options → Content Types → Visual Treatment → (Research) → Refinement
→ Generate Slide Breakdown → Modification Loop → Save
```

---

## Development Context

### Relevant Existing Code

**Plan-deck Step 2 (context collection):**
```
.slide-builder/workflows/plan-deck/instructions.md:74-144
```
Currently collects: purpose, audience, key_points, desired_length
Insert agenda generation AFTER this step.

**Plan-deck Step 3 (narrative generation):**
```
.slide-builder/workflows/plan-deck/instructions.md:146-213
```
Currently generates storyline structure and slide breakdown in one shot.
MODIFY to use agenda sections as input, generate slides per section.

**Template Matching Rules:**
```
.slide-builder/workflows/plan-deck/instructions.md:162-176
```
Keep these patterns but apply at slide level, not agenda level.

**AskUserQuestion Tool Usage:**
The tool accepts this structure:
```json
{
  "questions": [{
    "question": "string (the question to ask)",
    "header": "string (short label, max 12 chars)",
    "options": [
      {"label": "string", "description": "string"}
    ],
    "multiSelect": boolean
  }]
}
```
- Maximum 4 questions per call
- Maximum 4 options per question
- User can always select "Other" for custom input

### Dependencies

**Framework/Libraries:**
- No new dependencies required
- Uses existing Claude Code tool infrastructure

**Internal Modules:**
- `.slide-builder/workflows/plan-deck/` - Primary modification target
- `.slide-builder/workflows/plan-one/` - Secondary modification
- `output/{deck-slug}/plan.yaml` - Extended schema

### Configuration Changes

None required - no external configuration files affected.

### Existing Conventions (Brownfield)

**Code Style:**
- XML workflow instructions with `<step>`, `<action>`, `<check>` tags
- YAML for data storage (plan.yaml, status.yaml)
- Markdown for output formatting in workflow instructions
- Variables use `{{double_braces}}`

**File Organization:**
- Each workflow has its own directory under `.slide-builder/workflows/`
- `workflow.yaml` for config, `instructions.md` for execution logic
- Output goes to `output/{deck-slug}/` directory

**Error Handling:**
- `<check if="condition">` for validation
- `<action>HALT</action>` for fatal errors
- Display helpful messages before halting

### Test Framework & Standards

No automated testing framework in place. Testing will be manual via workflow execution.

---

## Implementation Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | Latest LTS |
| Workflow Engine | BMAD XML Pattern | Custom |
| UI Integration | AskUserQuestion Tool | Claude Code native |
| Research | WebSearch Tool | Claude Code native |
| Data Format | YAML | 1.2 |
| Documentation | Markdown | CommonMark |

---

## Technical Details

### Enhanced plan.yaml Schema

```yaml
# Deck Metadata
deck_name: "{{deck_name}}"
created: "{{current_date}}"
last_modified: "{{current_timestamp}}"

# Audience Context
audience: "{{audience}}"
audience_knowledge_level: beginner | intermediate | expert
audience_priorities:
  - "{{priority_1}}"
  - "{{priority_2}}"

# Purpose & Outcome
purpose: "{{purpose}}"
desired_outcome: "{{desired_outcome}}"
key_message: "{{key_message}}"

# NEW: Agenda Structure (Phase 1 output)
agenda:
  total_sections: {{section_count}}
  sections:
    - id: "agenda-1"
      title: "{{section_title}}"
      narrative_role: "opening"
      estimated_slides: 1
      description: "{{section_description}}"

      # NEW: Deep Discovery Output (Phase 2)
      discovery:
        key_message: "{{selected_message}}"
        key_message_framing: "direct | question | story | data"
        content_types:
          - "statistics"
          - "testimonials"
        visual_treatment:
          diagram_type: "flowchart"
          visual_metaphor: "journey"
          imagery_theme: "technology"
          icon_style: "outlined"
        research_findings:
          - source: "{{url}}"
            content: "{{finding}}"
            selected: true

# Narrative Structure (enhanced with agenda)
storyline:
  opening_hook: "{{from agenda section with role=opening}}"
  tension: "{{from agenda section with role=problem}}"
  resolution: "{{from agenda section with role=solution}}"
  call_to_action: "{{from agenda section with role=cta}}"

# Slide Breakdown (generated from agenda sections)
slides:
  - number: 1
    intent: "{{slide_intent}}"
    template: "{{matched_template}}"
    status: pending
    storyline_role: "opening"

    # NEW: Link to agenda section
    agenda_section_id: "agenda-1"

    key_points:
      - "{{point_1}}"
    visual_guidance: "{{from section.visual_treatment}}"
    tone: "professional"
```

### Discovery Flow State Machine

```
INIT → CONTEXT_COLLECTION → AGENDA_GENERATION → AGENDA_SELECTION →
  ↓
  For each section (state = SECTION_DISCOVERY):
    MESSAGE_OPTIONS → CONTENT_SELECTION → VISUAL_TREATMENT →
    RESEARCH_OFFER → [RESEARCH_RESULTS] → SECTION_REFINEMENT → SECTION_COMPLETE
  ↓
→ SLIDE_GENERATION → MODIFICATION_LOOP → SAVE
```

### AskUserQuestion Patterns by Discovery Phase

**Agenda Selection (Phase 1):**
- Up to 4 questions (one per 2 sections if >8 sections)
- multiSelect: true
- Options: section title + description

**Message Options (Phase 2a):**
- 1 question per section
- multiSelect: false
- Options: 3-4 message framings

**Content Types (Phase 2b):**
- 1 question per section
- multiSelect: true
- Options: 4 content type categories

**Visual Treatment (Phase 2c):**
- Up to 2 questions per section
- multiSelect: true
- Options: diagram types, visual metaphors

**Research Results (Phase 2d, optional):**
- 1 question showing findings
- multiSelect: true
- Options: found data points to include

---

## Development Setup

```bash
# Navigate to project
cd /Users/vishalpatel/Documents/slide-builder

# No build step required - edit workflow files directly

# Test changes:
# 1. Edit .slide-builder/workflows/plan-deck/instructions.md
# 2. Run the workflow via Claude Code:
#    /sb:plan-deck
# 3. Observe multi-select prompts and verify flow
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch (if using git)
2. Open `.slide-builder/workflows/plan-deck/instructions.md` for editing
3. Review current Step 2 and Step 3 structure
4. Identify insertion points for new phases

### Implementation Steps

**Story 1: Agenda Structure Generation**
1. Add step 2.5 after context collection (line ~145)
2. Implement agenda proposal logic based on purpose/audience/key_points
3. Add AskUserQuestion call for section selection (multiSelect: true)
4. Store confirmed agenda in workflow variable
5. Test with sample presentation purpose

**Story 2: Section-by-Section Message Discovery**
1. Add step 2.6 with for-each loop over agenda sections
2. Implement key message option generation (3-4 framings)
3. Add AskUserQuestion call for message selection (multiSelect: false)
4. Store selection per section
5. Test iteration through multiple sections

**Story 3: Content & Visual Discovery**
1. Add content type selection (multiSelect: true)
2. Add visual treatment selection (multiSelect: true)
3. Implement on-demand research integration (WebSearch)
4. Add section refinement opportunity
5. Test full discovery loop

**Story 4: Integration & Schema Enhancement**
1. Update plan.yaml schema with agenda and discovery data
2. Modify slide generation to use section context
3. Update plan-one with lighter version of discovery
4. Update CONVENTIONS.md with new patterns
5. End-to-end testing

### Testing Strategy

**Manual Testing Checklist:**

1. **Phase 1 - Agenda Generation:**
   - [ ] Run `/sb:plan-deck` with sample purpose
   - [ ] Verify 4-8 sections proposed based on content
   - [ ] Verify multi-select UI appears for section selection
   - [ ] Verify custom sections can be added via "Other"
   - [ ] Verify selected sections stored correctly

2. **Phase 2 - Section Discovery:**
   - [ ] For each section, verify message options presented
   - [ ] Verify content type multi-select works
   - [ ] Verify visual treatment multi-select works
   - [ ] Test "request research" flow with WebSearch
   - [ ] Verify refinement opportunity per section

3. **Output Validation:**
   - [ ] Verify plan.yaml contains agenda structure
   - [ ] Verify discovery data captured per section
   - [ ] Verify slide breakdown references agenda sections
   - [ ] Verify existing modification loop still works

4. **Edge Cases:**
   - [ ] Test with minimal input (short purpose)
   - [ ] Test with verbose input (detailed requirements)
   - [ ] Test skipping all optional research
   - [ ] Test requesting research for every section

### Acceptance Criteria

**Story 1 - Agenda Structure:**
- [ ] After context collection, agent proposes 4-8 agenda sections
- [ ] Each section has: id, title, narrative_role, estimated_slides, description
- [ ] User can select/deselect sections via multi-select
- [ ] User can add custom sections via "Other" option
- [ ] Confirmed agenda stored for Phase 2

**Story 2 - Message Discovery:**
- [ ] For each section, 3-4 message framings presented
- [ ] Options include: direct, question, story, data framings
- [ ] Single-select UI (not multi-select) for message choice
- [ ] Selection stored in section.discovery.key_message

**Story 3 - Content & Visual Discovery:**
- [ ] Content type multi-select with 4 options
- [ ] Visual treatment multi-select with diagram/metaphor/imagery options
- [ ] On-demand research via WebSearch when requested
- [ ] Research results presented as selectable findings
- [ ] Single refinement opportunity before advancing

**Story 4 - Integration:**
- [ ] plan.yaml schema includes agenda and discovery data
- [ ] Slide generation uses section context
- [ ] CONVENTIONS.md documents new patterns
- [ ] plan-one has lighter discovery option

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `.slide-builder/workflows/plan-deck/instructions.md` | Primary modification target |
| `.slide-builder/workflows/plan-deck/workflow.yaml` | Workflow config (add variables) |
| `.slide-builder/workflows/plan-one/instructions.md` | Secondary target (lighter version) |
| `.slide-builder/CONVENTIONS.md` | Documentation update |
| `output/{deck-slug}/plan.yaml` | Enhanced schema output |

### Key Code Locations

| Section | Location |
|---------|----------|
| Context collection | plan-deck/instructions.md:74-144 |
| Narrative generation | plan-deck/instructions.md:146-213 |
| Template matching | plan-deck/instructions.md:162-176 |
| Modification loop | plan-deck/instructions.md:215-671 |
| Plan save | plan-deck/instructions.md:673-779 |

### Testing Locations

No automated tests. Manual testing via:
1. Run `/sb:plan-deck` in Claude Code
2. Observe workflow execution
3. Inspect `output/{deck-slug}/plan.yaml` output

### Documentation to Update

- `.slide-builder/CONVENTIONS.md` - Document agenda and discovery patterns
- Epics file if needed for story tracking

---

## UX/UI Considerations

### UI Components Affected

**New UI Interactions:**
- Multi-select agenda section picker (4-8 options)
- Single-select message framing picker (3-4 options per section)
- Multi-select content type picker (4 options)
- Multi-select visual treatment picker (4 options)
- Optional research confirmation prompt
- Research findings multi-select (variable options)

**Existing UI Modified:**
- Plan summary output (includes agenda overview)
- Modification loop commands (can edit sections)

### UX Flow

**Current Flow:**
1. User runs /sb:plan-deck
2. 4 sequential questions (purpose, audience, key points, length)
3. Agent generates full slide breakdown
4. User modifies via text commands
5. Save

**New Flow:**
1. User runs /sb:plan-deck
2. 4 sequential questions (purpose, audience, key points, length)
3. **NEW: Agent proposes agenda sections**
4. **NEW: User selects/modifies sections via multi-select**
5. **NEW: For each section:**
   - Message framing selection (single-select)
   - Content type selection (multi-select)
   - Visual treatment selection (multi-select)
   - Optional research trigger
   - Refinement opportunity
6. Agent generates slide breakdown from enriched sections
7. User modifies via text commands (same as before)
8. Save (with enhanced schema)

### Visual Design

All UI uses Claude Code's native `AskUserQuestion` tool:
- Chip/tag header labels (max 12 chars)
- Option cards with label + description
- Multi-select checkboxes where applicable
- "Other" always available for custom input

### Accessibility

- All interactions via text-based tool calls
- No custom UI components
- Standard Claude Code accessibility applies

---

## Testing Approach

### Manual Testing Protocol

**Pre-Testing:**
1. Ensure theme.json exists (run /sb:setup if needed)
2. Clear any existing plan.yaml in test deck folder

**Test Scenarios:**

| Scenario | Purpose | Expected Behavior |
|----------|---------|-------------------|
| Full flow | End-to-end | All phases execute, plan.yaml has full schema |
| Skip research | Happy path | Discovery completes without WebSearch |
| All research | Heavy research | WebSearch called for each section |
| Custom sections | User adds via Other | Custom section included in agenda |
| Minimal input | Edge case | Reasonable agenda proposed from brief purpose |

**Quality Verification:**
1. Open generated plan.yaml
2. Verify agenda section structure
3. Verify discovery data per section
4. Verify slide breakdown references sections
5. Run /sb:build-one to verify slides generate correctly

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main (if using git)
2. Changes take effect immediately (no build step)
3. Test with `/sb:plan-deck` command

### Rollback Plan

1. Revert changes to instructions.md files
2. Keep plan.yaml backward compatible (old files still work)

### Monitoring

No server-side monitoring needed - client-side Claude Code workflow.

**User Feedback Channels:**
- Direct user reports during session
- Workflow errors visible in Claude Code output
