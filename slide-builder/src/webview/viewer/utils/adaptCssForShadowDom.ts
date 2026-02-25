/**
 * Adapt slide HTML CSS for Shadow DOM compatibility.
 *
 * Slide HTML is authored as a full document with `:root` and `body` selectors.
 * Inside a Shadow DOM these selectors don't match — `:root` targets the document
 * root (outside the shadow tree) and `<body>` is stripped during innerHTML parsing.
 *
 * This function remaps:
 *  - `:root {` → `:host {`  so CSS custom properties inherit into the shadow tree
 *  - `body {`  → `.slide, [data-slide-id] {`  so body-level styles (background,
 *     dimensions) apply to the slide wrapper element that exists in the shadow tree
 */
export function adaptCssForShadowDom(html: string): string {
  // Process only content inside <style> tags to avoid touching text content
  return html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_match, openTag: string, cssContent: string, closeTag: string) => {
      const adapted = cssContent
        // :root → :host (CSS custom properties)
        .replace(/:root\s*\{/g, ':host {')
        // body → .slide, [data-slide-id] (body-level styles)
        .replace(/\bbody\s*\{/g, '.slide, [data-slide-id] {');
      return openTag + adapted + closeTag;
    }
  );
}
