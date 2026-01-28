# Templates

Reference for built-in slide templates.

## title

Full-bleed hero slide for opening.

**Use cases**: title, opening, hero, intro

**Structure**:
- Large centered title
- Optional subtitle
- Full background

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│          HERO TITLE             │
│          Subtitle               │
│                                 │
└─────────────────────────────────┘
```

---

## agenda

Structured list for agendas and bullets.

**Use cases**: agenda, list, bullets, overview

**Structure**:
- Title header
- Numbered or bulleted items
- Optional timing column

**Layout**:
```
┌─────────────────────────────────┐
│ Title                           │
├─────────────────────────────────┤
│ 1. First item                   │
│ 2. Second item                  │
│ 3. Third item                   │
│ 4. Fourth item                  │
└─────────────────────────────────┘
```

---

## process-flow

Connected steps with arrows.

**Use cases**: flow, process, steps, timeline, roadmap

**Structure**:
- Horizontal or vertical flow
- Connected boxes
- Directional arrows

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│ [Step 1] → [Step 2] → [Step 3]  │
│                                 │
└─────────────────────────────────┘
```

---

## comparison

Side-by-side comparison layout.

**Use cases**: comparison, versus, before-after, columns

**Structure**:
- Two equal columns
- Optional headers
- Aligned content rows

**Layout**:
```
┌─────────────────────────────────┐
│ Title                           │
├───────────────┬─────────────────┤
│   Option A    │    Option B     │
│   • Point 1   │    • Point 1    │
│   • Point 2   │    • Point 2    │
└───────────────┴─────────────────┘
```

---

## callout

High-impact callout for stats or quotes.

**Use cases**: callout, statistic, quote, highlight, metric

**Structure**:
- Large central element
- Supporting context
- Visual emphasis

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│            23%                  │
│    Revenue Growth YoY           │
│                                 │
└─────────────────────────────────┘
```

---

## technical

Code-focused layout with syntax highlighting.

**Use cases**: code, technical, api, syntax, developer

**Structure**:
- Code block with highlighting
- Optional annotations
- Technical context

**Layout**:
```
┌─────────────────────────────────┐
│ API Integration                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ const client = new API();   │ │
│ │ const data = await fetch(); │ │
│ └─────────────────────────────┘ │
│ Note: Supports async/await      │
└─────────────────────────────────┘
```

---

## Template specifications

| Property | Value |
|----------|-------|
| Width | 1920px |
| Height | 1080px |
| Aspect ratio | 16:9 |
| Format | HTML5 |
| Styling | CSS variables |
| Editability | contenteditable |

## CSS variable usage

All templates use theme CSS variables:

```css
.title {
  color: var(--color-text-heading);
  font-family: var(--font-heading);
  font-size: var(--scale-h1);
}

.body {
  color: var(--color-text-body);
  font-family: var(--font-body);
}

.background {
  background: var(--color-background);
}
```
