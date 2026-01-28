# Quickstart

Create your first branded presentation in minutes.

## Prerequisites

- Claude Code CLI installed and configured
- A brand website URL or brand assets (optional)

## Step 1: Set up your brand theme

Start by creating a theme from your brand assets:

```
/sb:setup
```

The setup workflow guides you through:
1. Providing brand assets (website URL, PDFs, images)
2. Reviewing extracted brand primitives
3. Generating sample slides
4. Iterating with feedback until satisfied

If you have no brand assets, the workflow creates a professional default theme.

## Step 2: Plan your presentation

For a single slide:
```
/sb:plan-one
```

For a full deck:
```
/sb:plan-deck
```

Describe what you need in natural language. The system matches your intent to appropriate templates.

## Step 3: Build your slides

Build one slide at a time:
```
/sb:build-one
```

Or build all planned slides:
```
/sb:build-all
```

## Step 4: Edit and refine

Edit slides using natural language:
```
/sb:edit 3
```

Then describe changes like "make the heading larger" or "add more spacing between sections".

## Step 5: View your presentation

Open the generated viewer in your browser:
```
open output/{deck-name}/index.html
```

The viewer provides gallery thumbnails and fullscreen presentation mode.


## Next steps

- [Create a custom template](how-to/create-custom-template.md)
- [Edit themes with feedback](how-to/edit-theme.md)
- [Understand the theme system](core-concepts/themes.md)
