/**
 * Tests for TemplateDetail component.
 * Story Reference: cv-5-1 Task 5 — TemplateDetail dialog
 * Story Reference: cv-5-2 AC-15, AC-16 — Deck template preview and "Use Template" CTA
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplateDetail } from '../../src/webview/catalog/components/TemplateDetail';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../src/shared/types';

const mockSlideTemplate: SlideTemplateDisplay = {
  id: 'title-basic',
  name: 'Basic Title',
  description: 'A simple centered title slide for opening presentations or section dividers. Features large centered text with optional subtitle.',
  use_cases: ['Opening slides', 'Section dividers', 'Chapter breaks'],
  category: 'Title',
};

const mockDeckTemplate: DeckTemplateDisplay = {
  id: 'business-deck',
  name: 'Business Presentation',
  description: 'A professional deck template for business meetings and pitches.',
  path: '.slide-builder/templates/deck-templates/business',
  category: 'Business',
  slideCount: 12,
};

// Alias for backward compatibility
const mockTemplate = mockSlideTemplate;

function renderTemplateDetail(
  template: SlideTemplateDisplay | DeckTemplateDisplay | null,
  open: boolean,
  onOpenChange = vi.fn(),
  onUseTemplate?: (templateId: string) => void
) {
  return render(
    <TemplateDetail
      template={template}
      open={open}
      onOpenChange={onOpenChange}
      onUseTemplate={onUseTemplate}
    />
  );
}

describe('TemplateDetail', () => {
  describe('Rendering when closed', () => {
    it('renders nothing when template is null and closed', () => {
      const { container } = renderTemplateDetail(null, false);
      expect(container.querySelector('.template-detail-content')).toBeNull();
    });
  });

  describe('Rendering when open (AC-6)', () => {
    it('renders dialog when template provided and open', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('displays template name as dialog title', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByText('Basic Title')).toBeDefined();
    });

    it('displays complete description (not truncated)', () => {
      renderTemplateDetail(mockTemplate, true);
      const description = screen.getByText(/A simple centered title slide/);
      expect(description.textContent).toContain('optional subtitle');
    });

    it('displays category chip', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByText('Title')).toBeDefined();
    });

    it('displays use cases as bullet list', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByText('Use Cases')).toBeDefined();
      expect(screen.getByText('Opening slides')).toBeDefined();
      expect(screen.getByText('Section dividers')).toBeDefined();
      expect(screen.getByText('Chapter breaks')).toBeDefined();
    });

    it('displays preview placeholder when no previewUri', () => {
      renderTemplateDetail(mockTemplate, true);
      // Portal renders outside container, use document.querySelector
      expect(document.querySelector('.template-detail__preview-placeholder')).not.toBeNull();
    });

    it('displays preview image when previewUri provided', () => {
      const templateWithPreview = { ...mockTemplate, previewUri: 'https://example.com/preview.png' };
      renderTemplateDetail(templateWithPreview, true);
      const img = screen.getByRole('img', { name: /Preview of Basic Title/i });
      expect(img).toHaveAttribute('src', 'https://example.com/preview.png');
    });
  });

  describe('Dialog behavior', () => {
    it('calls onOpenChange with false when close button clicked', () => {
      const onOpenChange = vi.fn();
      renderTemplateDetail(mockTemplate, true, onOpenChange);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('has close button with aria-label', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByRole('button', { name: /close/i })).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('dialog has role="dialog"', () => {
      renderTemplateDetail(mockTemplate, true);
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('dialog has aria-describedby linking to description', () => {
      renderTemplateDetail(mockTemplate, true);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'template-detail-description');
      // Portal renders outside container, use document.querySelector
      expect(document.querySelector('#template-detail-description')).not.toBeNull();
    });
  });

  describe('Deck templates (cv-5-2)', () => {
    it('shows deck template category', () => {
      renderTemplateDetail(mockDeckTemplate, true);
      expect(screen.getByText('Business')).toBeDefined();
    });

    it('shows slide count badge for deck templates (AC-15)', () => {
      renderTemplateDetail(mockDeckTemplate, true);
      expect(screen.getByText(/12 slides/)).toBeDefined();
    });

    it('shows singular "slide" for count of 1', () => {
      const singleSlideTemplate = { ...mockDeckTemplate, slideCount: 1 };
      renderTemplateDetail(singleSlideTemplate, true);
      expect(screen.getByText(/1 slide/)).toBeDefined();
    });

    it('does not show slide count badge for 0 slides', () => {
      const zeroSlideTemplate = { ...mockDeckTemplate, slideCount: 0 };
      renderTemplateDetail(zeroSlideTemplate, true);
      expect(screen.queryByText(/slides?$/)).toBeNull();
    });

    it('does not render use cases section for deck templates', () => {
      renderTemplateDetail(mockDeckTemplate, true);
      expect(screen.queryByText('Use Cases')).toBeNull();
    });

    it('renders "Use Template" button when onUseTemplate provided (AC-16)', () => {
      const onUseTemplate = vi.fn();
      renderTemplateDetail(mockDeckTemplate, true, vi.fn(), onUseTemplate);
      expect(screen.getByRole('button', { name: /use.*template/i })).toBeDefined();
    });

    it('does not render "Use Template" button without onUseTemplate callback', () => {
      renderTemplateDetail(mockDeckTemplate, true);
      expect(screen.queryByRole('button', { name: /use.*template/i })).toBeNull();
    });

    it('calls onUseTemplate with templateId when "Use Template" clicked (AC-16)', () => {
      const onUseTemplate = vi.fn();
      const onOpenChange = vi.fn();
      renderTemplateDetail(mockDeckTemplate, true, onOpenChange, onUseTemplate);
      fireEvent.click(screen.getByRole('button', { name: /use.*template/i }));
      expect(onUseTemplate).toHaveBeenCalledWith('business-deck');
    });

    it('closes dialog after "Use Template" is clicked', () => {
      const onUseTemplate = vi.fn();
      const onOpenChange = vi.fn();
      renderTemplateDetail(mockDeckTemplate, true, onOpenChange, onUseTemplate);
      fireEvent.click(screen.getByRole('button', { name: /use.*template/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not render "Use Template" button for slide templates', () => {
      const onUseTemplate = vi.fn();
      renderTemplateDetail(mockSlideTemplate, true, vi.fn(), onUseTemplate);
      expect(screen.queryByRole('button', { name: /use.*template/i })).toBeNull();
    });
  });
});
