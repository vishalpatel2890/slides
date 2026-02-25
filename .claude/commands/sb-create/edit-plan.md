---
description: 'Edit an existing deck plan via natural language instruction'
---

# Slide Builder - Edit Plan Command

Apply a targeted natural language edit to an existing deck plan (plan.yaml). Used by the Plan Editor's "Edit with Claude" modal.

**Usage:**
```
/sb-create:edit-plan Make the opening more compelling
/sb-create:edit-plan Add a slide about ROI after slide 3
/sb-create:edit-plan Change the audience to technical decision-makers
```

<steps CRITICAL="TRUE">
1. Read the workflow configuration at @.slide-builder/workflows/edit-plan/workflow.yaml
2. Read the instructions at @.slide-builder/workflows/edit-plan/instructions.md
3. Read the plan schema at @.slide-builder/workflows/plan/plan-schema.md
4. Read the plan editor context at `.slide-builder/plan-editor-context.md` (contains full deck context and the user's instruction)
5. Parse the argument as the edit instruction: $ARGUMENTS
6. Execute the workflow steps following instructions.md EXACTLY:
   - Step 1: Load context and plan.yaml
   - Step 2: Classify edit type (field, structural, narrative)
   - Step 3: Apply the edit
   - Step 4: Validate and write plan.yaml
   - Step 5: Report what changed
</steps>