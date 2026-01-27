# Component Specification: [Component Name]

**Version**: 1.0
**Last Updated**: [Date]
**Status**: [ ] Draft [ ] In Review [ ] Approved [ ] Deprecated
**Owner**: [Name/Team]

---

## Overview

### Purpose

[Brief description of what this component does and why it exists]

**Use Cases**:
- [Use case 1]
- [Use case 2]
- [Use case 3]

---

## Anatomy

### Visual Structure

```
[ASCII diagram or description of component structure]

Example:
┌─────────────────────────────┐
│ [Icon]  Label      [Badge]  │
│                             │
│ Supporting text             │
└─────────────────────────────┘
```

### Component Parts

1. **[Part Name]** (Required/Optional)
   - Purpose: [What it does]
   - Content: [What goes here]
   - Constraints: [Size, character limits, etc.]

2. **[Part Name]** (Required/Optional)
   - Purpose:
   - Content:
   - Constraints:

---

## Variants

### 1. [Variant Name]

**When to Use**:
- [Scenario 1]
- [Scenario 2]

**Visual Example**:
```
[Code or description]
```

### 2. [Variant Name]

**When to Use**:

**Visual Example**:

---

## Sizes

### Small
- **Dimensions**: [Width × Height]
- **Use Case**: [When to use small size]
- **Touch Target**: [Ensure 44×44px minimum]

### Medium (Default)
- **Dimensions**:
- **Use Case**:
- **Touch Target**:

### Large
- **Dimensions**:
- **Use Case**:
- **Touch Target**:

---

## States

### Default

**Visual**:
```css
/* Styles */
```

**Behavior**:
- [How it behaves]

### Hover

**Visual**:
```css
/* Hover styles */
```

**Behavior**:
- [What happens on hover]

### Active/Pressed

**Visual**:

**Behavior**:

### Focus

**Visual**:
```css
/* Focus indicator required */
.component:focus {
  outline: 3px solid #2196F3;
  outline-offset: 2px;
}
```

**Behavior**:

### Disabled

**Visual**:

**Behavior**:
- Not clickable
- Shows disabled cursor
- Removed from tab order or marked aria-disabled

### Loading

**Visual**:

**Behavior**:

### Error

**Visual**:

**Behavior**:

### Success

**Visual**:

**Behavior**:

---

## Behavior

### Interactions

**Click/Tap**:
- [What happens on click]
- [Animation/transition]
- [Feedback provided]

**Keyboard**:
- **Enter**: [Action]
- **Space**: [Action]
- **Tab**: [Behavior]
- **Escape**: [Behavior, if applicable]
- **Arrow Keys**: [Behavior, if applicable]

**Gestures** (Mobile):
- **Swipe**: [Behavior]
- **Long Press**: [Behavior]

### Animations

**Entry Animation**:
```css
/* Animation details */
duration: 200ms;
easing: ease-out;
```

**Exit Animation**:
```css
/* Animation details */
```

**Transitions**:
- [What transitions when state changes]
- Duration: [Time]
- Easing: [Function]

---

## Content Guidelines

### Labels

**Length**: [Min-max characters]
**Capitalization**: [ ] Sentence case [ ] Title Case [ ] ALL CAPS
**Tone**: [Friendly/Professional/Concise/etc.]

**Examples**:
- ✅ Good: "[Example]"
- ❌ Bad: "[Example]"

### Supporting Text

**Length**: [Min-max characters]
**Purpose**: [What this text communicates]

**Examples**:
- ✅ Good:
- ❌ Bad:

---

## Accessibility

### WCAG Compliance

**Level**: [ ] A [ ] AA [ ] AAA

**Requirements**:
- [ ] Color contrast: [Ratio] (Text: 4.5:1, UI: 3:1)
- [ ] Focus indicator visible
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Touch target 44×44px minimum
- [ ] Semantic HTML used
- [ ] ARIA attributes added where needed

### Semantic HTML

```html
<!-- Preferred markup -->
<[element]>
  [Structure]
</[element]>
```

### ARIA Attributes

Required ARIA attributes:
```html
role="[role]"
aria-label="[label]"
aria-labelledby="[id]"
aria-describedby="[id]"
aria-expanded="[true/false]"
aria-hidden="[true/false]"
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | [Move focus to component] |
| Enter | [Activate component] |
| Space | [Activate component] |
| Escape | [Close/Cancel] |
| Arrow keys | [Navigate within component] |

### Screen Reader Announcements

**On Load**:
- "[What screen reader announces]"

**On Interaction**:
- "[What screen reader announces]"

**On State Change**:
- "[What screen reader announces]"

---

## Responsive Behavior

### Desktop (>1024px)

**Layout**:
- [How component appears on desktop]

**Interactions**:
- Hover states visible
- Click interactions

### Tablet (768px - 1024px)

**Layout**:

**Interactions**:
- Touch-optimized
- Some hover states may not work

### Mobile (<768px)

**Layout**:

**Interactions**:
- Touch-only
- Increased touch target sizes

---

## Implementation

### HTML

```html
<!-- Basic implementation -->
<[element] class="component">
  [Structure]
</[element]>
```

### CSS

```css
/* Base styles */
.component {
  /* Layout */
  display: [value];

  /* Sizing */
  width: [value];
  height: [value];
  padding: [value];

  /* Typography */
  font-size: [value];
  font-weight: [value];

  /* Visual */
  background: [value];
  border: [value];
  border-radius: [value];

  /* Interaction */
  cursor: [value];
  transition: [properties] [duration] [easing];
}

/* States */
.component:hover { }
.component:focus { }
.component:active { }
.component:disabled { }
```

### JavaScript (if needed)

```javascript
// Component behavior
class Component {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    // Initialization logic
    this.bindEvents();
  }

  bindEvents() {
    // Event listeners
  }

  // Methods
}
```

### Framework Examples

**React**:
```tsx
interface ComponentProps {
  [prop]: [type];
}

export const Component: React.FC<ComponentProps> = ({
  [props]
}) => {
  return (
    <[element]>
      {children}
    </[element]>
  );
};
```

**Vue**:
```vue
<template>
  <[element]>
    [content]
  </[element]>
</template>

<script>
export default {
  name: 'Component',
  props: {
    [prop]: [type]
  }
}
</script>
```

---

## Usage Guidelines

### When to Use ✅

- [Scenario 1]
- [Scenario 2]
- [Scenario 3]

### When NOT to Use ❌

- [Scenario 1]
- [Scenario 2]
- [Scenario 3]

### Do's ✅

- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

### Don'ts ❌

- [Common mistake 1]
- [Common mistake 2]
- [Common mistake 3]

---

## Examples

### Basic Usage

```html
<!-- Simplest form -->
```

**Result**: [Description or screenshot]

### With Icon

```html
<!-- With icon example -->
```

**Result**:

### With Badge

```html
<!-- With badge example -->
```

**Result**:

### Complex Example

```html
<!-- Advanced usage -->
```

**Result**:

---

## Related Components

- **[Component Name]**: [How it relates]
- **[Component Name]**: [How it relates]
- **[Component Name]**: [How it relates]

---

## Design Tokens

### Colors

```css
--component-bg: [color];
--component-text: [color];
--component-border: [color];
--component-hover-bg: [color];
--component-active-bg: [color];
--component-disabled-bg: [color];
```

### Spacing

```css
--component-padding: [value];
--component-gap: [value];
--component-margin: [value];
```

### Typography

```css
--component-font-size: [value];
--component-font-weight: [value];
--component-line-height: [value];
```

### Borders

```css
--component-border-width: [value];
--component-border-radius: [value];
```

### Shadows

```css
--component-shadow: [value];
--component-shadow-hover: [value];
```

---

## Browser Support

- [ ] Chrome (last 2 versions)
- [ ] Firefox (last 2 versions)
- [ ] Safari (last 2 versions)
- [ ] Edge (last 2 versions)
- [ ] iOS Safari (last 2 versions)
- [ ] Chrome for Android (last 2 versions)

**Known Issues**:
- [Browser]: [Issue and workaround]

---

## Performance Considerations

### Rendering

- [Considerations for rendering performance]
- [Optimization techniques used]

### Animations

- [GPU-accelerated properties used]
- [Respects prefers-reduced-motion]

### Bundle Size

- Component size: [XX KB]
- Dependencies: [List]

---

## Testing

### Unit Tests

**Test Cases**:
- [ ] Renders correctly
- [ ] All variants render
- [ ] States change correctly
- [ ] Callbacks fire properly
- [ ] Props validation works

### Accessibility Tests

- [ ] Automated: axe-core passes
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Visual Regression Tests

- [ ] All variants captured
- [ ] All states captured
- [ ] Responsive breakpoints captured

---

## Change Log

### Version 1.0 - [Date]
- Initial release

---

## References

- [Link to design in Figma]
- [Link to research/user testing]
- [Link to related documentation]
- [ARIA Authoring Practices Guide]
- [WCAG Guidelines]

---

## Questions & Decisions

**Open Questions**:
- [Question that needs answering]

**Design Decisions**:
- **Decision**: [What was decided]
  - **Rationale**: [Why this decision was made]
  - **Alternative Considered**: [What else was considered]

---

## Approval

**Design Review**: [ ] Approved [ ] Needs Changes
**Engineering Review**: [ ] Approved [ ] Needs Changes
**Accessibility Review**: [ ] Approved [ ] Needs Changes
**Product Review**: [ ] Approved [ ] Needs Changes

**Sign-off**:
- Design: [Name] - [Date]
- Engineering: [Name] - [Date]
- Accessibility: [Name] - [Date]
- Product: [Name] - [Date]
