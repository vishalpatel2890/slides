# Feature Request: Visual Plan Editor for VS Code

**Date:** 2026-02-15
**Requester:** Engineering
**Priority:** High
**Type:** New Feature

---

## Problem Statement

When users create presentation decks with Slide Builder, they go through a detailed planning phase that produces a `plan.yaml` file. This file contains the deck structure, slide descriptions, narrative flow, and design specifications.

**Current Pain Points:**

1. **Poor Visibility** - Users must read raw YAML to understand their deck structure. No visual representation of the slide flow or section groupings.

2. **Difficult Editing** - Modifying a plan requires manually editing YAML syntax. Easy to break formatting, hard to reorder slides.

3. **No Feedback Loop** - Users don't know which template will be used or if their plan has structural issues until they run the build workflow.

4. **Context Switching** - Users bounce between the YAML file, the build workflow, and the output viewer. No unified interface.

---

## Proposed Solution

Build a **VS Code Custom Editor** that automatically opens when users access `plan.yaml` files. The editor provides:

- Visual grid view of all slides grouped by section
- Form-based editing panel for slide details
- Drag-and-drop reordering
- Real-time validation warnings
- Direct integration with build workflows
- **Claude Code integration** for AI-assisted editing alongside manual controls

### Hybrid Editing Model: Manual + AI

Users have **two complementary ways** to edit their plans:

| Mode | How It Works | Best For |
|------|--------------|----------|
| **Direct Manipulation** | Drag slides, edit forms, click buttons | Quick reordering, small text edits, template selection |
| **AI-Assisted** | Natural language commands via Claude Code panel | "Add 3 slides about security", "Rewrite slide 5 for executives", "Move the ROI section earlier" |

Both modes update the same `plan.yaml` file, and changes sync in real-time.

### User Experience Vision

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  VS Code                                                                      │
│  ┌────────────────────────────────────────────────────────┬─────────────────┐│
│  │  PLAN EDITOR (Custom Editor Tab)                       │  CLAUDE CODE    ││
│  │  ┌─────────────────────┬──────────────────────────────┐│  (Side Panel)   ││
│  │  │  SLIDE GRID         │  EDIT PANEL                  ││                 ││
│  │  │                     │                              ││  ┌───────────┐  ││
│  │  │  ┌───┐ ┌───┐ ┌───┐  │  Slide 3: Hook               ││  │ "Add a    │  ││
│  │  │  │ 1 │ │ 2 │ │ 3 │◄─│  Section: Opening            ││  │  slide    │  ││
│  │  │  └───┘ └───┘ └───┘  │                              ││  │  about    │  ││
│  │  │                     │  Description: [_________]    ││  │  ROI..."  │  ││
│  │  │  Section: Context   │  Template: callout (92%)     ││  └───────────┘  ││
│  │  │  ┌───┐ ┌───┐ ┌───┐  │  Tone: urgent                ││                 ││
│  │  │  │ 4 │ │ 5 │ │ 6 │  │                              ││  Claude adds    ││
│  │  │  └───┘ └───┘ └───┘  │  [Build] [Preview] [Delete]  ││  slide → grid   ││
│  │  │                     │                              ││  updates live   ││
│  │  │  [+ Add Slide]      │  [🤖 Edit with Claude]       ││                 ││
│  │  └─────────────────────┴──────────────────────────────┘│                 ││
│  └────────────────────────────────────────────────────────┴─────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
                                       ↕
                                 plan.yaml (single source of truth)
```

### Claude Code Integration Behavior

**Auto-Activation:** When the Plan Editor opens, Claude Code is automatically available in the side panel with plan context pre-loaded.

**Context Awareness:** Claude Code knows:
- Current deck structure (sections, slides, narrative arc)
- Selected slide (if any)
- Theme and template catalog
- Validation warnings

**Example Interactions:**

| User Says | Claude Does |
|-----------|-------------|
| "Add a slide about customer ROI after slide 7" | Inserts new slide, assigns to correct section, generates description |
| "Rewrite slide 3 to be more urgent" | Updates description and sets tone to "urgent" |
| "Split section 2 into two sections" | Creates new agenda section, redistributes slides |
| "The hook isn't strong enough" | Rewrites opening slides with stronger narrative |
| "Build slides 1-5" | Triggers build workflow for multiple slides |

**Sync Flow:**
```
User types in Claude Code panel
        ↓
Claude modifies plan.yaml
        ↓
Document change event fires
        ↓
Plan Editor re-renders grid
        ↓
User sees changes instantly
```

---

## User Stories

### Primary Personas
- **Content Creator**: Solutions Engineer building client presentations
- **Power User**: Someone creating multiple decks per week

### Stories

**US-1: Visual Plan Overview**
> As a content creator, I want to see my deck structure visually so I can understand the flow at a glance without reading YAML.

**US-2: Easy Slide Editing**
> As a content creator, I want to edit slide details through a form so I don't have to worry about YAML syntax.

**US-3: Drag-and-Drop Reordering**
> As a content creator, I want to reorder slides by dragging them so I can quickly restructure my presentation.

**US-4: Template Confidence**
> As a content creator, I want to see which template will be used for each slide before I build so I can adjust my description if needed.

**US-5: Validation Feedback**
> As a content creator, I want to see warnings about structural issues (missing CTA, empty sections) so I can fix problems before building.

**US-6: Build from UI**
> As a content creator, I want to build individual slides directly from the editor so I don't have to switch to the terminal.

**US-7: Undo Support**
> As a content creator, I want to undo my changes with Cmd+Z so I can experiment without fear.

**US-8: AI-Assisted Editing**
> As a content creator, I want to use natural language to make complex changes (like "add 3 slides about security") so I don't have to do repetitive manual work.

**US-9: Claude Context Awareness**
> As a content creator, I want Claude to understand my current deck structure and selected slide so its suggestions are contextually relevant.

**US-10: Hybrid Workflow**
> As a power user, I want to switch seamlessly between direct manipulation (drag-drop, forms) and AI commands so I can use the best tool for each task.

---

## Key Features

### Must Have (MVP)

| Feature | Description |
|---------|-------------|
| Visual slide grid | Cards showing slide number, title snippet, status (pending/built) |
| Section grouping | Slides grouped under collapsible section headers |
| Edit panel | Form fields for description, template, tone, background mode |
| Two-way sync | Edits in UI update YAML; external YAML edits refresh UI |
| Undo/redo | Native VS Code undo support via `applyEdit()` API |
| Drag-and-drop | Reorder slides within and across sections |
| Add/delete slides | Insert new slides, remove existing ones |
| Template selector | Dropdown showing matched template with confidence score |
| Validation warnings | Inline warnings for structural issues |
| Build button | Trigger build-one workflow for selected slide |
| Claude Code side panel | AI assistant panel opens automatically with plan context |
| "Edit with Claude" button | Quick action to focus Claude on selected slide |
| Context injection | Pass deck structure, selection, and theme to Claude session |

### Nice to Have (Future)

| Feature | Description |
|---------|-------------|
| Slide thumbnail preview | Mini visual preview of what slide will look like |
| Bulk operations | Select multiple slides for batch actions |
| Section editing | Edit section-level metadata (goals, discovery) |
| Export button | Trigger export to Google Slides |
| Keyboard shortcuts | Navigate and edit entirely via keyboard |
| Dark/light theme | Match VS Code theme automatically |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Adoption | 80% of plan edits use visual editor | Track file open events |
| Edit efficiency | 50% reduction in time to modify plans | User feedback / time studies |
| Error reduction | 90% fewer YAML syntax errors | Count parse failures before/after |
| Build confidence | Users report knowing what to expect | Survey / NPS |
| AI utilization | 40% of edits use Claude Code | Track AI vs manual edit ratio |
| Hybrid workflow | Users switch between modes naturally | Session recordings / feedback |

---

## Technical Context

### Why VS Code Extension?

| Alternative | Why Not |
|-------------|---------|
| Separate Electron app | Extra install, no VS Code integration, duplicate undo/redo logic |
| Web app | Requires server, file sync complexity, breaks local-first model |
| VS Code Webview Panel | Must be manually triggered, separate from file editing |

**VS Code Custom Editor** provides:
- Automatic opening for `plan.yaml` files
- Native undo/redo via VS Code's document model
- Seamless integration with existing workflow
- No additional installation for users already in VS Code

### Key Technical Decisions (for PRD context)

1. **React for UI** - Familiar framework, large ecosystem, good for complex forms
2. **`yaml` library** - Preserves formatting/comments when editing programmatically
3. **@dnd-kit** - Accessible drag-and-drop library with good React integration
4. **CustomTextEditorProvider** - VS Code API that hooks into text document lifecycle

### Integration Points

- Reads `.slide-builder/config/catalog/slide-templates.json` for template matching
- Reads `.slide-builder/config/theme.json` for design context
- Writes to `output/{deck}/plan.yaml`
- Triggers Claude Code workflows via terminal commands

### Claude Code Integration Architecture

**How AI + Manual Editing Coexist:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         plan.yaml                                │
│                    (Single Source of Truth)                      │
└─────────────────────────────────────────────────────────────────┘
                    ▲                           ▲
                    │                           │
         ┌──────────┴──────────┐     ┌─────────┴─────────┐
         │   Plan Editor       │     │   Claude Code     │
         │   (Direct Edits)    │     │   (AI Edits)      │
         │                     │     │                   │
         │  - Drag-drop        │     │  - Natural lang   │
         │  - Form fields      │     │  - Bulk changes   │
         │  - Click actions    │     │  - Smart rewrites │
         └─────────────────────┘     └───────────────────┘
                    │                           │
                    └───────────┬───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  VS Code Document     │
                    │  Change Events        │
                    │  (Sync both ways)     │
                    └───────────────────────┘
```

**Context Injection:** When Plan Editor opens, it can:
1. Auto-open Claude Code in secondary side panel
2. Pre-inject context via system prompt or CLAUDE.md
3. Pass current selection state via messages

**Implementation Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **Side-by-side panels** | Both visible simultaneously | Screen real estate |
| **Toggle button** | Claude appears on demand | Extra click |
| **Inline chat** | Context-aware per slide | More complex UI |

**Recommended:** Side-by-side with auto-activation. Claude Code opens in right panel when Plan Editor opens. Context is automatically injected.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex YAML editing loses formatting | Medium | Use `yaml` library with position-aware parsing |
| Performance with large plans (50+ slides) | Low | Virtualize slide grid if needed |
| Sync conflicts with external edits | Medium | Debounce updates, show conflict indicator |
| Users expect more than MVP | Low | Clear communication of scope; fast iteration |

---

## Open Questions for PM

1. **Scope boundary**: Should editing deck metadata (name, audience, purpose) be included, or just slides?

2. **Section editing**: Should users be able to add/remove/reorder agenda sections, or is that a planning workflow concern?

3. **Preview fidelity**: How much visual preview is needed? Text description of layout vs. actual thumbnail rendering?

4. **Offline-first**: Any concerns about the fully local architecture? (No cloud sync, no collaboration)

5. **Discoverability**: How do users learn the extension exists? Auto-prompt on first `plan.yaml` open?

6. **Claude Code activation**: Should the AI panel open automatically when Plan Editor opens, or require explicit action?

7. **Context depth**: How much context should Claude receive? Just current deck, or also theme, templates, and past decks?

8. **AI edit attribution**: Should AI-made edits be visually distinguished from manual edits? (e.g., "Modified by Claude" indicator)

9. **Conflict resolution**: If user is typing in a form field while Claude is editing the same slide, how do we handle conflicts?

10. **Cost visibility**: Should users see token usage when Claude makes edits to their plan?

---

## References

- [VS Code Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Internal: Planning Process Analysis](../feature-requests/planning-improvements-analysis.md)
- [Competitive: Gamma.app planning flow](https://gamma.app)
- [Competitive: Beautiful.ai Smart Slides](https://beautiful.ai)

---

## Appendix: Competitive Landscape

| Tool | Planning Approach | Visual Editor | AI Editing | Strengths |
|------|-------------------|---------------|------------|-----------|
| Gamma | AI generates outline → user refines | Yes, drag-drop | Generate only | Fast first draft |
| Beautiful.ai | Template-first, AI fills content | Yes, Smart Slides | Design only | Design automation |
| Pitch | Collaborative deck building | Yes, multiplayer | Limited | Real-time collab |
| Tome | AI-first generation | Yes | Generate + edit | End-to-end AI |
| Slide Builder (current) | YAML-based planning | No | Via Claude Code | Deep customization |
| **Slide Builder (proposed)** | YAML + Visual + AI | Yes | Full integration | **Manual + AI hybrid** |

### Differentiator: Hybrid Editing

Most tools force a choice: either AI generates everything (Gamma, Tome) or you do everything manually (traditional tools).

**Slide Builder's proposed approach is unique:**
- Direct manipulation for quick, precise edits
- AI assistance for complex, bulk, or creative changes
- Both operating on the same document, in real-time
- User stays in control, AI augments capability
