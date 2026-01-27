# Accessibility Guidelines (WCAG 2.1 AA)

Comprehensive guide to creating accessible web interfaces that comply with WCAG 2.1 Level AA standards.

## Introduction to WCAG 2.1

WCAG (Web Content Accessibility Guidelines) 2.1 is organized around four principles (POUR):

1. **Perceivable** - Information must be presentable to users in ways they can perceive
2. **Operable** - Interface components must be operable by all users
3. **Understandable** - Information and operation must be understandable
4. **Robust** - Content must be robust enough to work with current and future technologies

## 1. Perceivable

### 1.1 Text Alternatives

**Guideline**: Provide text alternatives for non-text content

#### Images

**Informative Images**:
```html
<!-- Good: Descriptive alt text -->
<img src="chart.png" alt="Bar chart showing 40% increase in sales from Q1 to Q2">

<!-- Bad: Generic or missing alt -->
<img src="chart.png" alt="chart">
<img src="chart.png">
```

**Decorative Images**:
```html
<!-- Good: Empty alt for decorative images -->
<img src="decorative-line.svg" alt="" role="presentation">

<!-- Bad: Describing decorative images -->
<img src="decorative-line.svg" alt="purple wavy line">
```

**Icons with Text**:
```html
<!-- Good: Icon is decorative when text is present -->
<button>
  <svg aria-hidden="true" focusable="false">...</svg>
  Delete
</button>

<!-- Good: Icon-only button needs label -->
<button aria-label="Delete">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>
```

**Complex Images**:
```html
<!-- Good: Long description for complex images -->
<figure>
  <img
    src="process-diagram.png"
    alt="Product development process diagram"
    aria-describedby="diagram-description"
  >
  <figcaption id="diagram-description">
    The diagram shows 5 stages: Research, Design, Development, Testing, and Launch.
    Each stage connects to the next with arrows, and there's a feedback loop
    from Launch back to Research.
  </figcaption>
</figure>
```

#### Icons and Icon Fonts

```html
<!-- Good: SVG icon with accessible label -->
<svg role="img" aria-label="Warning">
  <title>Warning</title>
  <path d="..."></path>
</svg>

<!-- Good: Icon font with screen reader text -->
<i class="icon-warning" aria-hidden="true"></i>
<span class="sr-only">Warning</span>
```

### 1.2 Time-based Media

**Guideline**: Provide alternatives for audio and video content

#### Video Requirements (Level AA)
- Captions for all prerecorded audio
- Audio description OR media alternative for video
- Captions for live content

```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions-en.vtt" srclang="en" label="English">
  <track kind="descriptions" src="descriptions-en.vtt" srclang="en">
</video>
```

### 1.3 Adaptable

**Guideline**: Create content that can be presented in different ways without losing meaning

#### Semantic HTML

```html
<!-- Good: Proper semantic structure -->
<main>
  <article>
    <h1>Article Title</h1>
    <section>
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

<!-- Bad: Divs for everything -->
<div class="main">
  <div class="article">
    <div class="title">Article Title</div>
    <div class="section">
      <div class="subtitle">Section Title</div>
      <div>Content...</div>
    </div>
  </div>
</div>
```

#### Form Labels

```html
<!-- Good: Explicit label association -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email">

<!-- Good: Implicit label -->
<label>
  Email Address
  <input type="email" name="email">
</label>

<!-- Bad: No label -->
<input type="email" name="email" placeholder="Email Address">
```

#### Tables

```html
<!-- Good: Accessible data table -->
<table>
  <caption>Quarterly Sales Report</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Q1 2024</th>
      <td>$1.2M</td>
      <td>12%</td>
    </tr>
  </tbody>
</table>
```

#### Info and Relationships

**Reading Order**: Ensure DOM order matches visual order
```html
<!-- Good: DOM order matches visual order -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card description</p>
  <button>Action</button>
</div>

<!-- Bad: Visual order doesn't match DOM order -->
<div class="card">
  <button style="order: 3">Action</button>
  <h3 style="order: 1">Card Title</h3>
  <p style="order: 2">Card description</p>
</div>
```

### 1.4 Distinguishable

**Guideline**: Make it easy for users to see and hear content

#### Color Contrast (WCAG AA)

**Requirements**:
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (≥ 18pt or ≥ 14pt bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

```css
/* Good: High contrast text */
.text {
  color: #333333; /* Dark gray */
  background: #FFFFFF; /* White */
  /* Contrast ratio: 12.63:1 ✓ */
}

/* Bad: Low contrast text */
.text {
  color: #999999; /* Light gray */
  background: #FFFFFF; /* White */
  /* Contrast ratio: 2.85:1 ✗ */
}

/* Good: High contrast buttons */
.button {
  color: #FFFFFF; /* White */
  background: #0066CC; /* Blue */
  border: 2px solid #0066CC;
  /* Contrast ratio: 7.17:1 ✓ */
}

/* Good: Focus indicators */
.button:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
  /* Contrast ratio with background: 3.2:1 ✓ */
}
```

**Testing Tools**:
- WebAIM Contrast Checker
- Chrome DevTools (Lighthouse)
- Stark (Figma plugin)

#### Don't Use Color Alone

```html
<!-- Bad: Color only to indicate status -->
<span style="color: red">Error</span>
<span style="color: green">Success</span>

<!-- Good: Icon + color + text -->
<span class="status-error">
  <svg aria-hidden="true">❌</svg>
  Error: Please check your input
</span>
<span class="status-success">
  <svg aria-hidden="true">✓</svg>
  Success: Changes saved
</span>
```

#### Resize Text

**Requirement**: Text can be resized up to 200% without loss of content or functionality

```css
/* Good: Relative units */
body {
  font-size: 16px; /* Base size */
}
h1 {
  font-size: 2rem; /* 32px, scales with zoom */
}
.sidebar {
  width: 20em; /* Scales with text size */
}

/* Bad: Fixed units */
.text {
  font-size: 14px; /* Doesn't scale */
}
.container {
  width: 300px; /* May cause overflow */
}
```

#### Text Spacing

Users must be able to adjust:
- Line height: At least 1.5× font size
- Paragraph spacing: At least 2× font size
- Letter spacing: At least 0.12× font size
- Word spacing: At least 0.16× font size

```css
/* Good: Allows text spacing adjustments */
p {
  line-height: 1.5;
  margin-bottom: 1.5em;
}

/* Don't use: */
p {
  line-height: 1.2 !important; /* !important blocks user adjustments */
}
```

#### Reflow

**Requirement**: Content reflows to single column at 320px width without horizontal scrolling

```css
/* Good: Responsive design */
.container {
  max-width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## 2. Operable

### 2.1 Keyboard Accessible

**Guideline**: All functionality must be available from keyboard

#### Keyboard Navigation

```html
<!-- Good: All interactive elements are keyboard accessible -->
<button>Click Me</button> <!-- Focusable by default -->
<a href="/page">Link</a> <!-- Focusable by default -->

<!-- Good: Custom interactive element with keyboard support -->
<div
  role="button"
  tabindex="0"
  onclick="handleClick()"
  onkeydown="handleKeyDown(event)"
>
  Custom Button
</div>

<script>
function handleKeyDown(event) {
  // Activate on Enter or Space
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
</script>

<!-- Bad: onclick without keyboard support -->
<div onclick="handleClick()">Click Me</div>
```

#### Focus Order

```html
<!-- Good: Logical tab order (follows DOM order) -->
<form>
  <input type="text" name="name"> <!-- Tab 1 -->
  <input type="email" name="email"> <!-- Tab 2 -->
  <button type="submit">Submit</button> <!-- Tab 3 -->
</form>

<!-- Bad: Manipulated tab order -->
<form>
  <input type="text" tabindex="3">
  <input type="email" tabindex="1">
  <button tabindex="2">Submit</button>
</form>
```

#### Skip Links

```html
<!-- Good: Skip to main content link -->
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  <header>...</header>
  <main id="main-content">...</main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

#### Focus Indicators

```css
/* Good: Visible focus indicator */
:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}

/* Good: Custom focus style */
button:focus {
  outline: none; /* Only if providing custom */
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}

/* Bad: Remove outline without replacement */
:focus {
  outline: none; /* Never do this alone */
}
```

### 2.2 Enough Time

**Guideline**: Provide users enough time to read and use content

#### Time Limits

```html
<!-- Good: Warning before timeout with option to extend -->
<div role="alert" aria-live="assertive">
  Your session will expire in 2 minutes.
  <button onclick="extendSession()">Extend Session</button>
</div>
```

#### Auto-updating Content

```html
<!-- Good: Pause, stop, or hide controls for auto-updating content -->
<div class="carousel">
  <button onclick="pauseCarousel()" aria-label="Pause carousel">
    Pause
  </button>
  <!-- Carousel content -->
</div>
```

### 2.3 Seizures and Physical Reactions

**Guideline**: Don't design content that could cause seizures

- No more than 3 flashes per second
- Provide warning for flashing content
- Offer option to disable animations

```css
/* Good: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.4 Navigable

**Guideline**: Provide ways to help users navigate and find content

#### Page Titles

```html
<!-- Good: Descriptive, unique page title -->
<title>Contact Us - Acme Corporation</title>

<!-- Bad: Generic title -->
<title>Page</title>
```

#### Headings and Labels

```html
<!-- Good: Logical heading structure -->
<h1>Main Page Title</h1>
  <h2>Section 1</h2>
    <h3>Subsection 1.1</h3>
    <h3>Subsection 1.2</h3>
  <h2>Section 2</h2>

<!-- Bad: Skipped heading levels -->
<h1>Main Page Title</h1>
  <h4>Section 1</h4> <!-- Skipped h2 and h3 -->
```

#### Focus Management

```javascript
// Good: Manage focus when opening modal
function openModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'block';

  // Store previously focused element
  previouslyFocused = document.activeElement;

  // Focus first focusable element in modal
  const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  firstFocusable.focus();

  // Trap focus within modal
  modal.addEventListener('keydown', trapFocus);
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
  modal.removeEventListener('keydown', trapFocus);

  // Return focus to previously focused element
  previouslyFocused.focus();
}
```

#### Landmarks

```html
<!-- Good: Landmark regions -->
<header>...</header>
<nav aria-label="Main navigation">...</nav>
<main>
  <article>...</article>
  <aside>...</aside>
</main>
<footer>...</footer>

<!-- Alternative using ARIA -->
<div role="banner">...</div>
<div role="navigation" aria-label="Main navigation">...</div>
<div role="main">...</div>
<div role="contentinfo">...</div>
```

### 2.5 Input Modalities

**Guideline**: Make it easier for users to operate functionality through various inputs

#### Touch Targets

```css
/* Good: Minimum 44×44px touch targets */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* Good: Increase clickable area */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 10px; /* Total: 44×44px */
}
```

#### Pointer Cancellation

```javascript
// Good: Execute on mouseup, not mousedown
button.addEventListener('click', handleClick); // Fires on mouseup

// Bad: Execute on mousedown (no way to cancel)
button.addEventListener('mousedown', handleClick);
```

---

## 3. Understandable

### 3.1 Readable

**Guideline**: Make text content readable and understandable

#### Language

```html
<!-- Good: Declare language -->
<html lang="en">

<!-- Good: Declare language changes -->
<p>The French phrase <span lang="fr">"bonjour"</span> means hello.</p>
```

#### Reading Level

- Use clear, simple language
- Explain jargon and abbreviations
- Break up long sentences

```html
<!-- Good: Clear abbreviation expansion -->
<abbr title="World Wide Web Consortium">W3C</abbr>

<!-- Good: Definition on first use -->
<p>
  The <dfn>Web Content Accessibility Guidelines (WCAG)</dfn> are a set
  of recommendations for making web content accessible.
</p>
```

### 3.2 Predictable

**Guideline**: Make Web pages appear and operate in predictable ways

#### Consistent Navigation

```html
<!-- Good: Same navigation order on all pages -->
<nav>
  <a href="/">Home</a>
  <a href="/products">Products</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

#### Consistent Identification

```html
<!-- Good: Same icon/label for same function throughout site -->
<button>
  <svg aria-hidden="true">🔍</svg>
  Search
</button>

<!-- Bad: Different labels for same function -->
<!-- Page 1: "Search" -->
<!-- Page 2: "Find" -->
<!-- Page 3: "Lookup" -->
```

#### On Focus

```html
<!-- Bad: Opening modal automatically on focus -->
<input
  type="text"
  onfocus="openHelp()" <!-- Don't do this -->
>

<!-- Good: Explicit action required -->
<input type="text" aria-describedby="help-text">
<span id="help-text">Enter your full name</span>
<button onclick="openHelp()">More Help</button>
```

### 3.3 Input Assistance

**Guideline**: Help users avoid and correct mistakes

#### Error Identification

```html
<!-- Good: Clear error identification -->
<div class="form-field error">
  <label for="email">Email</label>
  <input
    type="email"
    id="email"
    aria-invalid="true"
    aria-describedby="email-error"
  >
  <span id="email-error" class="error-message" role="alert">
    Please enter a valid email address (e.g., name@example.com)
  </span>
</div>
```

#### Labels or Instructions

```html
<!-- Good: Clear instructions before field -->
<label for="password">
  Password
  <span class="required">*</span>
</label>
<span id="password-hint" class="hint">
  Must be at least 8 characters with 1 number and 1 special character
</span>
<input
  type="password"
  id="password"
  aria-required="true"
  aria-describedby="password-hint"
>
```

#### Error Prevention

```html
<!-- Good: Confirmation for important actions -->
<form onsubmit="return confirmSubmit()">
  <input type="text" name="accountNumber">
  <button type="submit">Transfer $10,000</button>
</form>

<script>
function confirmSubmit() {
  return confirm('Are you sure you want to transfer $10,000? This action cannot be undone.');
}
</script>
```

---

## 4. Robust

### 4.1 Compatible

**Guideline**: Maximize compatibility with current and future user agents

#### Parsing

```html
<!-- Good: Valid HTML -->
<div id="unique-id">
  <p>Content</p>
</div>

<!-- Bad: Duplicate IDs -->
<div id="duplicate">First</div>
<div id="duplicate">Second</div>

<!-- Bad: Improper nesting -->
<p>Paragraph <div>Div inside paragraph</div></p>
```

#### Name, Role, Value

```html
<!-- Good: Proper ARIA attributes -->
<div
  role="button"
  tabindex="0"
  aria-pressed="false"
  aria-label="Toggle menu"
>
  Menu
</div>

<!-- Good: Native semantics preferred -->
<button aria-pressed="false">
  Menu
</button>
```

---

## ARIA Best Practices

### Five Rules of ARIA

1. **Use native HTML when possible**
   ```html
   <!-- Good: Native button -->
   <button>Click Me</button>

   <!-- Avoid: Custom button with ARIA -->
   <div role="button" tabindex="0">Click Me</div>
   ```

2. **Don't change native semantics**
   ```html
   <!-- Bad: Changing button to heading -->
   <button role="heading">Not a Button</button>

   <!-- Good: Use correct element -->
   <h2>Heading</h2>
   ```

3. **All interactive ARIA controls must be keyboard accessible**
   ```html
   <!-- Good: Keyboard accessible custom control -->
   <div role="button" tabindex="0" onkeydown="handleKey(event)">
     Custom Button
   </div>
   ```

4. **Don't hide focusable elements**
   ```html
   <!-- Bad: Hiding focusable element from screen readers -->
   <button aria-hidden="true">Click Me</button>

   <!-- Good: Either remove from tab order or make visible -->
   <button tabindex="-1">Hidden from keyboard</button>
   ```

5. **All interactive elements must have an accessible name**
   ```html
   <!-- Good: Button with accessible name -->
   <button aria-label="Close">
     <svg>×</svg>
   </button>
   ```

### Common ARIA Patterns

#### Alert

```html
<div role="alert" aria-live="assertive">
  Error: Please fill in all required fields
</div>
```

#### Dialog/Modal

```html
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
  <!-- Dialog content -->
</div>
```

#### Tabs

```html
<div class="tabs">
  <div role="tablist" aria-label="Content sections">
    <button role="tab" aria-selected="true" aria-controls="panel-1">
      Tab 1
    </button>
    <button role="tab" aria-selected="false" aria-controls="panel-2">
      Tab 2
    </button>
  </div>

  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
    Panel 1 content
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
    Panel 2 content
  </div>
</div>
```

---

## Testing Checklist

### Automated Testing
- [ ] Run Lighthouse accessibility audit
- [ ] Use axe DevTools
- [ ] Validate HTML
- [ ] Check color contrast
- [ ] Use WAVE tool

### Manual Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Zoom to 200%
- [ ] Disable CSS
- [ ] Test with grayscale filter

### Screen Reader Testing

**Test with**:
- **Windows**: NVDA (free) or JAWS
- **Mac**: VoiceOver (built-in)
- **Linux**: Orca
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

**Common screen reader shortcuts**:
- **NVDA**: Insert = modifier key
- **JAWS**: Insert = modifier key
- **VoiceOver**: Control+Option = modifier key

---

## Quick Reference

### WCAG 2.1 AA Requirements Summary

**Perceivable**:
- Alt text for images
- Captions for videos
- Color contrast 4.5:1 (text), 3:1 (UI)
- Resize text to 200%
- Semantic HTML

**Operable**:
- Keyboard accessible
- Focus indicators
- Skip links
- No keyboard traps
- Touch targets 44×44px minimum

**Understandable**:
- Clear language
- Consistent navigation
- Error identification
- Form labels and instructions
- Predictable behavior

**Robust**:
- Valid HTML
- Proper ARIA usage
- Compatible with assistive technologies

---

## Resources

### Testing Tools
- **axe DevTools**: Browser extension for automated testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Analyzer**: Desktop app for contrast checking
- **Screen Readers**: NVDA, JAWS, VoiceOver, TalkBack

### Guidelines & Documentation
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **WAI-ARIA**: https://www.w3.org/WAI/ARIA/apg/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **A11y Project**: https://www.a11yproject.com/

### Learning Resources
- **WebAIM**: Comprehensive tutorials and articles
- **Deque University**: In-depth accessibility courses
- **Google Web Fundamentals**: Accessibility guides
