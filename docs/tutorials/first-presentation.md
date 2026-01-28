# Your first presentation

Create a complete branded presentation from scratch.

## What we will build

A 5-slide presentation introducing a product or service, using Slide Builder's AI-assisted workflow.

## Step 1: Initialize the project

Start Claude Code in your project directory:

```bash
cd your-project
claude
```

## Step 2: Set up a brand theme

Run the setup workflow:

```
/sb:setup
```

When prompted for brand assets, you can provide:
- A website URL (e.g., `https://yourcompany.com`)
- PDF files with brand guidelines
- Image files with logos or brand materials

For this tutorial, provide a website URL. The system extracts:
- Primary and secondary colors
- Typography preferences
- Visual personality traits

Review the generated sample slides. If they need adjustment, provide feedback like:
- "Colors feel too muted"
- "Make it more professional"
- "Typography should be bolder"

Continue the feedback loop until satisfied, then confirm to finalize the theme.

## Step 3: Plan the deck

Run the deck planning workflow:

```
/sb:plan-deck
```

Describe your presentation:

```
Create a 5-slide product introduction for our analytics platform.
Audience: Technical decision makers.
Goal: Demonstrate value and drive evaluation.
```

The system generates a plan with:
- Narrative structure
- Slide-by-slide breakdown
- Template recommendations for each slide

Review the plan. You can request adjustments before proceeding.

## Step 4: Build the slides

Build all slides at once:

```
/sb:build-all
```

Or build one at a time to review each:

```
/sb:build-one
```

Each slide generates as an HTML file in `output/{deck-name}/slides/`.

## Step 5: Review in the viewer

Open the interactive viewer:

```bash
open output/{deck-name}/index.html
```

Features:
- Gallery view with thumbnails
- Fullscreen presentation mode
- Navigation controls

## Step 6: Edit slides

To modify a specific slide:

```
/sb:edit 3
```

Describe changes naturally:
- "Make the title larger"
- "Add more white space"
- "Move the bullet points to the right"

The system regenerates the layout while preserving your text edits.

## Step 7: Refine text content

Click any text element in the viewer to edit directly. Changes save automatically to the slide state.

## What we learned

- Setting up brand themes from assets
- Planning presentations with AI assistance
- Building slides from plans
- Editing with natural language
- Using the interactive viewer

## Next steps

- [Brand theme setup](brand-theme-setup.md) for deeper theme customization
- [Full deck workflow](full-deck-workflow.md) for complex presentations
- [How-to: Edit slides](../how-to/edit-slides.md) for editing techniques
