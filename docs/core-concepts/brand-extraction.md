# Brand extraction

How themes are extracted from brand assets.

## Extraction process

1. **Asset analysis**: System examines provided URLs, PDFs, images
2. **Primitive extraction**: Colors, fonts, shapes identified
3. **Pattern recognition**: Design patterns and styles detected
4. **Personality classification**: Brand personality determined
5. **Theme synthesis**: Components combined into theme.json

## Asset types

### Website URLs

Most comprehensive extraction source:
- CSS stylesheets analyzed
- Color palette extracted
- Typography identified
- Visual patterns detected

```
https://yourcompany.com
```

### PDF files

Brand guidelines and marketing materials:
- Color swatches extracted
- Font specimens identified
- Layout patterns noted

```
/path/to/brand-guidelines.pdf
```

### Images

Logos, marketing images, screenshots:
- Dominant colors extracted
- Visual style analyzed
- Mood/personality inferred

```
/path/to/logo.png
/path/to/hero-image.jpg
```

## Extraction capabilities

### Colors

| Extracted | Method |
|-----------|--------|
| Primary | Most prominent brand color |
| Secondary | Supporting color |
| Accent | Call-to-action color |
| Background | Page/section backgrounds |
| Text | Heading and body colors |

### Typography

| Extracted | Method |
|-----------|--------|
| Font families | CSS analysis, PDF inspection |
| Size scale | Heading hierarchy |
| Weights | Bold, regular, light usage |

### Shapes

| Extracted | Method |
|-----------|--------|
| Border radius | Button/card corners |
| Shadows | Elevation patterns |
| Borders | Line treatments |

### Personality

Classification based on overall visual impression:
- **Bold**: High contrast, strong type
- **Minimal**: Clean, lots of whitespace
- **Playful**: Bright colors, rounded shapes
- **Corporate**: Professional, structured

## Confidence scoring

Extraction includes confidence score (0-1):
- Higher with more/better sources
- Lower with limited/unclear assets
- Informs feedback suggestions

## Improving extraction

For best results:
- Provide website URL first
- Add brand guidelines PDF
- Include high-quality logo
- Describe brand in words

## Related

- [How-to: Set up a theme](../how-to/setup-theme.md)
- [Themes](themes.md)
