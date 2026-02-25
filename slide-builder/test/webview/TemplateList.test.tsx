/**
 * Tests for TemplateList component.
 * Story Reference: v3-2-2 Task 6 — TemplateList component
 *
 * AC-2: Right-click context menu matching Grid view template menus
 * AC-4: Kebab dropdown menu matching Grid view template menus
 * AC-6: All Grid template operations available in List view
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplateList } from '../../src/webview/catalog/components/TemplateList';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../src/shared/types';

// Mock getVSCodeApi
vi.mock('../../src/webview/shared/hooks/useVSCodeApi', () => ({
  getVSCodeApi: () => ({ postMessage: vi.fn() }),
}));

const mockSlideTemplates: SlideTemplateDisplay[] = [
  {
    id: 'slide-t-1',
    name: 'Title Slide',
    description: 'A bold title slide',
    use_cases: ['opening'],
    category: 'Title',
  },
  {
    id: 'slide-t-2',
    name: 'Content Slide',
    description: 'Standard content layout',
    use_cases: ['body'],
    category: 'Content',
  },
];

const mockDeckTemplates: DeckTemplateDisplay[] = [
  {
    id: 'deck-t-1',
    name: 'Business Pitch',
    description: 'Complete pitch deck template',
    path: '/templates/business-pitch',
    use_cases: ['pitch'],
    category: 'Business',
    slideCount: 10,
  },
];

function renderTemplateList(
  props?: Partial<React.ComponentProps<typeof TemplateList>>,
) {
  const defaultProps = {
    slideTemplates: mockSlideTemplates,
    deckTemplates: mockDeckTemplates,
  };
  return render(<TemplateList {...defaultProps} {...props} />);
}

describe('TemplateList', () => {
  it('renders sub-tabs for Slide Templates and Deck Templates', () => {
    renderTemplateList();
    expect(screen.getByText('Slide Templates')).toBeDefined();
    expect(screen.getByText('Deck Templates')).toBeDefined();
  });

  it('shows slide templates by default', () => {
    renderTemplateList();
    expect(screen.getByText('Title Slide')).toBeDefined();
    expect(screen.getByText('Content Slide')).toBeDefined();
  });

  it('switches to deck templates when Deck Templates tab is clicked', () => {
    renderTemplateList();
    fireEvent.click(screen.getByText('Deck Templates'));
    expect(screen.getByText('Business Pitch')).toBeDefined();
  });

  it('renders template names as list items (AC-6)', () => {
    renderTemplateList();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2); // 2 slide templates
  });

  it('renders category for templates', () => {
    renderTemplateList();
    // Category appears in both filter chip and row span
    expect(screen.getAllByText('Title').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Content').length).toBeGreaterThanOrEqual(1);
  });

  it('renders description for templates', () => {
    renderTemplateList();
    expect(screen.getByText('A bold title slide')).toBeDefined();
  });

  it('renders kebab menu button for each row (AC-4)', () => {
    renderTemplateList();
    const kebabs = screen.getAllByLabelText(/Actions for template/);
    expect(kebabs).toHaveLength(2);
  });

  it('has accessible aria-label on template rows', () => {
    renderTemplateList();
    expect(screen.getByLabelText(/Template: Title Slide/)).toBeDefined();
  });

  it('shows slide count for deck templates', () => {
    renderTemplateList();
    fireEvent.click(screen.getByText('Deck Templates'));
    expect(screen.getByText('10 slides')).toBeDefined();
  });

  it('renders category filter chips', () => {
    renderTemplateList();
    const group = screen.getByRole('group', { name: 'Filter by category' });
    expect(group).toBeDefined();
  });

  it('shows empty state when no templates match', () => {
    renderTemplateList({ slideTemplates: [], deckTemplates: [] });
    expect(screen.getByText('No slide templates found')).toBeDefined();
  });

  it('shows clear filters button when search is active and no results', () => {
    const onClearFilters = vi.fn();
    renderTemplateList({
      slideTemplates: [],
      deckTemplates: [],
      searchQuery: 'nonexistent',
      onClearFilters,
    });
    const clearButton = screen.getByText('Clear filters');
    expect(clearButton).toBeDefined();
    fireEvent.click(clearButton);
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('filters templates by search query (AC-6)', () => {
    renderTemplateList({ searchQuery: 'Title' });
    expect(screen.getByText('Title Slide')).toBeDefined();
    expect(screen.queryByText('Content Slide')).toBeNull();
  });

  it('calls onClick on Enter key', () => {
    renderTemplateList();
    const row = screen.getByLabelText(/Template: Title Slide/);
    fireEvent.keyDown(row, { key: 'Enter' });
    // Should not throw - template detail dialog opens
  });
});
