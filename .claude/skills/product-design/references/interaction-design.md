# Interaction Design Guide

A comprehensive guide to creating delightful, functional micro-interactions and animations.

## Principles of Interaction Design

### 1. Provide Feedback
Every action should have a reaction. Users need to know their action was recognized.

### 2. Be Purposeful
Every animation should serve a functional purpose, not just decoration.

### 3. Respect Motion Preferences
Always honor `prefers-reduced-motion` for accessibility.

### 4. Keep It Fast
Animations should feel instant. Most UI animations: 200-500ms.

### 5. Use Easing
Natural motion uses easing curves, not linear transitions.

---

## Animation Duration Guidelines

### By Distance

| Distance | Duration | Use Case |
|----------|----------|----------|
| 0-100px | 100-200ms | Small movements (tooltips, dropdowns) |
| 100-500px | 200-300ms | Medium movements (modals, panels) |
| 500px+ | 300-500ms | Large movements (page transitions) |

### By Element Type

| Element | Duration | Example |
|---------|----------|---------|
| Icon/Button | 100-150ms | Hover, click feedback |
| Tooltip | 150-200ms | Show/hide tooltip |
| Dropdown | 200-250ms | Menu open/close |
| Modal | 250-300ms | Modal fade in |
| Page transition | 300-500ms | Route changes |
| Loading states | 400-600ms | Skeleton screens |

---

## Easing Functions

### CSS Easing

```css
/* Standard easings */
.ease-linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }

/* Custom cubic-bezier curves */
.ease-smooth { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.ease-sharp { transition-timing-function: cubic-bezier(0.4, 0, 0.6, 1); }
.ease-spring { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
```

### When to Use Each

**Linear**: Progress indicators, loading bars
**Ease-in**: Elements exiting the screen
**Ease-out**: Elements entering the screen (most common)
**Ease-in-out**: Elements moving on screen
**Custom**: Personality, bounce effects (use sparingly)

---

## Micro-interactions

### Button Interactions

#### Press Effect

```css
.button {
  transition: transform 100ms ease-out, box-shadow 100ms ease-out;
}

.button:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

#### Ripple Effect

```html
<button class="ripple-button">
  Click Me
  <span class="ripple"></span>
</button>

<style>
.ripple-button {
  position: relative;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple 600ms ease-out;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>

<script>
button.addEventListener('click', (e) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
});
</script>
```

#### Loading State

```css
.button-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.button-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spinner 600ms linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
```

### Input Interactions

#### Focus Animation

```css
.input {
  border: 2px solid #E0E0E0;
  transition: border-color 200ms ease-out, box-shadow 200ms ease-out;
}

.input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}
```

#### Label Animation

```html
<div class="input-group">
  <input type="text" id="email" placeholder=" " required>
  <label for="email">Email Address</label>
</div>

<style>
.input-group {
  position: relative;
}

.input-group input {
  padding: 16px 12px 8px;
  border: 2px solid #E0E0E0;
  border-radius: 4px;
  font-size: 16px;
}

.input-group label {
  position: absolute;
  left: 12px;
  top: 16px;
  color: #757575;
  pointer-events: none;
  transition: all 200ms ease-out;
}

.input-group input:focus + label,
.input-group input:not(:placeholder-shown) + label {
  top: 4px;
  font-size: 12px;
  color: #2196F3;
}
</style>
```

#### Validation Feedback

```css
.input.valid {
  border-color: #4CAF50;
  animation: validPulse 300ms ease-out;
}

.input.invalid {
  border-color: #F44336;
  animation: shake 400ms ease-out;
}

@keyframes validPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

### Toggle/Checkbox Interactions

```html
<label class="toggle">
  <input type="checkbox">
  <span class="toggle-slider"></span>
</label>

<style>
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 28px;
  transition: background-color 200ms ease-out;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: transform 200ms ease-out;
}

.toggle input:checked + .toggle-slider {
  background-color: #2196F3;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}
</style>
```

---

## Component Transitions

### Modal Enter/Exit

```css
.modal-overlay {
  opacity: 0;
  transition: opacity 250ms ease-out;
}

.modal-overlay.active {
  opacity: 1;
}

.modal {
  transform: scale(0.9);
  opacity: 0;
  transition: transform 250ms ease-out, opacity 250ms ease-out;
}

.modal.active {
  transform: scale(1);
  opacity: 1;
}

/* Exit animation */
.modal.exiting {
  transform: scale(0.9);
  opacity: 0;
}
```

### Slide Panel

```css
.slide-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  background: white;
  transform: translateX(100%);
  transition: transform 300ms ease-out;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
}

.slide-panel.open {
  transform: translateX(0);
}
```

### Dropdown Menu

```css
.dropdown-menu {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
  pointer-events: none;
}

.dropdown-menu.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

### Toast Notification

```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast {
  animation: slideInRight 300ms ease-out;
}

.toast.removing {
  animation: slideOutRight 200ms ease-in;
}
```

---

## Loading States

### Skeleton Screens

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: 16px;
}
```

### Progress Bar

```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 65%"></div>
</div>

<style>
.progress-bar {
  width: 100%;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2196F3;
  transition: width 300ms ease-out;
}

/* Indeterminate progress */
.progress-fill.indeterminate {
  width: 30%;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
</style>
```

### Spinner

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Pulse spinner */
.spinner-pulse {
  width: 40px;
  height: 40px;
  background: #2196F3;
  border-radius: 50%;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## Hover Effects

### Card Lift

```css
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

### Image Zoom

```css
.image-container {
  overflow: hidden;
  border-radius: 8px;
}

.image-container img {
  transition: transform 300ms ease-out;
}

.image-container:hover img {
  transform: scale(1.05);
}
```

### Button Shine

```css
.button-shine {
  position: relative;
  overflow: hidden;
}

.button-shine::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 400ms ease-out;
}

.button-shine:hover::before {
  left: 100%;
}
```

---

## Page Transitions

### Fade Transition

```css
.page-enter {
  opacity: 0;
}

.page-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-in;
}
```

### Slide Transition

```css
.page-slide-enter {
  transform: translateX(100%);
}

.page-slide-enter-active {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}

.page-slide-exit {
  transform: translateX(0);
}

.page-slide-exit-active {
  transform: translateX(-100%);
  transition: transform 300ms ease-in;
}
```

---

## Scroll Animations

### Fade In On Scroll

```html
<div class="fade-in-scroll">Content</div>

<style>
.fade-in-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}

.fade-in-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>

<script>
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.fade-in-scroll').forEach((el) => {
  observer.observe(el);
});
</script>
```

### Parallax Effect

```css
.parallax {
  transform: translateY(var(--scroll-offset));
  transition: transform 0.1s linear;
}
```

```javascript
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('.parallax');

  parallaxElements.forEach((el) => {
    const speed = el.dataset.speed || 0.5;
    const offset = scrolled * speed;
    el.style.setProperty('--scroll-offset', `${offset}px`);
  });
});
```

---

## Gesture Interactions

### Swipe to Delete

```html
<div class="swipeable-item">
  <div class="item-content">Swipe me left</div>
  <div class="delete-action">Delete</div>
</div>

<style>
.swipeable-item {
  position: relative;
  overflow: hidden;
}

.item-content {
  background: white;
  padding: 16px;
  transform: translateX(0);
  transition: transform 200ms ease-out;
}

.delete-action {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: #F44336;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script>
let startX = 0;
let currentX = 0;

item.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

item.addEventListener('touchmove', (e) => {
  currentX = e.touches[0].clientX;
  const diff = startX - currentX;

  if (diff > 0 && diff < 80) {
    content.style.transform = `translateX(-${diff}px)`;
  }
});

item.addEventListener('touchend', () => {
  const diff = startX - currentX;

  if (diff > 40) {
    content.style.transform = 'translateX(-80px)';
  } else {
    content.style.transform = 'translateX(0)';
  }
});
</script>
```

### Pull to Refresh

```css
.pull-indicator {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  transition: top 200ms ease-out;
}

.pull-indicator.visible {
  top: 20px;
}

.pull-indicator.loading {
  animation: spin 800ms linear infinite;
}
```

---

## Accessibility Considerations

### Respect Reduced Motion

```css
/* Always include this media query */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Indicators

```css
/* Never remove focus indicators without replacement */
:focus {
  outline: 3px solid #2196F3;
  outline-offset: 2px;
}

/* Custom focus indicator */
.button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.5);
}
```

### Skip Animations for Keyboard Users

```javascript
// Disable animations when user navigates via keyboard
let isKeyboardUser = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    isKeyboardUser = true;
    document.body.classList.add('keyboard-user');
  }
});

document.addEventListener('mousedown', () => {
  isKeyboardUser = false;
  document.body.classList.remove('keyboard-user');
});
```

```css
.keyboard-user * {
  transition-duration: 0.01ms !important;
}
```

---

## Performance Optimization

### Use Transform and Opacity

```css
/* Good: GPU-accelerated properties */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Bad: Causes layout recalculation */
.element {
  left: 100px;
  background-color: rgba(0, 0, 0, 0.5);
}
```

### Will-Change

```css
/* Optimize animations that will happen */
.modal {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.modal.animated {
  will-change: auto;
}
```

### Use requestAnimationFrame

```javascript
// Good: Synced with browser refresh rate
function animate() {
  element.style.transform = `translateX(${position}px)`;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bad: May cause jank
setInterval(() => {
  element.style.transform = `translateX(${position}px)`;
}, 16);
```

---

## Interaction Design Patterns

### Progressive Disclosure

Show complexity gradually as needed.

```html
<!-- Initial state: Simple -->
<div class="settings-simple">
  <label>
    <input type="checkbox"> Enable notifications
  </label>
  <button class="link">Advanced settings</button>
</div>

<!-- Expanded state: Complex -->
<div class="settings-advanced" hidden>
  <label>
    <input type="checkbox"> Email notifications
  </label>
  <label>
    <input type="checkbox"> Push notifications
  </label>
  <label>
    Notification frequency:
    <select>
      <option>Immediately</option>
      <option>Daily digest</option>
      <option>Weekly digest</option>
    </select>
  </label>
</div>
```

### Anticipatory Design

Predict user needs and provide shortcuts.

```javascript
// Save form data automatically
const formData = {};
inputs.forEach(input => {
  input.addEventListener('input', debounce(() => {
    formData[input.name] = input.value;
    localStorage.setItem('formDraft', JSON.stringify(formData));
  }, 500));
});

// Restore on page load
const savedData = JSON.parse(localStorage.getItem('formDraft'));
if (savedData) {
  showToast('Restore previous draft?', {
    action: () => restoreForm(savedData)
  });
}
```

### Forgiving Format

Accept various input formats.

```javascript
// Phone number: accept multiple formats
function normalizePhone(input) {
  // Accepts: (555) 123-4567, 555-123-4567, 5551234567
  return input.replace(/\D/g, '');
}

// Date: accept multiple formats
function parseDate(input) {
  // Accepts: 12/25/2024, 2024-12-25, Dec 25 2024
  return new Date(input);
}
```

---

## Best Practices Summary

### Do's ✅
- Keep animations under 500ms
- Use easing functions for natural motion
- Provide visual feedback for all interactions
- Respect `prefers-reduced-motion`
- Test on low-powered devices
- Use GPU-accelerated properties (transform, opacity)

### Don'ts ❌
- Don't animate layout properties (width, height, top, left)
- Don't use animations longer than 1 second for UI
- Don't remove focus indicators
- Don't auto-play animations without user control
- Don't use animation for decoration only
- Don't forget loading states

---

## Testing Checklist

- [ ] All animations under 500ms
- [ ] Reduced motion preference respected
- [ ] Focus indicators visible
- [ ] Animations have functional purpose
- [ ] Touch targets 44×44px minimum
- [ ] Hover states work on touch devices
- [ ] Performance tested on mobile
- [ ] No layout shift during animations
- [ ] Loading states for async operations
- [ ] Error states animate clearly

---

## Resources

### Tools
- **Chrome DevTools**: Performance profiler
- **React Spring**: Animation library
- **Framer Motion**: React animation library
- **GSAP**: Professional animation platform
- **Lottie**: Lightweight animations

### Inspiration
- **Dribbble**: UI animation inspiration
- **CodePen**: Interactive examples
- **Motion Design**: motiondesign.io
- **UI Movement**: Best UI animations

### Learning
- "The Web Animation API" - MDN
- "Designing Interface Animation" - Val Head
- "Motion Design for iOS" - Mike Rundle
- Google Material Design Motion guidelines
