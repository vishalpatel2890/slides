/**
 * Tests for DeckTemplateDetail component.
 * Story Reference: v4-1-3 AC-1, AC-2, AC-3, AC-4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeckTemplateDetail } from '../../../src/webview/catalog/components/DeckTemplateDetail';
import type { DeckTemplateConfig } from '../../../src/shared/types';

const mockConfig: DeckTemplateConfig = {
  name: 'Company Overview',
  description: 'A standard company overview deck for client presentations',
  version: '1.0',
  slide_count: 3,
  required_context: [
    { name: 'client_name', type: 'string', description: 'Name of the client', prompt: 'Client name?' },
  ],
  optional_context: [
    { name: 'date', type: 'date', description: 'Presentation date', default: 'today' },
  ],
  slides: [
    {
      number: 1,
      name: 'Title Slide',
      file: 'slides/slide-1.html',
      instructions: 'Replace the title with the company name.\nAdd subtitle with date.',
      content_sources: [{ type: 'user_input', field: 'company_name' }],
    },
    {
      number: 2,
      name: 'Overview',
      file: 'slides/slide-2.html',
      instructions: 'Fill in the overview section with key facts.',
      content_sources: [
        { type: 'web_search', query: '{client_name} overview' },
        { type: 'file', path: 'data/overview.md' },
      ],
    },
    {
      number: 3,
      name: 'Summary',
      file: 'slides/slide-3.html',
      instructions: 'Summarize key takeaways.',
      content_sources: [],
    },
  ],
  checkpoints: {
    after_each_slide: true,
    validation_rules: ['All placeholders replaced'],
    user_interaction: { on_incomplete: 'ask', on_uncertain: 'ask', on_quality_fail: 'retry' },
  },
};

describe('DeckTemplateDetail', () => {
  const mockOnClose = vi.fn();
  const mockOnEditTemplate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPanel(config: DeckTemplateConfig | null = mockConfig) {
    return render(
      <DeckTemplateDetail
        config={config}
        templateId="company-overview"
        onClose={mockOnClose}
        onEditTemplate={mockOnEditTemplate}
      />,
    );
  }

  describe('Rendering (AC-1)', () => {
    it('renders null when config is null', () => {
      const { container } = renderPanel(null);
      expect(container.innerHTML).toBe('');
    });

    it('renders template name', () => {
      renderPanel();
      expect(screen.getByText('Company Overview')).toBeDefined();
    });

    it('renders template description', () => {
      renderPanel();
      expect(screen.getByText('A standard company overview deck for client presentations')).toBeDefined();
    });

    it('renders version', () => {
      renderPanel();
      expect(screen.getByText('v1.0')).toBeDefined();
    });

    it('renders slide count', () => {
      renderPanel();
      expect(screen.getByText('3 slides')).toBeDefined();
    });

    it('renders singular slide for count of 1', () => {
      const singleSlide = {
        ...mockConfig,
        slide_count: 1,
        slides: [mockConfig.slides[0]],
      };
      renderPanel(singleSlide);
      expect(screen.getByText('1 slide')).toBeDefined();
    });

    it('renders all slide names in the list', () => {
      renderPanel();
      expect(screen.getByText('Title Slide')).toBeDefined();
      expect(screen.getByText('Overview')).toBeDefined();
      expect(screen.getByText('Summary')).toBeDefined();
    });

    it('renders context variables summary', () => {
      renderPanel();
      expect(screen.getByText('1 required, 1 optional')).toBeDefined();
    });
  });

  describe('Accessibility (AC-4)', () => {
    it('has role="complementary"', () => {
      renderPanel();
      const panel = screen.getByRole('complementary');
      expect(panel).toBeDefined();
    });

    it('has accessible label', () => {
      renderPanel();
      const panel = screen.getByLabelText('Deck template details');
      expect(panel).toBeDefined();
    });

    it('has close button with aria-label', () => {
      renderPanel();
      const closeBtn = screen.getByLabelText('Close template details');
      expect(closeBtn).toBeDefined();
    });
  });

  describe('Slide expansion (AC-2)', () => {
    it('slides are collapsed by default', () => {
      renderPanel();
      // Instructions should not be visible initially
      expect(screen.queryByText('Replace the title with the company name.')).toBeNull();
    });

    it('clicking a slide row expands it to show instructions', () => {
      renderPanel();
      const slideButton = screen.getByRole('button', { name: /Title Slide/i });
      fireEvent.click(slideButton);

      expect(screen.getByText(/Replace the title with the company name/)).toBeDefined();
    });

    it('expanded slide shows file path', () => {
      renderPanel();
      const slideButton = screen.getByRole('button', { name: /Title Slide/i });
      fireEvent.click(slideButton);

      expect(screen.getByText('slides/slide-1.html')).toBeDefined();
    });

    it('expanded slide shows content sources', () => {
      renderPanel();
      const slideButton = screen.getByRole('button', { name: /Overview/i });
      fireEvent.click(slideButton);

      expect(screen.getByText('web_search')).toBeDefined();
      expect(screen.getByText('file')).toBeDefined();
    });

    it('clicking expanded slide collapses it', () => {
      renderPanel();
      const slideButton = screen.getByRole('button', { name: /Title Slide/i });

      // Expand
      fireEvent.click(slideButton);
      expect(screen.getByText(/Replace the title with the company name/)).toBeDefined();

      // Collapse
      fireEvent.click(slideButton);
      expect(screen.queryByText('Replace the title with the company name.')).toBeNull();
    });

    it('slide row has aria-expanded attribute', () => {
      renderPanel();
      const slideButton = screen.getByRole('button', { name: /Title Slide/i });
      expect(slideButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(slideButton);
      expect(slideButton.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Edit Template button (AC-3)', () => {
    it('renders Edit Template button', () => {
      renderPanel();
      expect(screen.getByLabelText('Edit template configuration')).toBeDefined();
    });

    it('clicking Edit Template calls onEditTemplate with templateId', () => {
      renderPanel();
      const editBtn = screen.getByLabelText('Edit template configuration');
      fireEvent.click(editBtn);

      expect(mockOnEditTemplate).toHaveBeenCalledWith('company-overview');
    });

    it('does not render Edit Template button when onEditTemplate is undefined', () => {
      render(
        <DeckTemplateDetail
          config={mockConfig}
          templateId="test"
          onClose={mockOnClose}
        />,
      );
      expect(screen.queryByLabelText('Edit template configuration')).toBeNull();
    });
  });

  describe('Close behavior (AC-4)', () => {
    it('clicking close button calls onClose', () => {
      renderPanel();
      const closeBtn = screen.getByLabelText('Close template details');
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('pressing Escape calls onClose', () => {
      renderPanel();
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escape does not close when focus is in an input', () => {
      const { container } = renderPanel();
      // Create a temporary input to simulate focus
      const input = document.createElement('input');
      container.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();

      container.removeChild(input);
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no slides configured', () => {
      const emptyConfig = { ...mockConfig, slide_count: 0, slides: [] };
      renderPanel(emptyConfig);
      expect(screen.getByText('No slides configured')).toBeDefined();
    });
  });

  describe('Content sources badge', () => {
    it('shows source count on slides with content sources', () => {
      renderPanel();
      // Overview slide has 2 sources — look for the badge "2"
      const badges = screen.getAllByTitle('Content sources');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('does not show source badge on slides without content sources', () => {
      // Summary slide (index 2) has 0 content sources
      renderPanel();
      const slideButtons = screen.getAllByRole('button', { name: /Summary/i });
      const summaryButton = slideButtons[0];
      // Should not contain a sources badge element
      expect(summaryButton.querySelector('.deck-template-detail__slide-sources')).toBeNull();
    });
  });

  // tm-2-3: Delete button tests (AC-5)
  describe('Delete button (tm-2-3)', () => {
    const mockOnDeleteTemplate = vi.fn();

    function renderPanelWithDelete() {
      return render(
        <DeckTemplateDetail
          config={mockConfig}
          templateId="company-overview"
          onClose={mockOnClose}
          onDeleteTemplate={mockOnDeleteTemplate}
        />,
      );
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders a Delete button with aria-label="Delete template" when onDeleteTemplate is provided (AC-5)', () => {
      renderPanelWithDelete();
      const deleteBtn = screen.getByLabelText('Delete template');
      expect(deleteBtn).toBeDefined();
    });

    it('clicking Delete button calls onDeleteTemplate with correct templateId (AC-5)', () => {
      renderPanelWithDelete();
      const deleteBtn = screen.getByLabelText('Delete template');
      fireEvent.click(deleteBtn);

      expect(mockOnDeleteTemplate).toHaveBeenCalledWith('company-overview');
    });

    it('does not render Delete button when onDeleteTemplate is not provided', () => {
      renderPanel(); // uses renderPanel without onDeleteTemplate
      expect(screen.queryByLabelText('Delete template')).toBeNull();
    });
  });

  // tm-3-4: Edit slide button tests (AC-1, AC-2)
  describe('Edit slide button (tm-3-4)', () => {
    const mockOnEditSlide = vi.fn();

    function renderPanelWithEdit() {
      return render(
        <DeckTemplateDetail
          config={mockConfig}
          templateId="company-overview"
          onClose={mockOnClose}
          onEditSlide={mockOnEditSlide}
        />,
      );
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders an Edit (Pencil) button for each slide when onEditSlide is provided (AC-1)', () => {
      renderPanelWithEdit();
      const editBtns = screen.getAllByRole('button', { name: /Edit slide/i });
      expect(editBtns.length).toBe(3);
    });

    it('Edit buttons have correct aria-labels including slide name (AC-1)', () => {
      renderPanelWithEdit();
      expect(screen.getByLabelText('Edit slide Title Slide')).toBeDefined();
      expect(screen.getByLabelText('Edit slide Overview')).toBeDefined();
      expect(screen.getByLabelText('Edit slide Summary')).toBeDefined();
    });

    it('clicking Edit button does NOT expand the slide row (stopPropagation)', () => {
      renderPanelWithEdit();
      const editBtn = screen.getByLabelText('Edit slide Title Slide');
      fireEvent.click(editBtn);

      // Row should remain collapsed — instructions not visible
      expect(screen.queryByText('Replace the title with the company name.')).toBeNull();
    });

    it('does not render Edit buttons when onEditSlide is not provided', () => {
      renderPanel(); // uses renderPanel without onEditSlide
      const editBtns = screen.queryAllByRole('button', { name: /Edit slide/i });
      expect(editBtns.length).toBe(0);
    });
  });

  // tm-2-2: Preview slide button tests (AC-1, AC-2)
  describe('Preview slide button (tm-2-2)', () => {
    const mockOnPreviewSlide = vi.fn();

    function renderPanelWithPreview() {
      return render(
        <DeckTemplateDetail
          config={mockConfig}
          templateId="company-overview"
          onClose={mockOnClose}
          onPreviewSlide={mockOnPreviewSlide}
        />,
      );
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders a Preview button for each slide when onPreviewSlide is provided (AC-1)', () => {
      renderPanelWithPreview();
      // mockConfig has 3 slides — expect 3 Preview buttons
      const previewBtns = screen.getAllByRole('button', { name: /Preview slide/i });
      expect(previewBtns.length).toBe(3);
    });

    it('Preview buttons have correct aria-labels (AC-1)', () => {
      renderPanelWithPreview();
      expect(screen.getByLabelText('Preview slide Title Slide')).toBeDefined();
      expect(screen.getByLabelText('Preview slide Overview')).toBeDefined();
      expect(screen.getByLabelText('Preview slide Summary')).toBeDefined();
    });

    it('clicking Preview button calls onPreviewSlide with correct templateId and slideFile (AC-2)', () => {
      renderPanelWithPreview();
      const previewBtn = screen.getByLabelText('Preview slide Title Slide');
      fireEvent.click(previewBtn);

      expect(mockOnPreviewSlide).toHaveBeenCalledWith('company-overview', 'slides/slide-1.html');
    });

    it('clicking Preview button does NOT expand the slide row (stopPropagation, AC-2)', () => {
      renderPanelWithPreview();
      const previewBtn = screen.getByLabelText('Preview slide Title Slide');
      fireEvent.click(previewBtn);

      // Row should remain collapsed — instructions not visible
      expect(screen.queryByText('Replace the title with the company name.')).toBeNull();
    });

    it('does not render Preview buttons when onPreviewSlide is not provided', () => {
      renderPanel(); // uses renderPanel without onPreviewSlide
      const previewBtns = screen.queryAllByRole('button', { name: /Preview slide/i });
      expect(previewBtns.length).toBe(0);
    });
  });
});
