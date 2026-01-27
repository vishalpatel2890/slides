# Product Design Skill

A comprehensive skill for designing and reviewing software products using industry-standard UX principles, usability heuristics, design systems, and accessibility guidelines.

## Overview

This skill helps Claude design user-centered software products and conduct thorough design reviews using established principles from:

- **Nielsen Norman Group**: 10 Usability Heuristics
- **Google Material Design**: Design system principles
- **Apple HIG**: Human Interface Guidelines
- **WCAG 2.1 AA**: Web accessibility standards
- **Industry Best Practices**: UI/UX patterns and design systems

## Skill Structure

```
product-design/
├── SKILL.md                                  # Main design framework and principles
├── README.md                                 # This file
├── references/                               # Detailed reference materials
│   ├── usability-heuristics-detailed.md     # Nielsen's heuristics deep-dive
│   ├── ui-patterns-library.md               # Common UI patterns
│   ├── accessibility-guidelines.md          # WCAG compliance guide
│   ├── design-systems.md                    # Design system best practices
│   └── interaction-design.md                # Micro-interactions and animations
├── examples/                                 # Example designs and reviews
│   ├── design-review-example.md             # Sample design review
│   └── component-examples.md                # UI component examples
└── templates/                                # Design templates
    ├── design-review-template.md            # Template for reviews
    └── component-spec-template.md           # Component documentation template
```

## How to Use

### Basic Usage

Ask Claude to help with product design:

```
"Design a user dashboard for this app"
"Review this design for usability issues"
"Create a design system for my product"
"Check this interface for accessibility compliance"
```

### Focused Reviews

Request specific types of analysis:

```
"Review this design using Nielsen's heuristics"
"Check this form design for best practices"
"Analyze the navigation patterns in this app"
"Audit this interface for WCAG 2.1 AA compliance"
```

### Design Creation

Ask Claude to create designs:

```
"Design an onboarding flow for new users"
"Create a mobile-first navigation system"
"Design a data table component with sorting and filtering"
"Propose a color system for my design system"
```

## Core Frameworks

### 1. Nielsen's 10 Usability Heuristics

The foundational principles for interaction design:

1. **Visibility of System Status** - Keep users informed
2. **Match Between System and Real World** - Use familiar concepts
3. **User Control and Freedom** - Support undo and redo
4. **Consistency and Standards** - Follow conventions
5. **Error Prevention** - Design to prevent problems
6. **Recognition Rather Than Recall** - Make options visible
7. **Flexibility and Efficiency** - Support expert users
8. **Aesthetic and Minimalist Design** - Remove clutter
9. **Help Users Recover from Errors** - Clear error messages
10. **Help and Documentation** - Provide when needed

### 2. Design Process

**Research → Define → Design → Test → Iterate**

- **Research**: User interviews, analytics, competitive analysis
- **Define**: User stories, personas, information architecture
- **Design**: Wireframes, mockups, prototypes
- **Test**: Usability testing, A/B testing, accessibility testing
- **Iterate**: Refine based on feedback and data

### 3. Visual Design Principles

- **Typography**: Clear hierarchy, readable sizes, consistent scale
- **Color**: Accessible contrast, semantic meaning, cohesive palette
- **Spacing**: 8-point grid, consistent rhythm, appropriate density
- **Layout**: Visual hierarchy, F/Z-patterns, responsive grids
- **Iconography**: Clear meaning, consistent style, appropriate size

### 4. Interaction Design

- **Navigation**: Clear paths, breadcrumbs, intuitive structure
- **Feedback**: Loading states, confirmations, error messages
- **Forms**: One column, inline validation, clear labels
- **Buttons**: Clear hierarchy (primary/secondary/tertiary)
- **Modals**: Purposeful use, easy dismissal, focus management

### 5. Accessibility (WCAG 2.1 AA)

- **Color Contrast**: 4.5:1 for text, 3:1 for UI components
- **Keyboard Navigation**: All functionality accessible
- **Screen Readers**: Semantic HTML, ARIA labels
- **Focus Management**: Visible indicators, logical tab order
- **Alternative Text**: Meaningful descriptions for images

### 6. Mobile-First Design

- **Touch Targets**: Minimum 44×44px
- **Responsive**: Mobile → Tablet → Desktop
- **Navigation**: Bottom nav, gestures, thumb-friendly
- **Performance**: Fast load, optimized images
- **Platform Conventions**: Follow iOS/Android guidelines

## Design Review Output

When conducting design reviews, the skill provides:

### Executive Summary
- Overall quality assessment
- Critical issues identified
- Key opportunities
- Estimated effort to fix

### Heuristics Review
For each of Nielsen's 10 heuristics:
- Pass/Fail/Needs Improvement status
- Specific issues found
- Recommendations with examples
- Priority level (Critical/High/Medium/Low)

### Visual Design Analysis
- Typography assessment
- Color system review
- Spacing consistency
- Visual hierarchy evaluation

### Accessibility Audit
- WCAG compliance status
- Specific violations
- Recommended fixes
- Testing tools to use

### Interaction Design Review
- Navigation patterns
- User flow analysis
- Feedback mechanisms
- Error handling

### Prioritized Recommendations
1. **Critical**: Blocking issues, accessibility violations
2. **High**: Major usability problems
3. **Medium**: Notable improvements
4. **Low**: Minor enhancements

## Key Design Principles

### User-Centered
- Solve real user problems
- Design based on research
- Test with actual users
- Iterate based on feedback

### Accessible
- WCAG 2.1 AA compliance minimum
- Keyboard navigation support
- Screen reader compatible
- Color blind friendly

### Consistent
- Follow established patterns
- Use design systems
- Maintain terminology
- Respect platform conventions

### Intuitive
- Minimal learning curve
- Clear visual hierarchy
- Recognition over recall
- Familiar mental models

### Efficient
- Reduce cognitive load
- Streamline workflows
- Support power users
- Minimize steps to goals

### Delightful
- Smooth animations
- Thoughtful micro-interactions
- Positive empty states
- Helpful error messages

## Common Design Patterns

### Navigation
- Top navigation (5-7 items)
- Side navigation (collapsible)
- Bottom navigation (mobile, 3-5 items)
- Tabs (horizontal content switching)
- Breadcrumbs (hierarchical path)

### Forms
- Single column layout
- Labels above inputs
- Real-time validation
- Clear error states
- Progress indicators (multi-step)

### Feedback
- Loading spinners
- Skeleton screens
- Toast notifications
- Success confirmations
- Error messages with solutions

### Data Display
- Tables (sortable, filterable)
- Cards (grid layouts)
- Lists (infinite scroll, pagination)
- Charts (clear, accessible)
- Empty states (helpful guidance)

## Design System Components

### Foundation
- Typography scale
- Color palette (primary, secondary, neutral, semantic)
- Spacing system (8pt grid)
- Elevation/shadows
- Border radius
- Icon library

### Components
- Buttons (primary, secondary, tertiary, danger)
- Inputs (text, select, checkbox, radio, toggle)
- Cards
- Modals/dialogs
- Navigation
- Alerts/notifications
- Badges
- Avatars
- Tables
- Lists
- Tooltips
- Breadcrumbs

## Best Practices

### Do's ✅
- Start with user research
- Design mobile-first
- Follow platform conventions
- Use established UI patterns
- Test with real users
- Prioritize accessibility
- Document design decisions
- Maintain design system
- Iterate based on data

### Don'ts ❌
- Design without research
- Ignore accessibility
- Reinvent common patterns
- Use color alone to communicate
- Create inconsistent experiences
- Skip usability testing
- Neglect error states
- Forget empty states
- Hide important actions

## Tools Recommended

### Design
- **Figma**: Collaborative design and prototyping
- **Sketch**: Mac-based design tool
- **Adobe XD**: Design and interactive prototypes
- **Framer**: Advanced prototyping and animation

### User Research
- **UserTesting**: Remote usability testing
- **Maze**: Prototype testing and analytics
- **Hotjar**: Heatmaps and session recordings
- **Optimal Workshop**: Card sorting, tree testing

### Accessibility
- **WebAIM Contrast Checker**: Color contrast
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Screen Readers**: NVDA, JAWS, VoiceOver

### Prototyping
- **InVision**: Interactive prototypes
- **Marvel**: Simple prototyping
- **ProtoPie**: Advanced interactions
- **Principle**: Animation and interaction

## Reference Design Systems

Study these for inspiration and best practices:

- **Material Design** (Google): Comprehensive, well-documented
- **Human Interface Guidelines** (Apple): iOS/macOS standards
- **Fluent** (Microsoft): Windows and web
- **Polaris** (Shopify): E-commerce focused
- **Carbon** (IBM): Enterprise applications
- **Ant Design** (Alibaba): Data-heavy interfaces
- **Atlassian Design System**: Collaboration tools
- **Lightning** (Salesforce): Enterprise CRM

## Expected Outcomes

### Design Quality
- **User Satisfaction**: Higher SUS scores (System Usability Scale)
- **Task Success**: Improved completion rates
- **Efficiency**: Reduced time-to-complete tasks
- **Error Reduction**: Fewer user mistakes
- **Learnability**: Faster onboarding

### Business Impact
- **Conversion Rates**: 20-400% improvement (depending on issues)
- **Support Costs**: Reduced due to clearer UI
- **Development Time**: Faster with design system
- **Consistency**: Better brand perception
- **Accessibility**: Broader audience reach

### Metrics to Track
- Task completion rate
- Time on task
- Error rate
- User satisfaction (SUS, NPS, CSAT)
- Accessibility compliance score
- Mobile vs. desktop usage
- Feature adoption rate

## When to Use This Skill

The skill activates when you:
- Design new features or products
- Review existing designs for improvements
- Conduct usability audits
- Establish design systems
- Ensure accessibility compliance
- Resolve UX issues
- Create design documentation
- Train team on design principles

## Learning Resources

### Books
- "Don't Make Me Think" - Steve Krug
- "The Design of Everyday Things" - Don Norman
- "Designing Interfaces" - Jenifer Tidwell
- "Refactoring UI" - Adam Wathan & Steve Schoger

### Websites
- Nielsen Norman Group (nngroup.com)
- Laws of UX (lawsofux.com)
- Material Design (material.io)
- A11y Project (a11yproject.com)

### Courses
- Interaction Design Foundation
- Google UX Design Certificate
- Nielsen Norman Group courses
- Coursera UX/UI programs

## License

This skill is part of the Claude Code Skills repository and follows the repository's license.

## Contributing

If you find issues or have suggestions for improving this skill, please contribute back to the skills repository.

---

**Created with Claude Code** ✨

**Based on**: Nielsen's Usability Heuristics, Material Design, Apple HIG, WCAG 2.1
