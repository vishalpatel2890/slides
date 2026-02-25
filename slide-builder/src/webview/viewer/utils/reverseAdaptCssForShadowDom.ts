/**
 * Reverse Shadow DOM CSS adaptations for standalone HTML output.
 *
 * This is the inverse of {@link adaptCssForShadowDom} — it restores CSS selectors
 * to their original standalone-document form so saved HTML files render correctly
 * outside of Shadow DOM (in PresentServer iframes, browser file access, etc.).
 *
 * This function remaps:
 *  - `:host {` → `:root {`  so CSS custom properties resolve on the document root
 *  - `.slide, [data-slide-id] {` → `body {`  so body-level styles apply normally
 */
export function reverseAdaptCssForShadowDom(html: string): string {
  // Process only content inside <style> tags to avoid touching text content
  return html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_match, openTag: string, cssContent: string, closeTag: string) => {
      const reversed = cssContent
        // :host → :root (CSS custom properties)
        .replace(/:host\s*\{/g, ':root {')
        // .slide, [data-slide-id] → body (body-level styles)
        .replace(/\.slide,\s*\[data-slide-id\]\s*\{/g, 'body {')
      return openTag + reversed + closeTag
    }
  )
}
