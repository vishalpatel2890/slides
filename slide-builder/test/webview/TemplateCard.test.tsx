/**
 * Tests for TemplateCard component.
 * Story Reference: cv-5-1 Task 3 — TemplateCard component
 * Story Reference: cv-5-2 AC-12 — Deck template slide count badge
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplateCard } from '../../src/webview/catalog/components/TemplateCard';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../src/shared/types';

const mockSlideTemplate: SlideTemplateDisplay = {
  id: 'title-basic',
  name: 'Basic Title',
  description: 'A simple centered title slide for opening presentations or section dividers.',
  use_cases: ['Opening slides', 'Section dividers'],
  category: 'Title',
};

const mockDeckTemplate: DeckTemplateDisplay = {
  id: 'business-deck',
  name: 'Business Presentation',
  description: 'A professional deck template for business meetings.',
  path: '.slide-builder/templates/deck-templates/business',
  category: 'Business',
  slideCount: 12,
};

// Alias for backward compatibility
const mockTemplate = mockSlideTemplate;

function renderTemplateCard(
  overrides?: Partial<SlideTemplateDisplay>,
  onClick?: (template: SlideTemplateDisplay | DeckTemplateDisplay) => void
) {
  const template = { ...mockTemplate, ...overrides };
  return render(<TemplateCard template={template} onClick={onClick} />);
}

function renderDeckTemplateCard(
  overrides?: Partial<DeckTemplateDisplay>,
  onClick?: (template: SlideTemplateDisplay | DeckTemplateDisplay) => void
) {
  const template = { ...mockDeckTemplate, ...overrides };
  return render(<TemplateCard template={template} onClick={onClick} />);
}

describe('TemplateCard', () => {
  describe('Rendering (AC-2)', () => {
    it('renders template name', () => {
      renderTemplateCard();
      expect(screen.getByText('Basic Title')).toBeDefined();
    });

    it('renders description truncated to 2 lines', () => {
      renderTemplateCard();
      const description = screen.getByText(/A simple centered title slide/);
      expect(description).toBeDefined();
      expect(description.classList.contains('template-card__description')).toBe(true);
    });

    it('renders category chip', () => {
      renderTemplateCard();
      expect(screen.getByText('Title')).toBeDefined();
    });

    it('renders 16:9 preview area', () => {
      const { container } = renderTemplateCard();
      const preview = container.querySelector('.template-card__preview');
      expect(preview).not.toBeNull();
    });
  });

  describe('Accessibility (AC-10)', () => {
    it('has role="button"', () => {
      renderTemplateCard();
      expect(screen.getByRole('button')).toBeDefined();
    });

    it('has tabindex="0"', () => {
      renderTemplateCard();
      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });

    it('has comprehensive aria-label', () => {
      renderTemplateCard();
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Template: Basic Title, category: Title'
      );
    });
  });

  describe('Interaction', () => {
    it('calls onClick with template when clicked (AC-6)', () => {
      const onClick = vi.fn();
      renderTemplateCard(undefined, onClick);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(mockTemplate);
    });

    it('calls onClick on Enter key (AC-10)', () => {
      const onClick = vi.fn();
      renderTemplateCard(undefined, onClick);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(onClick).toHaveBeenCalledWith(mockTemplate);
    });

    it('calls onClick on Space key (AC-10)', () => {
      const onClick = vi.fn();
      renderTemplateCard(undefined, onClick);
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(onClick).toHaveBeenCalledWith(mockTemplate);
    });

    it('does not trigger on other keys', () => {
      const onClick = vi.fn();
      renderTemplateCard(undefined, onClick);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Read-only (AC-7)', () => {
    it('does not render edit button', () => {
      renderTemplateCard();
      expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    });

    it('does not render delete button', () => {
      renderTemplateCard();
      expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    });

    it('does not render context menu', () => {
      const { container } = renderTemplateCard();
      fireEvent.contextMenu(screen.getByRole('button'));
      // Should not find context menu content
      expect(container.querySelector('.template-context-menu')).toBeNull();
    });
  });

  describe('Styling', () => {
    it('applies template-card base class', () => {
      renderTemplateCard();
      expect(screen.getByRole('button').classList.contains('template-card')).toBe(true);
    });

    it('renders preview placeholder when no previewUri', () => {
      const { container } = renderTemplateCard();
      expect(container.querySelector('.template-card__preview-placeholder')).not.toBeNull();
    });

    it('renders preview image when previewUri provided', () => {
      renderTemplateCard({ previewUri: 'https://example.com/preview.png' });
      const img = screen.getByRole('img', { name: /Preview of Basic Title/ });
      expect(img).toBeDefined();
      expect(img).toHaveAttribute('src', 'https://example.com/preview.png');
    });
  });

  // cv-5-2: Deck template variant tests
  describe('Deck Template Variant (cv-5-2 AC-12)', () => {
    it('renders slide count badge for deck templates', () => {
      renderDeckTemplateCard();
      expect(screen.getByText('12 slides')).toBeDefined();
    });

    it('renders singular "slide" for count of 1', () => {
      renderDeckTemplateCard({ slideCount: 1 });
      expect(screen.getByText('1 slide')).toBeDefined();
    });

    it('does not render slide count badge for slide templates', () => {
      renderTemplateCard();
      expect(screen.queryByText(/slides?$/)).toBeNull();
    });

    it('does not render slide count badge when slideCount is 0', () => {
      renderDeckTemplateCard({ slideCount: 0 });
      expect(screen.queryByText(/slides?$/)).toBeNull();
    });

    it('renders deck template category', () => {
      renderDeckTemplateCard();
      expect(screen.getByText('Business')).toBeDefined();
    });

    it('includes slide count in aria-label for deck templates', () => {
      renderDeckTemplateCard();
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Template: Business Presentation, category: Business, 12 slides'
      );
    });

    it('calls onClick with deck template when clicked', () => {
      const onClick = vi.fn();
      renderDeckTemplateCard(undefined, onClick);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(mockDeckTemplate);
    });

    it('renders deck template preview image when previewUri provided', () => {
      renderDeckTemplateCard({ previewUri: 'https://example.com/deck-preview.png' });
      const img = screen.getByRole('img', { name: /Preview of Business Presentation/ });
      expect(img).toBeDefined();
      expect(img).toHaveAttribute('src', 'https://example.com/deck-preview.png');
    });
  });
});
