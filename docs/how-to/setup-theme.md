# Set up a theme

Create a brand theme from company assets.

## Prerequisites

At least one of:
- Company website URL
- Brand guidelines PDF
- Logo or brand images

## Steps

1. Run the setup workflow:
   ```
   /sb:setup
   ```

2. Provide brand assets when prompted:
   - Website: `https://yourcompany.com`
   - PDF: `/path/to/brand-guidelines.pdf`
   - Images: `/path/to/logo.png`

3. Review extracted brand primitives:
   - Colors (primary, secondary, accent)
   - Typography (fonts, sizes, weights)
   - Shapes (border radius, shadows)
   - Personality (bold, minimal, etc.)

4. Review generated sample slides

5. Provide feedback if needed:
   - "Primary color should be darker"
   - "More modern typography"
   - "Add more contrast"

6. Repeat steps 4-5 until satisfied

7. Confirm to finalize theme

## Result

Theme saved to:
- `.slide-builder/config/theme.json`
- Version snapshot in `.slide-builder/config/theme-history/`

## Tips

- Website URLs provide the richest extraction
- Combine multiple asset types for better results
- Use specific feedback for faster iteration

## Related

- [Edit a theme](edit-theme.md)
- [Core concepts: Themes](../core-concepts/themes.md)
