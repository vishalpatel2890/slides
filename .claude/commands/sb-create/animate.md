---
description: 'Generate animation build groups for a slide using AI analysis of content structure'
---

# Slide Builder - Animate Command

Generate intelligent animation groups for a slide based on its content structure, template type, and narrative flow.

**Usage:**
- `/sb:animate [slide_number]` - Generate animations for the specified slide
- When invoked from the viewer's "Animate with AI" button, the deck context (`Deck: {slug}`) is automatically included in the prompt, skipping deck selection

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/animate/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/animate/instructions.md
3. Parse the argument (if provided) as slide_number: $ARGUMENTS
4. Execute the workflow steps following instructions.md EXACTLY:
   - Step 1: Read status.yaml for deck detection and validate slide number
   - Step 2: Load slide HTML, plan.yaml context, and check existing animations
   - Step 3: Analyze DOM structure, classify elements, generate animation groups
   - Step 4: Present animation plan to user for approval
   - Step 5: Apply animations (build IDs, manifest, regenerate viewer)
   - Step 6: Open browser and report results
5. Update .slide-builder/status.yaml with the action
</steps>
