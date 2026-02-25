/**
 * Tests for SlidePreviewHighlighter component.
 * Story Reference: v4-1-5 AC-1, AC-2, AC-3, AC-4, AC-5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SlidePreviewHighlighter } from '../../../src/webview/catalog/components/SlidePreviewHighlighter';
import type { ContentSource } from '../../../src/shared/types';

const mockHtml = `
<div class="slide">
  <h1 id="s1-title">Company Name</h1>
  <p id="s1-subtitle">Subtitle Here</p>
  <div id="s1-body" data-field="body_content">Body text</div>
  <img id="s1-logo" src="logo.png" />
</div>
`;

const mockSources: ContentSource[] = [
  { type: 'user_input', field: 's1-title' },
  { type: 'web_search', query: '{client_name} overview' },
];

describe('SlidePreviewHighlighter', () => {
  const mockOnElementClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHighlighter(html: string | null = mockHtml) {
    return render(
      <SlidePreviewHighlighter
        html={html}
        contentSources={mockSources}
        onElementClick={mockOnElementClick}
      />,
    );
  }

  describe('Rendering (AC-1)', () => {
    it('renders empty state when html is null', () => {
      renderHighlighter(null);
      expect(screen.getByText('No slide preview available')).toBeDefined();
    });

    it('renders iframe with slide HTML', () => {
      renderHighlighter();
      const iframe = screen.getByTitle('Slide preview') as HTMLIFrameElement;
      expect(iframe).toBeDefined();
      expect(iframe.getAttribute('srcDoc')).toContain('Company Name');
    });

    it('has accessible region label', () => {
      renderHighlighter();
      expect(screen.getByRole('region', { name: 'Slide preview' })).toBeDefined();
    });
  });

  describe('Element extraction (AC-2)', () => {
    it('extracts elements with sN-* ID pattern', () => {
      renderHighlighter();
      expect(screen.getByText('s1-title')).toBeDefined();
      expect(screen.getByText('s1-subtitle')).toBeDefined();
      expect(screen.getByText('s1-body')).toBeDefined();
      expect(screen.getByText('s1-logo')).toBeDefined();
    });

    it('shows element count', () => {
      renderHighlighter();
      // 4 elements: s1-title, s1-subtitle, s1-body (also data-field), s1-logo
      // data-field "body_content" is also extracted but s1-body already exists
      expect(screen.getByText(/Editable Elements/)).toBeDefined();
    });

    it('extracts data-field attributes', () => {
      renderHighlighter();
      expect(screen.getByText('body_content')).toBeDefined();
    });
  });

  describe('Element interaction (AC-5)', () => {
    it('clicking element calls onElementClick', () => {
      renderHighlighter();
      const elementBtn = screen.getByLabelText('Element: s1-title');
      fireEvent.click(elementBtn);

      expect(mockOnElementClick).toHaveBeenCalledWith('s1-title');
    });
  });

  describe('Source type display (AC-3)', () => {
    it('shows source type for elements with matching sources', () => {
      renderHighlighter();
      // s1-title has a user_input source
      expect(screen.getByText('user_input')).toBeDefined();
    });
  });

  describe('Focused placeholder (AC-4)', () => {
    it('highlights focused element', () => {
      render(
        <SlidePreviewHighlighter
          html={mockHtml}
          contentSources={mockSources}
          focusedPlaceholder="s1-title"
          onElementClick={mockOnElementClick}
        />,
      );

      const elementBtn = screen.getByLabelText('Element: s1-title');
      expect(elementBtn.classList.contains('slide-preview-highlighter__element--focused')).toBe(true);
    });
  });
});
