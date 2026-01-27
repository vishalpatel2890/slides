# Design Systems Guide

A comprehensive guide to building and maintaining design systems that scale.

## What is a Design System?

A design system is a collection of reusable components, guided by clear standards, that can be assembled to build any number of applications.

**Components**:
- **Design Tokens**: Foundational variables (colors, spacing, typography)
- **UI Components**: Reusable interface elements
- **Patterns**: Common solutions to recurring problems
- **Guidelines**: Rules for when and how to use components
- **Documentation**: How to implement and maintain the system

---

## Foundation: Design Tokens

Design tokens are the atomic design decisions that define your visual language.

### Color System

#### Primary Palette

```css
/* Base colors */
--color-primary-50: #E3F2FD;
--color-primary-100: #BBDEFB;
--color-primary-200: #90CAF9;
--color-primary-300: #64B5F6;
--color-primary-400: #42A5F5;
--color-primary-500: #2196F3; /* Base */
--color-primary-600: #1E88E5;
--color-primary-700: #1976D2;
--color-primary-800: #1565C0;
--color-primary-900: #0D47A1;
```

**Usage**:
- 500: Default brand color
- 600-900: Hover, active states, emphasis
- 100-400: Backgrounds, subtle elements

#### Semantic Colors

```css
/* Success */
--color-success: #4CAF50;
--color-success-bg: #E8F5E9;
--color-success-border: #81C784;

/* Error */
--color-error: #F44336;
--color-error-bg: #FFEBEE;
--color-error-border: #E57373;

/* Warning */
--color-warning: #FF9800;
--color-warning-bg: #FFF3E0;
--color-warning-border: #FFB74D;

/* Info */
--color-info: #2196F3;
--color-info-bg: #E3F2FD;
--color-info-border: #64B5F6;
```

#### Neutral Palette

```css
/* Grays */
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;
--color-gray-900: #212121;

/* Text colors */
--color-text-primary: var(--color-gray-900);
--color-text-secondary: var(--color-gray-700);
--color-text-disabled: var(--color-gray-400);
--color-text-inverse: #FFFFFF;
```

### Typography Scale

#### Type Scale (1.250 - Major Third)

```css
/* Font sizes */
--font-size-xs: 0.64rem;   /* 10.24px */
--font-size-sm: 0.8rem;    /* 12.8px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.25rem;   /* 20px */
--font-size-xl: 1.563rem;  /* 25px */
--font-size-2xl: 1.953rem; /* 31.25px */
--font-size-3xl: 2.441rem; /* 39.06px */
--font-size-4xl: 3.052rem; /* 48.83px */

/* Line heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Font families */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'Fira Code', 'Courier New', monospace;
```

#### Typography Components

```css
/* Headings */
h1, .text-h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: 1rem;
}

h2, .text-h2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

/* Body text */
.text-body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

.text-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

/* Labels */
.text-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Spacing System (8-Point Grid)

```css
/* Base unit: 8px */
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.5rem;   /* 24px */
--spacing-6: 2rem;     /* 32px */
--spacing-8: 3rem;     /* 48px */
--spacing-10: 4rem;    /* 64px */
--spacing-12: 6rem;    /* 96px */
--spacing-16: 8rem;    /* 128px */
```

**Usage Guidelines**:
- Use multiples of 8px (or 4px for fine-tuning)
- Consistent spacing creates visual rhythm
- Larger spacing for more important separations

### Shadows & Elevation

```css
/* Elevation levels */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Focus states */
--shadow-focus: 0 0 0 3px rgba(66, 153, 225, 0.5);
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-base: 0.5rem;  /* 8px */
--radius-md: 0.75rem;   /* 12px */
--radius-lg: 1rem;      /* 16px */
--radius-xl: 1.5rem;    /* 24px */
--radius-full: 9999px;  /* Pill shape */
```

### Breakpoints

```css
/* Responsive breakpoints */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

---

## Core Components

### Button Component

#### Variants

```css
/* Primary button */
.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
}

.btn-primary:active {
  background-color: var(--color-primary-700);
}

.btn-primary:disabled {
  background-color: var(--color-gray-300);
  cursor: not-allowed;
}

/* Secondary button */
.btn-secondary {
  background-color: white;
  color: var(--color-primary-500);
  border: 2px solid var(--color-primary-500);
}

/* Tertiary button */
.btn-tertiary {
  background-color: transparent;
  color: var(--color-primary-500);
  border: none;
}

/* Danger button */
.btn-danger {
  background-color: var(--color-error);
  color: white;
}
```

#### Sizes

```css
.btn-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
}

.btn-base {
  padding: var(--spacing-3) var(--spacing-5);
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: var(--spacing-4) var(--spacing-6);
  font-size: var(--font-size-lg);
}
```

### Input Component

```css
.input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  transition: border-color 150ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.input:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.2);
}
```

### Card Component

```css
.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--color-gray-200);
}

.card-body {
  padding: var(--spacing-5);
}

.card-footer {
  padding: var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
}
```

### Modal Component

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  padding: var(--spacing-5);
}

.modal-footer {
  padding: var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}
```

---

## Component Documentation Template

For each component, document:

### 1. Purpose
What problem does this component solve?

### 2. Variants
Different visual or functional variations

### 3. Props/API
What parameters can be customized?

### 4. States
- Default
- Hover
- Active/Pressed
- Focused
- Disabled
- Loading
- Error

### 5. Accessibility
- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management

### 6. Usage Guidelines
**Do's**:
- When to use this component
- Best practices

**Don'ts**:
- When NOT to use
- Common mistakes

### 7. Examples
Code examples showing common use cases

### 8. Related Components
Components that work together or are alternatives

---

## Example: Button Documentation

### Purpose
Buttons allow users to take actions with a single tap or click.

### Variants
- **Primary**: Main action in a workflow
- **Secondary**: Alternative actions
- **Tertiary**: Subtle actions
- **Danger**: Destructive actions

### Props
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'base' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  children: ReactNode;
}
```

### States
```css
/* Default */
.btn { opacity: 1; cursor: pointer; }

/* Hover */
.btn:hover { filter: brightness(110%); }

/* Active */
.btn:active { transform: scale(0.98); }

/* Focused */
.btn:focus { box-shadow: var(--shadow-focus); }

/* Disabled */
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Loading */
.btn.loading { position: relative; color: transparent; }
```

### Accessibility
```html
<button
  type="button"
  disabled={isDisabled}
  aria-label={ariaLabel}
  aria-busy={isLoading}
>
  {children}
</button>
```

### Usage Guidelines

**Do's**:
✅ Use primary button for main action
✅ Keep button text short and action-oriented
✅ Provide visual feedback on interaction
✅ Make buttons large enough to tap (44×44px minimum)

**Don'ts**:
❌ Don't use more than one primary button per section
❌ Don't use buttons for navigation (use links)
❌ Don't make buttons too wide (max-width recommended)
❌ Don't remove focus indicators

### Examples

```tsx
// Primary action
<Button variant="primary">Save Changes</Button>

// With loading state
<Button variant="primary" loading={isSaving}>
  Save Changes
</Button>

// With icon
<Button variant="secondary" icon={<DownloadIcon />}>
  Download Report
</Button>

// Danger action
<Button variant="danger">Delete Account</Button>
```

---

## Design System Structure

### Recommended File Organization

```
design-system/
├── foundation/
│   ├── tokens.css          # Design tokens
│   ├── colors.css          # Color system
│   ├── typography.css      # Type scale
│   └── spacing.css         # Spacing system
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.css
│   │   ├── Button.test.tsx
│   │   └── Button.stories.tsx
│   ├── Input/
│   ├── Card/
│   └── ...
├── patterns/
│   ├── forms/
│   ├── navigation/
│   └── data-display/
├── utils/
│   ├── helpers.ts
│   └── hooks.ts
└── docs/
    ├── getting-started.md
    ├── guidelines.md
    └── components/
        ├── button.md
        └── ...
```

---

## Governance

### Component Contribution Process

1. **Proposal**: Submit RFC (Request for Comments) with use case
2. **Design Review**: UX team reviews design
3. **Implementation**: Build component following standards
4. **Code Review**: Engineering review
5. **Accessibility Audit**: A11y team reviews
6. **Documentation**: Add to design system docs
7. **Approval**: Design system team approves
8. **Release**: Publish to component library

### Versioning

Use semantic versioning (SemVer):
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Deprecation Policy

1. **Announce**: Communicate deprecation 3 months in advance
2. **Warn**: Add console warnings in code
3. **Migrate**: Provide migration guide
4. **Remove**: Remove after deprecation period

---

## Tools & Ecosystem

### Design Tools
- **Figma**: Component libraries, design tokens plugin
- **Sketch**: Libraries, shared styles
- **Adobe XD**: Component states, design tokens

### Development Tools
- **Storybook**: Component documentation and testing
- **Chromatic**: Visual regression testing
- **Style Dictionary**: Design token management
- **TypeScript**: Type-safe components

### Documentation
- **Docusaurus**: Documentation site
- **Storybook Docs**: Auto-generated component docs
- **MDX**: Interactive documentation

---

## Best Practices

### Design Token Usage

```css
/* Good: Use tokens */
.component {
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-base);
}

/* Bad: Hard-coded values */
.component {
  color: #212121;
  padding: 16px;
  border-radius: 8px;
}
```

### Component Composition

```tsx
// Good: Composable components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
</Card>

// Bad: Monolithic component
<Card
  title="Title"
  body="Content"
  showHeader={true}
/>
```

### Prop API Design

```tsx
// Good: Clear, predictable props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// Bad: Unclear combinations
interface ButtonProps {
  isPrimary?: boolean;
  isSecondary?: boolean;
  isSmall?: boolean;
  isMedium?: boolean;
}
```

---

## Measuring Success

### Adoption Metrics
- % of projects using design system
- Number of components in use
- Custom component creation rate (should decrease)

### Quality Metrics
- Accessibility compliance score
- Component test coverage
- Design-dev consistency

### Efficiency Metrics
- Time to build new features (should decrease)
- Design-to-development handoff time
- Bug rate in UI components

---

## Case Studies

### Material Design (Google)
**Strengths**:
- Comprehensive guidelines
- Multiple platform implementations
- Excellent documentation

**Learn From**:
- Detailed motion guidelines
- Elevation system
- Extensive icon library

### Polaris (Shopify)
**Strengths**:
- E-commerce focused
- Strong accessibility focus
- Clear usage guidelines

**Learn From**:
- Component do's and don'ts
- Context-specific patterns
- Mobile-first approach

### Carbon (IBM)
**Strengths**:
- Enterprise-grade
- Data visualization components
- Multiple framework support

**Learn From**:
- Grid system
- Data table patterns
- Dark mode implementation

---

## Getting Started Checklist

### Phase 1: Foundation
- [ ] Define design tokens (colors, typography, spacing)
- [ ] Create foundational styles
- [ ] Set up version control
- [ ] Choose tooling (Figma, Storybook, etc.)

### Phase 2: Core Components
- [ ] Build 10-15 most common components
- [ ] Document each component
- [ ] Write accessibility guidelines
- [ ] Create usage examples

### Phase 3: Patterns
- [ ] Document common patterns
- [ ] Create templates
- [ ] Build example applications

### Phase 4: Governance
- [ ] Establish contribution process
- [ ] Set up review process
- [ ] Create deprecation policy
- [ ] Plan versioning strategy

### Phase 5: Adoption
- [ ] Train teams
- [ ] Migrate existing projects
- [ ] Gather feedback
- [ ] Iterate and improve

---

## Resources

### Learning
- "Design Systems" by Alla Kholmatova
- "Atomic Design" by Brad Frost
- Design Systems Slack community
- Style Guide Guide (styleguides.io)

### Inspiration
- Material Design: material.io
- Polaris: polaris.shopify.com
- Carbon: carbondesignsystem.com
- Atlassian Design: atlassian.design
- Lightning: lightningdesignsystem.com

### Tools
- Figma Design Tokens Plugin
- Style Dictionary
- Storybook
- Chromatic
- React Aria (accessible components)
