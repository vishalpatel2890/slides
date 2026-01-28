# Roll back a theme

Restore a previous theme version.

## Prerequisites

Theme history in `.slide-builder/config/theme-history/`.

## Steps

1. List available versions:
   ```bash
   ls .slide-builder/config/theme-history/
   ```

   Output:
   ```
   theme-v1-2026-01-15.json
   theme-v2-2026-01-20.json
   theme-v3-2026-01-28.json
   ```

2. Review a previous version:
   ```bash
   cat .slide-builder/config/theme-history/theme-v2-2026-01-20.json
   ```

3. Restore the version:
   ```bash
   cp .slide-builder/config/theme-history/theme-v2-2026-01-20.json .slide-builder/config/theme.json
   ```

4. Verify restoration:
   ```
   /sb:theme
   ```

## Version naming

Snapshots follow the pattern:
```
theme-v{version}-{YYYY-MM-DD}.json
```

## After rollback

Regenerate slides to apply the restored theme:
- Use `/sb:build-all` for full rebuild
- Or regenerate specific slides with `/sb:build-one`

## Related

- [Edit a theme](edit-theme.md)
- [Core concepts: Themes](../core-concepts/themes.md)
