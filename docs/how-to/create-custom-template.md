# Create a custom template

Build a new template through conversational design.

## Prerequisites

A configured theme.

## Steps

1. Run the add-template workflow:
   ```
   /sb:add-template
   ```

2. Describe your template requirements:
   ```
   I need a template for customer case studies.

   Structure:
   - Customer logo and name at top
   - Challenge section on left
   - Solution section on right
   - Results/metrics at bottom

   Use cases: case study, customer story, success story
   ```

3. Review the generated design

4. Provide feedback for refinement:
   - "Make the metrics section more prominent"
   - "Add space for a customer quote"
   - "Use the callout style for results"

5. Continue iteration until satisfied

6. Confirm to save the template

## Result

New template added to:
- `.slide-builder/config/catalog/{template-id}.html`
- Catalog entry in `catalog.json`

## Template requirements

The system ensures templates meet specifications:
- 1920x1080 dimensions
- CSS variable integration
- contenteditable text elements
- Proper use_cases keywords

## Testing the template

After creation:

1. Plan a slide matching your template:
   ```
   /sb:plan-one
   Create a case study slide for Acme Corp.
   ```

2. Verify the template matches

3. Build and review:
   ```
   /sb:build-one
   ```

## Modifying later

Edit existing templates directly in:
```
.slide-builder/config/catalog/{template-id}.html
```

Update `catalog.json` if changing metadata or use_cases.

## Related

- [Modify templates](modify-templates.md)
- [Core concepts: Catalog system](../core-concepts/catalog.md)
