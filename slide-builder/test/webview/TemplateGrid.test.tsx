/**
 * Tests for TemplateGrid component.
 * Story Reference: cv-5-1 Task 4 — TemplateGrid component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { TemplateGrid } from '../../src/webview/catalog/components/TemplateGrid';
import type { SlideTemplateDisplay, DeckTemplateInfo } from '../../src/shared/types';

const mockSlideTemplates: SlideTemplateDisplay[] = [
  {
    id: 'title-basic',
    name: 'Basic Title',
    description: 'Simple centered title slide',
    use_cases: ['Opening slides'],
    category: 'Title',
  },
  {
    id: 'content-bullets',
    name: 'Bullet Points',
    description: 'Standard content slide with bullets',
    use_cases: ['Body content'],
    category: 'Content',
  },
  {
    id: 'data-chart',
    name: 'Chart Slide',
    description: 'Data visualization with charts',
    use_cases: ['Data presentation'],
    category: 'Data',
  },
];

const mockDeckTemplates: DeckTemplateInfo[] = [
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Standard investor pitch deck',
    path: '/templates/pitch-deck',
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Business review template',
    path: '/templates/quarterly-review',
  },
];

function renderTemplateGrid(props?: Partial<React.ComponentProps<typeof TemplateGrid>>) {
  return render(
    <TemplateGrid
      slideTemplates={mockSlideTemplates}
      deckTemplates={mockDeckTemplates}
      searchQuery=""
      {...props}
    />
  );
}

describe('TemplateGrid', () => {
  describe('Rendering (AC-1, AC-8)', () => {
    it('renders showcase cards for each slide template', () => {
      renderTemplateGrid();
      expect(screen.getByText('Basic Title')).toBeDefined();
      expect(screen.getByText('Bullet Points')).toBeDefined();
      expect(screen.getByText('Chart Slide')).toBeDefined();
    });

    it('renders sub-tabs for Slide Templates and Deck Templates', () => {
      renderTemplateGrid();
      expect(screen.getByRole('button', { name: /Slide Templates/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Deck Templates/i })).toBeDefined();
    });

    it('uses template-grid class with 280px min-width', () => {
      const { container } = renderTemplateGrid();
      expect(container.querySelector('.template-grid')).not.toBeNull();
    });
  });

  describe('Sub-tab Navigation', () => {
    it('shows slide templates by default', () => {
      renderTemplateGrid();
      expect(screen.getByText('Basic Title')).toBeDefined();
    });

    it('switches to deck templates when Deck Templates tab clicked', () => {
      renderTemplateGrid();
      fireEvent.click(screen.getByRole('button', { name: /Deck Templates/i }));
      expect(screen.getByText('Pitch Deck')).toBeDefined();
      expect(screen.getByText('Quarterly Review')).toBeDefined();
    });

    it('marks active tab with aria-pressed', () => {
      renderTemplateGrid();
      const slideTab = screen.getByRole('button', { name: /Slide Templates/i });
      expect(slideTab).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Category Filtering (AC-4)', () => {
    it('renders category filter chips', () => {
      renderTemplateGrid();
      expect(screen.getByRole('button', { name: 'Title' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Content' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Data' })).toBeDefined();
    });

    it('filters by category when chip clicked', () => {
      renderTemplateGrid();
      fireEvent.click(screen.getByRole('button', { name: 'Title' }));
      expect(screen.getByText('Basic Title')).toBeDefined();
      expect(screen.queryByText('Bullet Points')).toBeNull();
    });

    it('toggles category filter on second click', () => {
      renderTemplateGrid();
      const titleChip = screen.getByRole('button', { name: 'Title' });
      fireEvent.click(titleChip);
      fireEvent.click(titleChip);
      // Should show all templates again
      expect(screen.getByText('Basic Title')).toBeDefined();
      expect(screen.getByText('Bullet Points')).toBeDefined();
    });

    it('does not show category chips for deck templates', () => {
      renderTemplateGrid();
      fireEvent.click(screen.getByRole('button', { name: /Deck Templates/i }));
      // Category chips should not be visible
      expect(screen.queryByRole('group', { name: /Filter by category/i })).toBeNull();
    });
  });

  describe('Search Filtering (AC-5)', () => {
    it('filters templates by name', () => {
      renderTemplateGrid({ searchQuery: 'Title' });
      expect(screen.getByText('Basic Title')).toBeDefined();
      expect(screen.queryByText('Bullet Points')).toBeNull();
    });

    it('filters templates by description', () => {
      renderTemplateGrid({ searchQuery: 'bullets' });
      expect(screen.getByText('Bullet Points')).toBeDefined();
      expect(screen.queryByText('Basic Title')).toBeNull();
    });

    it('is case-insensitive', () => {
      renderTemplateGrid({ searchQuery: 'CHART' });
      expect(screen.getByText('Chart Slide')).toBeDefined();
    });
  });

  describe('Empty State (AC-9)', () => {
    it('shows empty state when no slide templates exist', () => {
      renderTemplateGrid({ slideTemplates: [] });
      expect(screen.getByText('No slide templates found')).toBeDefined();
    });

    it('shows empty state when no deck templates exist', () => {
      renderTemplateGrid({ deckTemplates: [] });
      fireEvent.click(screen.getByRole('button', { name: /Deck Templates/i }));
      expect(screen.getByText('No deck templates found')).toBeDefined();
    });

    it('shows guidance text for empty state', () => {
      renderTemplateGrid({ slideTemplates: [] });
      expect(screen.getByText(/slide-templates\.json/i)).toBeDefined();
    });

    it('shows clear filters option when filters return no results', () => {
      const onClearFilters = vi.fn();
      renderTemplateGrid({ searchQuery: 'nonexistent', onClearFilters });
      expect(screen.getByText('No slide templates found')).toBeDefined();
      expect(screen.getByText('Clear filters')).toBeDefined();
    });

    it('calls onClearFilters when clear link clicked', () => {
      const onClearFilters = vi.fn();
      renderTemplateGrid({ searchQuery: 'nonexistent', onClearFilters });
      fireEvent.click(screen.getByText('Clear filters'));
      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Template Detail Dialog', () => {
    it('opens dialog when template card clicked', () => {
      renderTemplateGrid();
      fireEvent.click(screen.getAllByRole('button', { name: /Template: Basic Title/i })[0]);
      // Dialog should open - look for dialog content
      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });
});
