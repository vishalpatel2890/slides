# Template creation

Build custom slide templates for specialized layouts.

## When to create templates

- Frequently used layouts not in the catalog
- Organization-specific slide types
- Complex visualizations
- Branded content patterns

## Prerequisites

- Configured theme
- Clear idea of the template purpose
- Example content for validation

## Step 1: Start the template workflow

```
/sb-manage:add-slide-template
```

## Step 2: Describe your template

Provide detailed requirements:

```
Create a template for initiative summaries.

Structure:
- Left panel: Problem statement and solution description
- Right panel: Key benefits with icons
- Footer: Timeline or next steps

Use cases: Strategic initiatives, project proposals, transformation plans
```

## Step 3: Review the design

The system uses the frontend-design skill to create a professional template. You see:

- HTML structure
- CSS styling (using theme variables)
- Sample content
- Preview rendering

## Step 4: Provide feedback

Iterate on the design:

```
Make the left panel wider.
Add more visual separation between benefits.
Include a spot for a key metric.
```

Continue until satisfied.

## Step 5: Finalize and catalog

The template saves to `.slide-builder/config/catalog/` with:

- Template HTML file
- Catalog entry with metadata
- Use case keywords for matching

## Template requirements

Templates must include:

**Dimensions**:
```css
width: 1920px;
height: 1080px;
```

**Theme integration**:
```css
font-family: var(--font-heading);
color: var(--color-primary);
background: var(--color-background);
```

**Editable content**:
```html
<h1 contenteditable="true">Title</h1>
<p contenteditable="true">Body text</p>
```

## Catalog entry structure

```json
{
  "id": "your-template",
  "name": "Template Name",
  "description": "What this template is for",
  "use_cases": ["keyword1", "keyword2", "keyword3"],
  "file": "your-template.html"
}
```

## What we learned

- Creating templates through conversation
- Integrating with the theme system
- Adding templates to the catalog

## Next steps

- [Reference: Templates](../reference/templates.md) for template specifications
- [Core concepts: Catalog system](../core-concepts/catalog.md)
- [How-to: Modify templates](../how-to/modify-templates.md)
