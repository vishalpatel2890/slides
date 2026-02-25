/**
 * EmptyState - Contextual empty state for catalog sections.
 *
 * Story Reference: cv-1-4 Task 3 — EmptyState component
 * Story Reference: cv-1-5 Task 5 — Search/filter context variant
 *
 * AC-6: "No decks yet" with guidance and "+ New Deck" CTA.
 * AC-3: "No results for '{query}'" with "Clear filters" link.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import type { CatalogTab } from '../../../shared/types';

const EMPTY_CONTENT: Record<CatalogTab, { title: string; hint: string; ctaLabel?: string }> = {
  decks: {
    title: 'No decks yet',
    hint: 'Create a deck using the Slide Builder commands to get started.',
    ctaLabel: 'New Deck',
  },
  'brand-assets': {
    title: 'No brand assets',
    hint: 'Add icons, logos, and images to your brand library.',
  },
  templates: {
    title: 'No templates',
    hint: 'Templates will appear once the catalog is configured.',
  },
};

export interface SearchContext {
  query: string;
  hasFilters: boolean;
}

export interface EmptyStateProps {
  section: CatalogTab;
  onAction?: () => void;
  searchContext?: SearchContext;
  onClearFilters?: () => void;
}

export function EmptyState({ section, onAction, searchContext, onClearFilters }: EmptyStateProps): React.ReactElement {
  // Search/filter empty state (AC-3)
  if (searchContext && (searchContext.query || searchContext.hasFilters)) {
    const message = searchContext.query
      ? `No results for '${searchContext.query}'`
      : 'No results match the active filters';

    return (
      <div className="empty-state" role="status">
        <p className="empty-state__title">{message}</p>
        <p className="empty-state__hint">Try adjusting your search or filters.</p>
        <button
          className="empty-state__clear-link"
          onClick={onClearFilters}
          type="button"
        >
          Clear filters
        </button>
      </div>
    );
  }

  // Default section empty state
  const content = EMPTY_CONTENT[section];

  return (
    <div className="empty-state" role="status">
      <p className="empty-state__title">{content.title}</p>
      <p className="empty-state__hint">{content.hint}</p>
      {content.ctaLabel && (
        <button
          className="empty-state__cta"
          onClick={onAction}
          type="button"
        >
          <Plus size={14} />
          {content.ctaLabel}
        </button>
      )}
    </div>
  );
}
