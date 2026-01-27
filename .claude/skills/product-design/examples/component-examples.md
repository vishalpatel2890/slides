# Component Design Examples

Examples of well-designed UI components following best practices.

## Button Component

### Anatomy

```
┌──────────────────────────────┐
│  [Icon]  Button Text  [Icon] │
│  ↑       ↑            ↑      │
│  leading label        trailing
└──────────────────────────────┘
   ↑                          ↑
   padding                  padding
```

### Implementation

```html
<!-- Primary Button -->
<button class="btn btn-primary">
  Save Changes
</button>

<!-- With Leading Icon -->
<button class="btn btn-primary">
  <svg class="btn-icon" aria-hidden="true">
    <use href="#icon-download"></use>
  </svg>
  Download Report
</button>

<!-- Loading State -->
<button class="btn btn-primary" disabled aria-busy="true">
  <span class="btn-spinner" aria-hidden="true"></span>
  <span class="btn-label">Saving...</span>
</button>

<!-- Icon-Only Button -->
<button class="btn btn-icon" aria-label="Close">
  <svg aria-hidden="true">
    <use href="#icon-close"></use>
  </svg>
</button>
```

### Styles

```css
.btn {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  /* Sizing */
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;

  /* Typography */
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;

  /* Visual */
  border: none;
  border-radius: 8px;
  background: #2196F3;
  color: white;

  /* Interaction */
  cursor: pointer;
  transition: all 150ms ease;
  user-select: none;
}

/* Hover State */
.btn:hover {
  background: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Active State */
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Focus State */
.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
}

/* Disabled State */
.btn:disabled {
  background: #BDBDBD;
  color: #757575;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Variants */
.btn-secondary {
  background: white;
  color: #2196F3;
  border: 2px solid #2196F3;
}

.btn-tertiary {
  background: transparent;
  color: #2196F3;
}

.btn-danger {
  background: #F44336;
}

/* Sizes */
.btn-sm {
  min-height: 36px;
  padding: 8px 16px;
  font-size: 14px;
}

.btn-lg {
  min-height: 52px;
  padding: 16px 32px;
  font-size: 18px;
}

/* Loading State */
.btn[aria-busy="true"] .btn-label {
  opacity: 0;
}

.btn-spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
```

### Accessibility

```html
<button
  type="button"
  class="btn btn-primary"
  aria-label="Save document"
  aria-busy="false"
  aria-disabled="false"
>
  Save
</button>
```

**Checklist**:
- ✅ Minimum 44×44px touch target
- ✅ Clear focus indicator
- ✅ Descriptive label or aria-label
- ✅ Loading state communicated to screen readers
- ✅ Disabled state prevents activation
- ✅ Keyboard accessible (native button)

---

## Input Field Component

### Anatomy

```
Label * ──────────────┐ (← Required indicator)
┌─────────────────────┐
│ Input value         │
└─────────────────────┘
  ↑                   ↑
  prefix            suffix
Helper text / Error message
```

### Implementation

```html
<!-- Basic Input -->
<div class="input-group">
  <label for="email" class="input-label">
    Email Address
    <span class="required">*</span>
  </label>
  <input
    type="email"
    id="email"
    class="input"
    placeholder="you@example.com"
    aria-required="true"
    aria-describedby="email-hint"
  >
  <span id="email-hint" class="input-hint">
    We'll never share your email with anyone else.
  </span>
</div>

<!-- Input with Icon Prefix -->
<div class="input-group">
  <label for="search" class="input-label">Search</label>
  <div class="input-wrapper">
    <svg class="input-prefix" aria-hidden="true">
      <use href="#icon-search"></use>
    </svg>
    <input
      type="search"
      id="search"
      class="input input-with-prefix"
      placeholder="Search products..."
    >
  </div>
</div>

<!-- Input with Validation -->
<div class="input-group input-group-error">
  <label for="password" class="input-label">Password</label>
  <input
    type="password"
    id="password"
    class="input input-error"
    aria-invalid="true"
    aria-describedby="password-error"
  >
  <span id="password-error" class="input-error-message" role="alert">
    Password must be at least 8 characters
  </span>
</div>

<!-- Input with Success State -->
<div class="input-group input-group-success">
  <label for="username" class="input-label">Username</label>
  <input
    type="text"
    id="username"
    class="input input-success"
    aria-describedby="username-success"
    value="johndoe"
  >
  <span id="username-success" class="input-success-message">
    ✓ Username available
  </span>
</div>
```

### Styles

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #424242;
  margin-bottom: 4px;
}

.required {
  color: #F44336;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 12px 16px;

  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;

  color: #212121;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 8px;

  transition: border-color 150ms, box-shadow 150ms;
}

/* Hover State */
.input:hover {
  border-color: #BDBDBD;
}

/* Focus State */
.input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* Disabled State */
.input:disabled {
  background: #F5F5F5;
  color: #9E9E9E;
  cursor: not-allowed;
}

/* Error State */
.input-error {
  border-color: #F44336;
}

.input-error:focus {
  border-color: #F44336;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.input-error-message {
  font-size: 14px;
  color: #F44336;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Success State */
.input-success {
  border-color: #4CAF50;
}

.input-success-message {
  font-size: 14px;
  color: #4CAF50;
}

/* Helper Text */
.input-hint {
  font-size: 14px;
  color: #757575;
}

/* Input with Prefix/Suffix */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: #757575;
  pointer-events: none;
}

.input-with-prefix {
  padding-left: 44px;
}
```

### Accessibility

**Checklist**:
- ✅ Label explicitly associated with input (for/id)
- ✅ Required fields marked with aria-required
- ✅ Error messages linked with aria-describedby
- ✅ Invalid state communicated with aria-invalid
- ✅ Helper text accessible to screen readers
- ✅ Placeholder text not used as label
- ✅ Touch target meets 44px minimum

---

## Card Component

### Anatomy

```
┌────────────────────────────┐
│  [Image/Media]             │
├────────────────────────────┤
│  Card Header               │
│  [Icon] Title        [Menu]│
├────────────────────────────┤
│  Card Body                 │
│  Description text here...  │
│                            │
├────────────────────────────┤
│  Card Footer               │
│  [Action 1]  [Action 2]    │
└────────────────────────────┘
```

### Implementation

```html
<!-- Basic Card -->
<article class="card">
  <img
    src="project-thumbnail.jpg"
    alt="Website redesign mockups"
    class="card-image"
  >
  <div class="card-content">
    <div class="card-header">
      <h3 class="card-title">Website Redesign</h3>
      <button class="card-menu" aria-label="More options">
        <svg><use href="#icon-menu"></use></svg>
      </button>
    </div>

    <p class="card-description">
      Modern redesign of the company website with focus on
      mobile experience and accessibility.
    </p>

    <div class="card-meta">
      <span class="badge">Design</span>
      <span class="card-date">Updated 2 days ago</span>
    </div>
  </div>

  <div class="card-footer">
    <button class="btn btn-secondary btn-sm">Edit</button>
    <button class="btn btn-primary btn-sm">View Project</button>
  </div>
</article>

<!-- Interactive Card (clickable) -->
<article class="card card-interactive">
  <a href="/projects/123" class="card-link">
    <img src="thumbnail.jpg" alt="" class="card-image">
    <div class="card-content">
      <h3 class="card-title">Mobile App Design</h3>
      <p class="card-description">
        Complete design system for iOS and Android apps
      </p>
    </div>
  </a>
</article>

<!-- Card with Status -->
<article class="card">
  <div class="card-status card-status-success">Active</div>
  <div class="card-content">
    <h3 class="card-title">Project Status</h3>
    <p>All systems operational</p>
  </div>
</article>
```

### Styles

```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 200ms, box-shadow 200ms;
}

/* Hover Effect (for interactive cards) */
.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-content {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.card-menu {
  padding: 8px;
  background: none;
  border: none;
  color: #757575;
  cursor: pointer;
  border-radius: 4px;
}

.card-menu:hover {
  background: #F5F5F5;
}

.card-description {
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #757575;
}

.card-footer {
  padding: 16px 20px;
  background: #F5F5F5;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Status Indicator */
.card-status {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-status-success {
  background: #E8F5E9;
  color: #2E7D32;
}

.card-status-warning {
  background: #FFF3E0;
  color: #E65100;
}

.card-status-error {
  background: #FFEBEE;
  color: #C62828;
}

/* Responsive Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
```

---

## Modal/Dialog Component

### Implementation

```html
<!-- Modal Overlay + Dialog -->
<div
  class="modal-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div class="modal">
    <!-- Header -->
    <div class="modal-header">
      <h2 id="modal-title" class="modal-title">
        Confirm Delete
      </h2>
      <button
        class="modal-close"
        aria-label="Close dialog"
        onclick="closeModal()"
      >
        <svg><use href="#icon-close"></use></svg>
      </button>
    </div>

    <!-- Body -->
    <div class="modal-body">
      <p id="modal-description">
        Are you sure you want to delete this project?
        This action cannot be undone.
      </p>
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">
        Cancel
      </button>
      <button class="btn btn-danger" onclick="confirmDelete()">
        Delete Project
      </button>
    </div>
  </div>
</div>
```

### Styles

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;

  /* Animation */
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  /* Animation */
  animation: slideUp 200ms ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 24px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E0E0E0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.modal-close {
  padding: 8px;
  background: none;
  border: none;
  color: #757575;
  cursor: pointer;
  border-radius: 4px;
}

.modal-close:hover {
  background: #F5F5F5;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

### JavaScript

```javascript
// Focus Management
function openModal(modalId) {
  const modal = document.getElementById(modalId);

  // Store previously focused element
  previouslyFocused = document.activeElement;

  // Show modal
  modal.style.display = 'flex';

  // Focus first focusable element
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) {
    focusable[0].focus();
  }

  // Trap focus within modal
  modal.addEventListener('keydown', trapFocus);

  // Close on ESC
  modal.addEventListener('keydown', handleEscape);

  // Close on backdrop click
  modal.addEventListener('click', handleBackdropClick);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);

  modal.style.display = 'none';
  modal.removeEventListener('keydown', trapFocus);
  modal.removeEventListener('keydown', handleEscape);

  // Return focus
  if (previouslyFocused) {
    previouslyFocused.focus();
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;

  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

function handleBackdropClick(e) {
  if (e.target === modal) {
    closeModal();
  }
}
```

---

## Toast Notification Component

### Implementation

```html
<!-- Toast Container (fixed position) -->
<div class="toast-container" role="region" aria-label="Notifications">
  <!-- Success Toast -->
  <div class="toast toast-success" role="alert" aria-live="polite">
    <svg class="toast-icon" aria-hidden="true">
      <use href="#icon-check"></use>
    </svg>
    <div class="toast-content">
      <div class="toast-title">Success!</div>
      <div class="toast-message">Your changes have been saved.</div>
    </div>
    <button class="toast-close" aria-label="Close notification">
      ×
    </button>
  </div>

  <!-- Error Toast with Action -->
  <div class="toast toast-error" role="alert" aria-live="assertive">
    <svg class="toast-icon" aria-hidden="true">
      <use href="#icon-error"></use>
    </svg>
    <div class="toast-content">
      <div class="toast-title">Error</div>
      <div class="toast-message">Failed to save changes.</div>
    </div>
    <button class="btn btn-sm">Retry</button>
    <button class="toast-close" aria-label="Close">×</button>
  </div>
</div>
```

### Styles

```css
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;

  animation: slideInRight 300ms ease-out;
}

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

.toast-success {
  border-color: #4CAF50;
}

.toast-error {
  border-color: #F44336;
}

.toast-warning {
  border-color: #FF9800;
}

.toast-info {
  border-color: #2196F3;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: #4CAF50;
}

.toast-error .toast-icon {
  color: #F44336;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: #616161;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #757575;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  line-height: 1;
}

.toast-close:hover {
  color: #212121;
}

/* Mobile */
@media (max-width: 640px) {
  .toast-container {
    left: 16px;
    right: 16px;
    max-width: none;
  }
}
```

---

## Best Practices Summary

### Component Checklist

Every component should have:

**Visual**:
- [ ] Clear visual hierarchy
- [ ] Consistent spacing (8px grid)
- [ ] Appropriate color contrast (WCAG AA)
- [ ] Smooth transitions (150-300ms)
- [ ] Responsive design (mobile-first)

**Interaction**:
- [ ] Hover states for interactive elements
- [ ] Active/pressed states
- [ ] Focus indicators (3px outline)
- [ ] Disabled states
- [ ] Loading states where applicable

**Accessibility**:
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Screen reader announcements
- [ ] Touch targets 44×44px minimum
- [ ] Color not sole indicator
- [ ] Form labels properly associated

**States**:
- [ ] Default
- [ ] Hover
- [ ] Active
- [ ] Focus
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Success
- [ ] Empty

**Documentation**:
- [ ] Purpose clearly defined
- [ ] Props/API documented
- [ ] Usage examples provided
- [ ] Do's and don'ts listed
- [ ] Accessibility notes included
