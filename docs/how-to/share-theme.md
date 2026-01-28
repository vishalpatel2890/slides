# Share a theme

Export theme configuration for team use.

## What to share

The `.slide-builder/config/` directory contains shareable assets:
- `theme.json` - Brand theme
- `catalog/` - Template catalog with custom templates
- `theme-history/` - Version snapshots

## Steps

1. Create a zip archive:
   ```bash
   cd .slide-builder
   zip -r brand-config.zip config/
   ```

2. Share the archive with team members

3. Recipients extract to their project:
   ```bash
   cd their-project/.slide-builder
   unzip brand-config.zip
   ```

## What not to share

| Path | Reason |
|------|--------|
| `credentials/` | OAuth tokens are user-specific |
| `single/` | Workspace files |
| `deck/` | Workspace files |
| `status.yaml` | Session state |

## Alternative: Git

For version-controlled sharing:

1. Remove config from `.gitignore` (carefully)
2. Commit config directory
3. Team pulls changes

Note: Only do this if all team members should use the same theme.

## Receiving shared themes

1. Extract to `.slide-builder/config/`
2. Verify with `/sb:theme`
3. Generate sample slides to validate

## Related

- [Set up a theme](setup-theme.md)
- [Reference: Directory structure](../reference/directory-structure.md)
