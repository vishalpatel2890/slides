---
name: product-design
description: Design and review software products using industry-standard UX principles, usability heuristics, design systems, and accessibility guidelines with actionable recommendations
---

# Product Design Skill

Perform comprehensive design reviews and create user-centered software product designs using established principles from Nielsen Norman Group, Material Design, Apple HIG, and WCAG accessibility standards.

## Design Philosophy

Great product design is:
- **User-Centered**: Solves real user problems and needs
- **Accessible**: Usable by everyone, including people with disabilities
- **Consistent**: Follows established patterns and conventions
- **Intuitive**: Requires minimal learning curve
- **Delightful**: Provides positive emotional experiences
- **Purposeful**: Every element serves a clear function

## When to Use This Skill

Activate this skill when:
- Designing a new software product or feature
- Reviewing existing product designs for improvements
- Conducting usability audits
- Creating design systems or component libraries
- Ensuring accessibility compliance
- Resolving user experience issues
- Establishing design patterns and guidelines

## Core Design Principles

### Nielsen's 10 Usability Heuristics

Based on Jakob Nielsen's foundational principles for interaction design:

#### 1. Visibility of System Status
**Principle**: Keep users informed about what's happening through appropriate feedback within a reasonable time.

**Examples**:
- Loading indicators for async operations
- Progress bars for multi-step processes
- Success/error messages after actions
- Real-time validation in forms
- Status badges (online/offline, active/inactive)

**Bad**: Silent operations, no feedback on user actions
**Good**: Clear feedback, loading states, confirmation messages

---

#### 2. Match Between System and Real World
**Principle**: Use familiar concepts, words, and phrases rather than system-oriented terms.

**Examples**:
- "Trash" or "Recycle Bin" instead of "Delete Buffer"
- Calendar interfaces that resemble physical calendars
- Shopping cart metaphor in e-commerce
- Folder hierarchies for file organization

**Bad**: Technical jargon, unfamiliar metaphors
**Good**: User's language, familiar mental models

---

#### 3. User Control and Freedom
**Principle**: Provide clear exits for mistaken actions. Support undo and redo.

**Examples**:
- Undo/Redo functionality
- Cancel buttons in dialogs
- "Exit" or "Close" options clearly visible
- Breadcrumbs for navigation
- Confirmation dialogs for destructive actions

**Bad**: No way to reverse actions, trapped workflows
**Good**: Easy escape routes, undo support, clear exits

---

#### 4. Consistency and Standards
**Principle**: Follow platform conventions and internal consistency.

**Examples**:
- Same patterns for similar actions throughout app
- Platform-standard icons (hamburger menu, search icon)
- Consistent button styles and placements
- Uniform terminology (don't alternate between "delete" and "remove")

**Bad**: Different patterns for same actions, inconsistent terminology
**Good**: Predictable patterns, platform conventions followed

---

#### 5. Error Prevention
**Principle**: Design to prevent errors before they occur.

**Examples**:
- Disable submit buttons until form is valid
- Confirmation dialogs for destructive actions ("Are you sure you want to delete?")
- Input constraints (date pickers instead of free text)
- Real-time validation with helpful hints
- Guard rails (character limits, file type restrictions)

**Bad**: Easy to make errors, no safeguards
**Good**: Constraints prevent errors, confirmations for risky actions

---

#### 6. Recognition Rather Than Recall
**Principle**: Minimize memory load by making options and information visible.

**Examples**:
- Recent items lists
- Autocomplete suggestions
- Visible menu options vs. hidden commands
- Tooltips on hover
- Breadcrumbs showing current location

**Bad**: Hidden options, requires remembering commands
**Good**: Visible options, recognition-based interface

---

#### 7. Flexibility and Efficiency of Use
**Principle**: Provide accelerators for expert users while keeping interface simple for novices.

**Examples**:
- Keyboard shortcuts (Ctrl+S to save)
- Bulk actions
- Customizable dashboards
- Templates and presets
- Frequent actions shortcuts

**Bad**: Same rigid workflow for all users
**Good**: Multiple paths to complete tasks, shortcuts for power users

---

#### 8. Aesthetic and Minimalist Design
**Principle**: Don't clutter the interface with irrelevant information.

**Examples**:
- Progressive disclosure (show details on demand)
- Clean layouts with whitespace
- Hide advanced options behind "Advanced" toggle
- Prioritize primary actions
- Remove decorative elements that don't serve purpose

**Bad**: Cluttered interfaces, information overload
**Good**: Clean, focused, essential information only

---

#### 9. Help Users Recognize, Diagnose, and Recover from Errors
**Principle**: Error messages should be clear, helpful, and solution-oriented.

**Examples**:
- Plain language error messages (not error codes)
- Suggestions for fixing the problem
- Highlight problematic fields in forms
- Actionable error messages
- Links to help resources

**Bad**: "Error 500", cryptic technical messages
**Good**: "We couldn't save your changes. Please check your internet connection and try again."

---

#### 10. Help and Documentation
**Principle**: Provide accessible help when needed, but design so help isn't necessary.

**Examples**:
- Contextual help icons
- Onboarding flows
- Searchable help centers
- Tooltips and inline guidance
- Video tutorials
- Empty states with guidance

**Bad**: No help available, or help is hard to find
**Good**: Contextual help, self-documenting interface

---

## Design Process

### 1. Research & Discovery

**User Research Methods**:
- User interviews
- Surveys and questionnaires
- Analytics analysis
- Competitive analysis
- User personas
- Journey mapping
- Jobs to be Done framework

**Questions to Answer**:
- Who are the users?
- What problems are they trying to solve?
- What are their goals and motivations?
- What's the context of use?
- What are current pain points?

---

### 2. Define & Ideate

**Activities**:
- Define problem statements
- Create user flows
- Sketch lo-fi wireframes
- Brainstorm solutions
- Prioritize features (MoSCoW, RICE)

**Outputs**:
- User stories
- Feature requirements
- Information architecture
- Wireframes

---

### 3. Design & Prototype

**Design System Components**:
- Typography scale
- Color palette
- Spacing system
- Component library
- Icon set
- Interaction patterns

**Prototype Fidelity**:
- Lo-fi: Paper sketches, wireframes
- Mid-fi: Grayscale mockups
- Hi-fi: Full visual design
- Interactive: Clickable prototypes

---

### 4. Test & Iterate

**Testing Methods**:
- Usability testing (moderated & unmoderated)
- A/B testing
- Accessibility testing
- Performance testing
- Heuristic evaluation

**Metrics to Track**:
- Task completion rate
- Time on task
- Error rate
- User satisfaction (SUS, NPS)
- Accessibility compliance

---

## Design Review Framework

When reviewing a product design, structure the analysis as:

```markdown
## Executive Summary
[Overview: key findings, critical issues, overall assessment]

## Usability Heuristics Review

### [Heuristic Name]
- **Assessment**: Pass/Fail/Needs Improvement
- **Issues Found**: [List of specific issues]
- **Recommendations**: [Actionable fixes]
- **Priority**: High/Medium/Low

## Visual Design Review
- Typography
- Color system
- Spacing and layout
- Visual hierarchy
- Iconography

## Interaction Design Review
- Navigation patterns
- User flows
- Micro-interactions
- Feedback mechanisms
- Error handling

## Accessibility Review (WCAG 2.1 AA)
- Color contrast
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Alternative text

## Mobile Experience
- Touch targets
- Responsive behavior
- Mobile-specific patterns
- Performance

## Design System Consistency
- Component usage
- Pattern consistency
- Terminology consistency

## Recommendations Summary
[Prioritized list of improvements with expected impact]
```

---

## Visual Design Principles

### Typography

**Best Practices**:
- **Type Scale**: Use consistent scale (e.g., 12, 14, 16, 20, 24, 32, 48, 64)
- **Line Height**: 1.4-1.6 for body text, 1.2-1.3 for headings
- **Font Limit**: Maximum 2-3 font families
- **Hierarchy**: Clear distinction between heading levels
- **Readability**: Minimum 16px for body text on mobile

**Recommended Pairings**:
- Inter + Roboto Mono (clean, modern)
- SF Pro + SF Mono (Apple ecosystem)
- Roboto + Roboto Condensed (Material Design)

---

### Color System

**Structure**:
- **Primary**: Brand color, main actions
- **Secondary**: Supporting color, accents
- **Neutral**: Grays for text, borders, backgrounds
- **Semantic**: Success (green), Warning (yellow), Error (red), Info (blue)

**Accessibility**:
- Minimum 4.5:1 contrast for normal text
- Minimum 3:1 contrast for large text and UI components
- Don't rely on color alone to convey information

**Color Palette Template**:
```
Primary:
- 50, 100, 200, 300, 400, 500 (base), 600, 700, 800, 900

Neutral:
- White, Gray-50, Gray-100... Gray-900, Black

Semantic:
- Success: Green-500
- Warning: Yellow-500
- Error: Red-500
- Info: Blue-500
```

---

### Spacing System

**8-Point Grid**:
- Base unit: 8px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- Consistent spacing creates rhythm
- Exceptions: 4px for tight spacing, icons

**Application**:
- Padding within components: 8px, 16px
- Margins between components: 16px, 24px, 32px
- Section spacing: 48px, 64px, 96px

---

## Interaction Design Patterns

### Navigation Patterns

**Primary Navigation**:
- **Top Nav**: Horizontal, 5-7 items max
- **Side Nav**: Vertical, collapsible, good for many items
- **Bottom Nav**: Mobile, 3-5 items (thumb-friendly)
- **Hamburger Menu**: Use sparingly, hides options

**Secondary Navigation**:
- Tabs (horizontal switching)
- Breadcrumbs (hierarchical path)
- Pagination
- Infinite scroll (with caution)

---

### Form Design

**Best Practices**:
- **One Column Layout**: Easier to complete
- **Label Position**: Above input (better for mobile)
- **Field Length**: Matches expected input
- **Help Text**: Inline, contextual
- **Validation**: Real-time, helpful messages
- **Error States**: Clear highlighting, actionable guidance

**Required Fields**:
- Mark with asterisk (*) or "Required" label
- Explain why information is needed
- Minimize required fields

---

### Button Design

**Hierarchy**:
- **Primary**: One per screen, main action (filled, high contrast)
- **Secondary**: Alternative actions (outlined or ghost)
- **Tertiary**: Low-priority actions (text only)

**States**:
- Default
- Hover (slight color change)
- Active/Pressed (deeper color)
- Disabled (reduced opacity, no cursor)
- Loading (spinner or progress)

**Size & Spacing**:
- Minimum 44×44px touch target (mobile)
- Desktop: 32-40px height typical
- Padding: 12-16px horizontal
- Spacing: 8-16px between buttons

---

### Modal & Dialog Patterns

**When to Use**:
- Critical decisions (destructive actions)
- Focus attention on single task
- Quick input without leaving page

**Best Practices**:
- **Backdrop**: Dim background (overlay)
- **Escape**: ESC key closes, click outside closes
- **Focus**: Trap focus within modal
- **Actions**: Clear primary and secondary actions
- **Size**: Don't make too large, use side panels for complex forms

---

### Loading States

**Progressive Disclosure**:
- Skeleton screens (show layout structure)
- Loading spinners (for shorter waits)
- Progress bars (for longer operations with known duration)
- Optimistic UI (show result immediately, handle failures)

**Best Practices**:
- Show feedback within 100ms
- Indicate progress for operations > 2 seconds
- Provide time estimates for long operations
- Allow cancellation of long operations

---

## Mobile-First Design

### Touch Targets

**Minimum Sizes**:
- iOS: 44×44pt
- Android: 48×48dp
- Web: 44×44px minimum

**Spacing**:
- Minimum 8px between touch targets
- Primary actions in thumb-friendly zones
- Critical actions away from accidental touches

---

### Mobile Navigation

**Patterns**:
- **Bottom Navigation**: 3-5 primary sections (most thumb-friendly)
- **Tab Bar**: Content switching within a section
- **Hamburger**: Use for secondary nav, not primary
- **Gesture**: Swipe navigation (when appropriate)

**Mobile-Specific Considerations**:
- Portrait AND landscape orientations
- Different screen sizes (phone, tablet)
- Reachability (one-handed use)
- Platform conventions (iOS vs. Android)

---

### Responsive Design

**Breakpoints** (common):
```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
Large Desktop: > 1440px
```

**Approach**:
- Mobile-first CSS
- Flexible grids
- Fluid images
- Media queries for breakpoints

---

## Accessibility (WCAG 2.1 AA)

### Visual Accessibility

**Color Contrast**:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum
- Don't use color alone to convey meaning

**Typography**:
- Minimum 16px body text
- Allow text resizing up to 200%
- Sufficient line height (1.5+)
- Avoid all-caps for long text

---

### Keyboard Accessibility

**Requirements**:
- All functionality accessible via keyboard
- Visible focus indicators
- Logical tab order
- Skip links to main content
- No keyboard traps

**Common Patterns**:
- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter/Space: Activate buttons/links
- Escape: Close modals/menus
- Arrow keys: Navigate within components

---

### Screen Reader Support

**Semantic HTML**:
- Use proper heading hierarchy (H1 → H6)
- Meaningful link text (not "click here")
- Alt text for images
- Labels for form inputs
- ARIA landmarks (header, nav, main, footer)

**ARIA Attributes**:
- `aria-label`: Accessible name
- `aria-labelledby`: Reference to label
- `aria-describedby`: Additional description
- `aria-live`: Announce dynamic changes
- `role`: Define element purpose

---

## Design Systems

### Core Components

**Foundation**:
- Typography scale
- Color palette
- Spacing system
- Elevation/shadow system
- Border radius scale
- Icon library

**Common Components**:
- Buttons (primary, secondary, tertiary)
- Form inputs (text, select, checkbox, radio, toggle)
- Cards
- Modals/dialogs
- Tooltips
- Navigation (top nav, side nav, tabs)
- Alerts/notifications
- Badges
- Avatars
- Tables
- Lists

---

### Documentation

**Each Component Should Include**:
- When to use
- Variants and states
- Sizing options
- Code examples
- Accessibility notes
- Do's and don'ts
- Related components

**Example Structure**:
```markdown
# Button Component

## When to Use
Use buttons for important actions users need to take.

## Variants
- Primary: Main call-to-action (one per screen)
- Secondary: Alternative actions
- Tertiary: Low-priority actions
- Danger: Destructive actions

## States
- Default
- Hover
- Active
- Disabled
- Loading

## Accessibility
- Minimum 44×44px touch target
- Visible focus indicator
- Disabled state communicated to screen readers

## Code Example
[...]
```

---

## Common UI Patterns

### Empty States

**Purpose**: Guide users when no content exists yet

**Elements**:
- Illustration or icon
- Descriptive headline
- Helpful explanation
- Clear call-to-action
- (Optional) Example content

**Example**:
```
[Icon of inbox]
No messages yet
When someone sends you a message, it will appear here.
[Compose Message Button]
```

---

### Error States

**Types**:
- **Form Validation**: Field-level errors with guidance
- **Page-Level Errors**: 404, 500, connection errors
- **Empty Results**: Search/filter returns nothing
- **Permission Denied**: Access restrictions

**Best Practices**:
- Explain what happened (clearly)
- Explain why it happened (if helpful)
- Suggest how to fix it (actionable)
- Provide alternative paths
- Use friendly, human language

---

### Onboarding

**Patterns**:
- **Product Tour**: Step-by-step introduction
- **Empty State Guidance**: Prompts in empty sections
- **Progressive Onboarding**: Introduce features when relevant
- **Tooltips**: Contextual help on demand

**Best Practices**:
- Allow skipping
- Keep it short (3-5 steps max)
- Show value quickly
- Make it optional after first view
- Provide help access later

---

## Reference Files

For detailed guidance, consult the reference files:

- `references/usability-heuristics-detailed.md` - Deep dive into Nielsen's heuristics
- `references/ui-patterns-library.md` - Common UI patterns with examples
- `references/accessibility-guidelines.md` - WCAG compliance checklist
- `references/design-systems.md` - Building and maintaining design systems
- `references/interaction-design.md` - Micro-interactions and animations

Use Grep to search for specific topics when needed.

---

## Output Structure

When conducting a design review, organize findings as:

### Executive Summary
- Overall quality assessment
- Critical issues count
- Key opportunities
- Estimated effort to address

### Usability Heuristics (10 categories)
For each heuristic:
- Pass/Fail/Needs Improvement
- Specific issues found
- Priority level
- Recommended fixes

### Visual Design
- Typography issues
- Color system problems
- Spacing inconsistencies
- Visual hierarchy concerns

### Accessibility
- WCAG violations
- Keyboard navigation issues
- Screen reader problems
- Color contrast failures

### Interaction Design
- Navigation confusions
- Form usability issues
- Feedback mechanism gaps
- Error handling problems

### Mobile Experience
- Touch target sizes
- Responsive behavior
- Mobile-specific patterns

### Prioritized Recommendations
1. **Critical** (blocking issues, accessibility violations)
2. **High** (major usability problems)
3. **Medium** (notable improvements)
4. **Low** (minor enhancements)

---

## Design Checklist

### Usability
- [ ] Visibility of system status (loading, feedback)
- [ ] Familiar language and concepts
- [ ] User control (undo, cancel, exit)
- [ ] Consistency throughout product
- [ ] Error prevention mechanisms
- [ ] Recognition over recall
- [ ] Shortcuts for power users
- [ ] Minimal, focused design
- [ ] Clear, helpful error messages
- [ ] Accessible help when needed

### Visual Design
- [ ] Clear visual hierarchy
- [ ] Consistent typography
- [ ] Accessible color contrast
- [ ] Appropriate spacing (8pt grid)
- [ ] Cohesive color palette
- [ ] Professional iconography
- [ ] Proper use of whitespace

### Interaction
- [ ] Intuitive navigation
- [ ] Clear feedback for all actions
- [ ] Appropriate loading states
- [ ] Well-designed forms
- [ ] Proper button hierarchy
- [ ] Smooth transitions/animations
- [ ] Proper modal usage

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Alternative text for images
- [ ] Proper heading hierarchy
- [ ] Focus indicators visible

### Mobile
- [ ] Touch targets 44×44px minimum
- [ ] Responsive at all breakpoints
- [ ] Mobile-friendly navigation
- [ ] Legible text without zooming
- [ ] Appropriate input types
- [ ] One-handed reachability considered

### Consistency
- [ ] Design system followed
- [ ] Patterns used consistently
- [ ] Terminology consistent
- [ ] Platform conventions respected

---

## Tools & Resources

### Design Tools
- **Figma**: Collaborative design, prototyping
- **Sketch**: Mac-based design tool
- **Adobe XD**: Design and prototyping
- **Framer**: Interactive prototyping
- **Principle**: Animation and interaction

### Accessibility Tools
- **WebAIM Contrast Checker**: Color contrast
- **axe DevTools**: Accessibility testing
- **WAVE**: Web accessibility evaluation
- **Screen Readers**: NVDA, JAWS, VoiceOver

### User Research
- **UserTesting**: Remote usability testing
- **Hotjar**: Heatmaps, session recordings
- **Maze**: Prototype testing
- **Optimal Workshop**: Card sorting, tree testing

### Design Systems
- **Material Design** (Google)
- **Human Interface Guidelines** (Apple)
- **Fluent** (Microsoft)
- **Polaris** (Shopify)
- **Carbon** (IBM)

---

## Best Practices

- **Start with research**: Understand users before designing
- **Design mobile-first**: Easier to scale up than down
- **Test early and often**: Get feedback on low-fidelity prototypes
- **Follow established patterns**: Don't reinvent common UI
- **Prioritize accessibility**: Design for everyone from the start
- **Document decisions**: Maintain design system documentation
- **Iterate based on data**: Use analytics and testing to improve
- **Collaborate cross-functionally**: Work closely with engineering and product

## Design Principles Summary

1. **User-Centered**: Design for real user needs
2. **Accessible**: Ensure everyone can use your product
3. **Consistent**: Follow patterns and conventions
4. **Clear**: Provide obvious paths and feedback
5. **Efficient**: Respect user's time and effort
6. **Delightful**: Create positive experiences
7. **Purposeful**: Every element serves a function
8. **Iterative**: Continuously improve based on feedback
