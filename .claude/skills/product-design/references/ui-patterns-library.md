# UI Patterns Library

A comprehensive collection of common UI patterns with best practices and implementation examples.

## Navigation Patterns

### Top Navigation

**Best For**: 5-7 main sections, desktop-first applications

**Anatomy**:
- Logo (left)
- Main navigation items (center or left)
- User actions (right): notifications, profile, settings

**Best Practices**:
- Keep to 5-7 items maximum
- Highlight current section
- Sticky navigation for long pages
- Responsive: collapse to hamburger on mobile

```html
<nav class="top-nav">
  <div class="nav-logo">
    <img src="logo.svg" alt="Company Name">
  </div>
  <ul class="nav-items">
    <li><a href="/" class="active">Dashboard</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/team">Team</a></li>
    <li><a href="/analytics">Analytics</a></li>
  </ul>
  <div class="nav-actions">
    <button class="icon-button" aria-label="Notifications">
      <span class="badge">3</span>🔔
    </button>
    <button class="profile-menu">JD</button>
  </div>
</nav>
```

### Side Navigation

**Best For**: 8+ sections, dashboard applications, complex hierarchies

**Anatomy**:
- Logo/brand at top
- Collapsible sections
- Nested items (2 levels max)
- Footer actions (help, settings)

**Best Practices**:
- Collapsible on mobile/tablet
- Width: 200-280px expanded, 60-80px collapsed
- Show icons even when collapsed
- Highlight active section and subsection

```html
<aside class="side-nav" aria-label="Main navigation">
  <div class="nav-header">
    <img src="logo.svg" alt="Dashboard">
  </div>

  <nav class="nav-menu">
    <a href="/" class="nav-item active">
      <span class="icon">📊</span>
      <span class="label">Dashboard</span>
    </a>

    <div class="nav-section">
      <button class="nav-item expandable" aria-expanded="true">
        <span class="icon">📁</span>
        <span class="label">Projects</span>
        <span class="chevron">›</span>
      </button>
      <div class="nav-submenu">
        <a href="/projects/active" class="nav-subitem">Active</a>
        <a href="/projects/archived" class="nav-subitem">Archived</a>
      </div>
    </div>
  </nav>

  <div class="nav-footer">
    <a href="/settings" class="nav-item">
      <span class="icon">⚙️</span>
      <span class="label">Settings</span>
    </a>
  </div>
</aside>
```

### Bottom Navigation (Mobile)

**Best For**: Mobile apps, 3-5 primary destinations

**Best Practices**:
- 3-5 items maximum
- Icons + labels
- Thumb-friendly zone
- Highlight active destination
- Keep visible on scroll

```html
<nav class="bottom-nav">
  <a href="/" class="nav-item active">
    <span class="icon">🏠</span>
    <span class="label">Home</span>
  </a>
  <a href="/search" class="nav-item">
    <span class="icon">🔍</span>
    <span class="label">Search</span>
  </a>
  <a href="/create" class="nav-item primary">
    <span class="icon">➕</span>
  </a>
  <a href="/notifications" class="nav-item">
    <span class="icon">🔔</span>
    <span class="label">Alerts</span>
    <span class="badge">5</span>
  </a>
  <a href="/profile" class="nav-item">
    <span class="icon">👤</span>
    <span class="label">Profile</span>
  </a>
</nav>
```

### Breadcrumbs

**Best For**: Hierarchical content, e-commerce, documentation

**Best Practices**:
- Show full path from home
- Make each level clickable
- Collapse on mobile (show parent + current)
- Use chevrons (›) or slashes (/)

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/products/laptops">Laptops</a></li>
    <li aria-current="page">MacBook Pro 16"</li>
  </ol>
</nav>
```

### Tabs

**Best For**: Switching between related content views

**Best Practices**:
- 2-7 tabs maximum
- Highlight active tab
- Keep content above the fold
- Use panels for content
- Mobile: horizontal scroll if needed

```html
<div class="tabs" role="tablist">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="overview-panel"
    id="overview-tab"
    class="tab active"
  >
    Overview
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="analytics-panel"
    id="analytics-tab"
    class="tab"
  >
    Analytics
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="settings-panel"
    id="settings-tab"
    class="tab"
  >
    Settings
  </button>
</div>

<div
  role="tabpanel"
  id="overview-panel"
  aria-labelledby="overview-tab"
  class="tab-panel"
>
  <!-- Overview content -->
</div>
```

---

## Form Patterns

### Single Column Form

**Best Practice**: Use single column for all forms

**Why**:
- Faster completion (no eye scanning)
- Better mobile experience
- Clearer flow top-to-bottom

```html
<form class="single-column-form">
  <div class="form-field">
    <label for="name">Full Name</label>
    <input
      type="text"
      id="name"
      placeholder="John Doe"
      required
      aria-describedby="name-hint"
    >
    <span id="name-hint" class="hint">This will appear on your profile</span>
  </div>

  <div class="form-field">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      placeholder="john@example.com"
      required
    >
  </div>

  <div class="form-field">
    <label for="phone">Phone Number (Optional)</label>
    <input
      type="tel"
      id="phone"
      placeholder="555-123-4567"
      pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
    >
  </div>

  <button type="submit" class="btn-primary">Create Account</button>
</form>
```

### Inline Validation

**Best Practice**: Validate on blur or after user stops typing

```html
<div class="form-field">
  <label for="username">Username</label>
  <input
    type="text"
    id="username"
    aria-describedby="username-validation"
    class="valid"
  >
  <span id="username-validation" class="validation-message success">
    ✓ Username available
  </span>
</div>

<div class="form-field error">
  <label for="password">Password</label>
  <input
    type="password"
    id="password"
    aria-describedby="password-validation"
    aria-invalid="true"
  >
  <span id="password-validation" class="validation-message error">
    ✗ Password must be at least 8 characters
  </span>
</div>
```

### Multi-Step Form (Wizard)

**Best Practice**: Show progress, allow going back, save draft

```html
<div class="wizard">
  <!-- Progress indicator -->
  <div class="progress-steps" role="progressbar" aria-valuenow="2" aria-valuemin="1" aria-valuemax="4">
    <div class="step completed">
      <span class="step-number">1</span>
      <span class="step-label">Account</span>
    </div>
    <div class="step active">
      <span class="step-number">2</span>
      <span class="step-label">Profile</span>
    </div>
    <div class="step">
      <span class="step-number">3</span>
      <span class="step-label">Billing</span>
    </div>
    <div class="step">
      <span class="step-number">4</span>
      <span class="step-label">Review</span>
    </div>
  </div>

  <!-- Current step content -->
  <form class="wizard-step">
    <h2>Complete Your Profile</h2>
    <!-- Form fields -->

    <div class="wizard-actions">
      <button type="button" class="btn-secondary">Back</button>
      <button type="submit" class="btn-primary">Continue</button>
    </div>
  </form>
</div>
```

### Form Field Groups

**Best Practice**: Group related fields together

```html
<fieldset class="form-group">
  <legend>Shipping Address</legend>

  <div class="form-row">
    <div class="form-field">
      <label for="street">Street Address</label>
      <input type="text" id="street">
    </div>
  </div>

  <div class="form-row two-columns">
    <div class="form-field">
      <label for="city">City</label>
      <input type="text" id="city">
    </div>
    <div class="form-field">
      <label for="state">State</label>
      <select id="state">
        <option>Select state...</option>
      </select>
    </div>
  </div>

  <div class="form-row">
    <div class="form-field">
      <label for="zip">ZIP Code</label>
      <input type="text" id="zip" pattern="[0-9]{5}">
    </div>
  </div>
</fieldset>
```

---

## Data Display Patterns

### Table

**Best Practice**: Make sortable, filterable, responsive

```html
<div class="table-container">
  <!-- Table toolbar -->
  <div class="table-toolbar">
    <input
      type="search"
      placeholder="Search..."
      class="table-search"
      aria-label="Search table"
    >
    <button class="btn-secondary">Export</button>
  </div>

  <!-- Responsive table -->
  <table class="data-table">
    <thead>
      <tr>
        <th>
          <input type="checkbox" aria-label="Select all">
        </th>
        <th>
          <button class="sort-header" aria-sort="ascending">
            Name <span class="sort-icon">↑</span>
          </button>
        </th>
        <th>
          <button class="sort-header">
            Email <span class="sort-icon">↕</span>
          </button>
        </th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><input type="checkbox"></td>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td><span class="badge success">Active</span></td>
        <td>
          <button class="icon-button" aria-label="More actions">⋮</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Pagination -->
  <div class="table-pagination">
    <span>Showing 1-10 of 247</span>
    <div class="pagination">
      <button disabled>Previous</button>
      <button class="active">1</button>
      <button>2</button>
      <button>3</button>
      <button>Next</button>
    </div>
  </div>
</div>
```

### Cards

**Best Practice**: Use for heterogeneous content, visual browsing

```html
<div class="card-grid">
  <article class="card">
    <img src="project.jpg" alt="" class="card-image">
    <div class="card-content">
      <h3 class="card-title">Project Name</h3>
      <p class="card-description">
        Brief description of the project and its current status.
      </p>
      <div class="card-meta">
        <span class="badge">Design</span>
        <span class="date">Updated 2 days ago</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-secondary">Edit</button>
      <button class="btn-primary">Open</button>
    </div>
  </article>
</div>
```

### List

**Best Practice**: For homogeneous, scannable content

```html
<ul class="list">
  <li class="list-item">
    <div class="list-item-avatar">
      <img src="avatar.jpg" alt="">
    </div>
    <div class="list-item-content">
      <div class="list-item-title">John Doe</div>
      <div class="list-item-subtitle">john@example.com</div>
    </div>
    <div class="list-item-meta">
      <span class="badge">Admin</span>
    </div>
    <div class="list-item-actions">
      <button class="icon-button">⋮</button>
    </div>
  </li>
</ul>
```

### Empty States

**Best Practice**: Provide guidance on next action

```html
<div class="empty-state">
  <img src="empty-projects.svg" alt="" class="empty-state-image">
  <h2 class="empty-state-title">No projects yet</h2>
  <p class="empty-state-description">
    Get started by creating your first project. Projects help you organize
    your work and collaborate with your team.
  </p>
  <button class="btn-primary">Create Your First Project</button>
  <a href="/help/projects" class="link">Learn more about projects</a>
</div>
```

---

## Feedback Patterns

### Toast Notifications

**Best Practice**: Auto-dismiss, allow manual dismiss, don't block UI

```html
<div class="toast success" role="alert" aria-live="polite">
  <span class="toast-icon">✓</span>
  <span class="toast-message">Project saved successfully</span>
  <button class="toast-close" aria-label="Close">&times;</button>
</div>

<div class="toast error" role="alert" aria-live="assertive">
  <span class="toast-icon">✗</span>
  <div class="toast-content">
    <div class="toast-message">Failed to save project</div>
    <div class="toast-description">Please check your connection and try again</div>
  </div>
  <button class="toast-action">Retry</button>
  <button class="toast-close" aria-label="Close">&times;</button>
</div>
```

**Timing**:
- Success: 3-5 seconds
- Info: 5-7 seconds
- Error: Manual dismiss or 10+ seconds

### Loading States

**Skeleton Screens** (preferred for known layouts):
```html
<div class="skeleton-card">
  <div class="skeleton-image"></div>
  <div class="skeleton-text skeleton-title"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text short"></div>
</div>
```

**Spinners** (for indeterminate operations):
```html
<div class="spinner-container">
  <div class="spinner" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
  <p>Loading your dashboard...</p>
</div>
```

**Progress Bars** (for determinate operations):
```html
<div class="progress-container">
  <label for="upload-progress">Uploading file...</label>
  <progress
    id="upload-progress"
    value="67"
    max="100"
    aria-valuenow="67"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    67%
  </progress>
  <span class="progress-text">67% complete</span>
</div>
```

### Confirmation Dialogs

**Best Practice**: Make destructive action require explicit confirmation

```html
<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Delete Project?</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <p>
        Are you sure you want to delete "<strong>Website Redesign</strong>"?
        This action cannot be undone.
      </p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" autofocus>Cancel</button>
      <button class="btn-danger">Delete Project</button>
    </div>
  </div>
  <div class="modal-backdrop"></div>
</div>
```

### Banner Notifications

**Best Practice**: For persistent, important info

```html
<div class="banner info" role="region" aria-label="Announcement">
  <span class="banner-icon">ℹ️</span>
  <div class="banner-content">
    <strong>New Feature:</strong> You can now export projects to PDF.
    <a href="/help/pdf-export">Learn more</a>
  </div>
  <button class="banner-close" aria-label="Dismiss">&times;</button>
</div>

<div class="banner warning" role="alert">
  <span class="banner-icon">⚠️</span>
  <div class="banner-content">
    Your trial expires in 3 days.
    <a href="/upgrade">Upgrade now</a>
  </div>
</div>
```

---

## Input Patterns

### Search

**Best Practice**: Prominent, auto-suggest, show recent searches

```html
<div class="search-container">
  <label for="search" class="visually-hidden">Search</label>
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="search"
      id="search"
      placeholder="Search..."
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="search-results"
      aria-expanded="false"
    >
    <button class="search-clear" aria-label="Clear search" hidden>&times;</button>
  </div>

  <!-- Search suggestions dropdown -->
  <ul id="search-results" class="search-results" role="listbox" hidden>
    <li role="presentation" class="search-section-title">Recent Searches</li>
    <li role="option" class="search-result">
      <span class="search-icon">🕐</span>
      <span>Product design principles</span>
    </li>
    <li role="presentation" class="search-section-title">Suggestions</li>
    <li role="option" class="search-result">
      <span class="search-icon">🔍</span>
      <span>UI patterns</span>
    </li>
  </ul>
</div>
```

### Filters

**Best Practice**: Show active filters, allow clearing all

```html
<div class="filters">
  <button class="filter-trigger">
    Filters <span class="badge">2</span>
  </button>

  <!-- Active filters -->
  <div class="active-filters">
    <span class="filter-chip">
      Status: Active
      <button aria-label="Remove filter">&times;</button>
    </span>
    <span class="filter-chip">
      Team: Design
      <button aria-label="Remove filter">&times;</button>
    </span>
    <button class="link">Clear all</button>
  </div>

  <!-- Filter panel -->
  <div class="filter-panel" hidden>
    <div class="filter-group">
      <h3>Status</h3>
      <label>
        <input type="checkbox" checked> Active
      </label>
      <label>
        <input type="checkbox"> Archived
      </label>
    </div>

    <div class="filter-group">
      <h3>Team</h3>
      <label>
        <input type="checkbox" checked> Design
      </label>
      <label>
        <input type="checkbox"> Engineering
      </label>
    </div>

    <div class="filter-actions">
      <button class="btn-secondary">Reset</button>
      <button class="btn-primary">Apply Filters</button>
    </div>
  </div>
</div>
```

### Date Picker

**Best Practice**: Use native for mobile, custom for desktop

```html
<!-- Mobile: Native -->
<input type="date" id="date-mobile" class="date-input">

<!-- Desktop: Custom picker -->
<div class="date-picker">
  <button class="date-picker-trigger">
    <span class="selected-date">Mar 15, 2024</span>
    <span class="calendar-icon">📅</span>
  </button>

  <div class="date-picker-dropdown" hidden>
    <div class="date-picker-header">
      <button aria-label="Previous month">‹</button>
      <span>March 2024</span>
      <button aria-label="Next month">›</button>
    </div>
    <table class="calendar">
      <!-- Calendar grid -->
    </table>
  </div>
</div>
```

---

## Action Patterns

### Button Hierarchy

```html
<!-- Primary: Most important action -->
<button class="btn-primary">Save Changes</button>

<!-- Secondary: Alternative actions -->
<button class="btn-secondary">Cancel</button>

<!-- Tertiary: Subtle actions -->
<button class="btn-tertiary">Learn More</button>

<!-- Danger: Destructive actions -->
<button class="btn-danger">Delete Account</button>

<!-- Icon button: Actions with just icon -->
<button class="icon-button" aria-label="Settings">⚙️</button>
```

### Dropdown Menu

```html
<div class="dropdown">
  <button class="dropdown-trigger" aria-expanded="false" aria-haspopup="true">
    Actions ▾
  </button>

  <ul class="dropdown-menu" role="menu" hidden>
    <li role="menuitem">
      <button class="dropdown-item">
        <span class="icon">✏️</span>
        Edit
      </button>
    </li>
    <li role="menuitem">
      <button class="dropdown-item">
        <span class="icon">📋</span>
        Duplicate
      </button>
    </li>
    <li role="separator" class="dropdown-divider"></li>
    <li role="menuitem">
      <button class="dropdown-item danger">
        <span class="icon">🗑️</span>
        Delete
      </button>
    </li>
  </ul>
</div>
```

### Split Button

```html
<div class="split-button">
  <button class="btn-primary">Save</button>
  <button class="btn-primary dropdown-trigger" aria-label="More save options" aria-haspopup="true">
    ▾
  </button>

  <ul class="dropdown-menu" hidden>
    <li><button>Save and Close</button></li>
    <li><button>Save as Draft</button></li>
    <li><button>Save as Template</button></li>
  </ul>
</div>
```

---

## Modal Patterns

### Basic Modal

```html
<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Create New Project</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    </div>

    <div class="modal-body">
      <!-- Form or content -->
    </div>

    <div class="modal-footer">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Create Project</button>
    </div>
  </div>
  <div class="modal-backdrop"></div>
</div>
```

### Slide-over Panel

```html
<div class="slide-over" role="dialog" aria-labelledby="panel-title">
  <div class="slide-over-content">
    <div class="slide-over-header">
      <h2 id="panel-title">Project Settings</h2>
      <button class="close-button" aria-label="Close">&times;</button>
    </div>

    <div class="slide-over-body">
      <!-- Settings content -->
    </div>

    <div class="slide-over-footer">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Save Settings</button>
    </div>
  </div>
  <div class="slide-over-backdrop"></div>
</div>
```

---

## Best Practices Summary

### When to Use Each Pattern

**Navigation**:
- Top nav: 5-7 items, desktop-first
- Side nav: 8+ items, complex hierarchies
- Bottom nav: Mobile apps, 3-5 primary destinations
- Tabs: Switching related views

**Forms**:
- Single column: Always
- Inline validation: On blur or after typing stops
- Multi-step: 4+ steps or complex forms
- Field groups: Related information

**Data Display**:
- Tables: Scannable, comparable data
- Cards: Heterogeneous, visual content
- Lists: Homogeneous content
- Empty states: No data yet

**Feedback**:
- Toast: Quick confirmations
- Modal: Requires attention
- Banner: Persistent info
- Inline: Contextual to specific element

### Accessibility Requirements

All patterns must include:
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader support
- [ ] ARIA labels and roles
- [ ] Color contrast compliance
- [ ] Touch target size (44×44px min)

### Responsive Considerations

- Mobile-first approach
- Touch-friendly targets
- Simplified navigation on small screens
- Horizontal scroll for tabs if needed
- Stack columns on mobile
- Hide less important info on mobile
