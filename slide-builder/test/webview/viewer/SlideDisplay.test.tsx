/**
 * Tests for SlideDisplay component.
 * v2-1-2 AC-4,5,6,7: Shadow DOM rendering, CSS isolation, styling
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlideDisplay } from '../../../src/webview/viewer/components/SlideDisplay';
import { ViewerProvider } from '../../../src/webview/viewer/context/ViewerContext';

// Helper to wrap component in ViewerProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<ViewerProvider>{ui}</ViewerProvider>);
}

// Helper to get Shadow DOM slide content (strips injected animation styles)
function getShadowContent(container: Element | null): string {
  const raw = container?.shadowRoot?.innerHTML ?? '';
  // Strip the <style data-shadow-animations> block and surrounding whitespace
  return raw.replace(/\s*<style data-shadow-animations[^>]*>[\s\S]*?<\/style>\s*/i, '').trim();
}

describe('SlideDisplay', () => {
  it('renders slide HTML via Shadow DOM (AC-4)', () => {
    const testHtml = '<h1>Test Slide</h1><p>Content here</p>';
    renderWithProvider(
      <SlideDisplay
        slideHtml={testHtml}
        slideNumber={1}
        slideTitle="Test Slide"
      />
    );

    const container = document.querySelector('.slide-display__container');
    expect(container).toBeInTheDocument();
    expect(getShadowContent(container)).toBe(testHtml);
  });

  it('has CSS containment class for style isolation (AC-5)', () => {
    renderWithProvider(
      <SlideDisplay
        slideHtml="<p>Test</p>"
        slideNumber={1}
      />
    );

    const container = document.querySelector('.slide-display__container');
    expect(container).toHaveClass('slide-display__container');
  });

  it('has accessible aria-label with slide info', () => {
    renderWithProvider(
      <SlideDisplay
        slideHtml="<p>Test</p>"
        slideNumber={3}
        slideTitle="Summary Slide"
      />
    );

    expect(screen.getByRole('region')).toHaveAttribute(
      'aria-label',
      'Slide 3: Summary Slide'
    );
  });

  it('updates Shadow DOM when slideHtml changes', () => {
    const { rerender } = renderWithProvider(
      <SlideDisplay
        slideHtml="<p>Original</p>"
        slideNumber={1}
      />
    );

    const container = document.querySelector('.slide-display__container');
    expect(getShadowContent(container)).toBe('<p>Original</p>');

    rerender(
      <ViewerProvider>
        <SlideDisplay
          slideHtml="<p>Updated</p>"
          slideNumber={1}
        />
      </ViewerProvider>
    );

    expect(getShadowContent(container)).toBe('<p>Updated</p>');
  });

  it('renders complex HTML with inline styles (AC-8)', () => {
    const complexHtml = `
      <style>.custom { color: red; }</style>
      <div style="font-size: 24px;">
        <h1 class="custom">Title</h1>
        <p style="margin: 20px;">Paragraph</p>
      </div>
    `.trim();

    renderWithProvider(
      <SlideDisplay
        slideHtml={complexHtml}
        slideNumber={1}
      />
    );

    const container = document.querySelector('.slide-display__container');
    const shadowContent = getShadowContent(container);
    expect(shadowContent).toContain('<style>');
    expect(shadowContent).toContain('style="font-size: 24px;"');
  });

  it('strips contenteditable artifacts from loaded HTML (v2-3-1)', () => {
    const dirtyHtml = '<h1 contenteditable="true" class="editable-active">Title</h1><p class="editable-hover">Text</p>';
    renderWithProvider(
      <SlideDisplay
        slideHtml={dirtyHtml}
        slideNumber={1}
      />
    );

    const container = document.querySelector('.slide-display__container');
    const shadowRoot = container?.shadowRoot;
    const h1 = shadowRoot?.querySelector('h1');
    const p = shadowRoot?.querySelector('p');
    expect(h1?.hasAttribute('contenteditable')).toBe(false);
    expect(h1?.classList.contains('editable-active')).toBe(false);
    expect(p?.classList.contains('editable-hover')).toBe(false);
  });
});
