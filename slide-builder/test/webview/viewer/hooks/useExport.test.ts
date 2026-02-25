/**
 * Tests for useExport CSS rewriting functionality.
 * v2-5-2: Enhanced CSS selector rewriting for export capture.
 *
 * Story Reference: v2-5-2 AC-1, AC-5 — CSS selector coverage
 *
 * Note: Tests use regex matching to be flexible about whitespace since
 * CSS is functionally equivalent with or without spaces around braces.
 */
import { describe, it, expect } from 'vitest';
import { adaptCssForExport } from '../../../../src/webview/viewer/hooks/useExport';

/**
 * Helper to normalize CSS whitespace for comparison.
 * Collapses multiple spaces and removes spaces around braces.
 */
function normalizeCSS(css: string): string {
  return css.replace(/\s+/g, ' ').replace(/\s*\{\s*/g, '{').replace(/\s*\}\s*/g, '}').trim();
}

describe('adaptCssForExport', () => {
  describe('simple selectors', () => {
    it('should rewrite "html {" to ".export-root {"', () => {
      const input = '<style>html { background: #000; }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{background: #000;}');
      expect(result).not.toMatch(/\bhtml\s*\{/);
    });

    it('should rewrite "body {" to target container and slide elements', () => {
      // v2-5-2: body styles must apply to both container AND .slide element (like viewer does)
      const input = '<style>body { font-family: sans-serif; }</style>';
      const result = adaptCssForExport(input);
      // Should target .export-root and .slide elements
      expect(result).toMatch(/\.export-root.*\.slide/);
      expect(result).toContain('font-family: sans-serif;');
      expect(result).not.toMatch(/\bbody\s*\{/);
    });
  });

  describe('compound selectors (AC-5)', () => {
    it('should rewrite "html, body {" to ".export-root {"', () => {
      const input = '<style>html, body { margin: 0; padding: 0; }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{margin: 0; padding: 0;}');
      // Should not have duplicate selectors
      expect(result).not.toContain('.export-root, .export-root');
    });

    it('should rewrite "body, html {" to ".export-root {"', () => {
      const input = '<style>body, html { height: 100%; }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{height: 100%;}');
    });
  });

  describe('descendant combinators (AC-5)', () => {
    it('should rewrite "html body {" to ".export-root {"', () => {
      const input = '<style>html body { color: white; }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{color: white;}');
    });

    it('should rewrite "html > body {" to ".export-root {"', () => {
      const input = '<style>html > body { background: linear-gradient(#000, #333); }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{background: linear-gradient(#000, #333);}');
    });

    it('should rewrite ":root body {" to ".export-root {"', () => {
      const input = '<style>:root body { font-size: 16px; }</style>';
      const result = adaptCssForExport(input);
      expect(normalizeCSS(result)).toContain('.export-root{font-size: 16px;}');
    });
  });

  describe('descendant selectors with children', () => {
    it('should rewrite "body > div {" to ".export-root > div {"', () => {
      const input = '<style>body > div { padding: 20px; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.export-root\s*>\s*div/);
      expect(normalizeCSS(result)).toContain('padding: 20px;');
    });

    it('should rewrite "body .container {" to ".export-root .container {"', () => {
      const input = '<style>body .container { max-width: 1200px; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.export-root\s*\.container/);
      expect(normalizeCSS(result)).toContain('max-width: 1200px;');
    });

    it('should rewrite "html .wrapper {" to ".export-root .wrapper {"', () => {
      const input = '<style>html .wrapper { display: flex; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.export-root\s*\.wrapper/);
      expect(normalizeCSS(result)).toContain('display: flex;');
    });
  });

  describe(':root handling', () => {
    it('should convert ":root {" to ".export-root {" for CSS variables', () => {
      // v2-5-2: :root must be converted so CSS custom properties work in export container
      const input = '<style>:root { --primary-color: blue; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.export-root\s*\{/);
      expect(normalizeCSS(result)).toContain('--primary-color: blue;');
    });

    it('should preserve ":root .class {" for CSS scoping', () => {
      // Note: :root .class patterns are preserved since they are descendant selectors
      // and the :root { } conversion handles variable inheritance
      const input = '<style>:root .slide { width: 100%; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/:root\s+\.slide/);
      expect(normalizeCSS(result)).toContain('width: 100%;');
    });
  });

  describe('@-rules preservation', () => {
    it('should preserve @keyframes rules', () => {
      const input = '<style>@keyframes fade { from { opacity: 0; } to { opacity: 1; } }</style>';
      const result = adaptCssForExport(input);
      expect(result).toContain('@keyframes fade');
    });

    it('should preserve @font-face rules', () => {
      const input = `<style>@font-face { font-family: 'Custom'; src: url('/font.woff2'); }</style>`;
      const result = adaptCssForExport(input);
      expect(result).toContain('@font-face');
      expect(result).toContain("font-family: 'Custom'");
    });

    it('should preserve @media queries', () => {
      const input = '<style>@media (min-width: 768px) { .container { width: 750px; } }</style>';
      const result = adaptCssForExport(input);
      expect(result).toContain('@media (min-width: 768px)');
    });
  });

  describe('unrelated selectors', () => {
    it('should not modify selectors without html/body', () => {
      const input = '<style>.slide-container { display: flex; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.slide-container\s*\{/);
      expect(normalizeCSS(result)).toContain('display: flex;');
    });

    it('should not modify class selectors', () => {
      const input = '<style>.title { font-size: 48px; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.title\s*\{/);
      expect(normalizeCSS(result)).toContain('font-size: 48px;');
    });

    it('should not modify ID selectors', () => {
      const input = '<style>#main { padding: 20px; }</style>';
      const result = adaptCssForExport(input);
      expect(result).toMatch(/#main\s*\{/);
      expect(normalizeCSS(result)).toContain('padding: 20px;');
    });
  });

  describe('multiple style blocks', () => {
    it('should process all style blocks in HTML', () => {
      const input = `
        <style>html { background: black; }</style>
        <div class="content">Hello</div>
        <style>body { color: white; }</style>
      `;
      const result = adaptCssForExport(input);
      // html { → .export-root {
      expect(result).toMatch(/\.export-root\s*\{\s*background:\s*black;/);
      // body { → .export-root, .export-root .slide... { (matches viewer behavior)
      expect(result).toContain('color: white;');
      expect(result).toMatch(/\.export-root.*\.slide/);
    });
  });

  describe('complex real-world cases', () => {
    it('should handle multiple rules with html/body and other selectors', () => {
      const input = `<style>
        html, body { margin: 0; padding: 0; }
        .slide { width: 1920px; height: 1080px; }
        body > .content { padding: 40px; }
      </style>`;
      const result = adaptCssForExport(input);
      expect(result).toMatch(/\.export-root\s*\{\s*margin:\s*0;\s*padding:\s*0;/);
      expect(result).toMatch(/\.slide\s*\{\s*width:\s*1920px;/);
      expect(result).toMatch(/\.export-root\s*>\s*\.content\s*\{\s*padding:\s*40px;/);
    });
  });
});
