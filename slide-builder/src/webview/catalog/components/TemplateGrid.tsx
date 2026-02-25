/**
 * TemplateGrid - Responsive grid for displaying template showcase cards.
 *
 * Story Reference: cv-5-1 Task 4 — TemplateGrid component
 * Story Reference: cv-5-2 AC-11, AC-14 — Deck template browsing with category filter
 *
 * AC-1: Shows showcase cards for each slide template.
 * AC-4: Category filter chips appear below section header.
 * AC-8: Grid uses repeat(auto-fill, minmax(280px, 1fr)) with 24px gap.
 * AC-9: Empty state when no templates exist.
 * AC-11 (cv-5-2): Selecting "Deck Templates" shows deck template showcase cards.
 * AC-14 (cv-5-2): Category filter chips and search available for deck templates.
 */

import React, { useState, useMemo, useCallback } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Eye, Settings, Plus } from 'lucide-react';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../../shared/types';
import { TemplateCard } from './TemplateCard';
import { TemplateDetail } from './TemplateDetail';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import {
  useCatalog,
  useTemplateCategoryFilter,
  useDeckTemplateCategoryFilter,
  useFilteredSlideTemplates,
  useFilteredDeckTemplates,
  useHasActiveTemplateFilters,
} from '../context/CatalogContext';

type TemplateSubTab = 'slide' | 'deck';

export interface TemplateGridProps {
  slideTemplates: SlideTemplateDisplay[];
  deckTemplates: DeckTemplateDisplay[];
  // tm-1-6: searchQuery prop removed — search is read from context via useFilteredSlideTemplates/useFilteredDeckTemplates
  onClearFilters?: () => void;
  /** v3-2-3: Callback for "Edit Template" action from context/kebab menu */
  onEditTemplate?: (templateId: string, templateName: string) => void;
  /** tm-1-5: Callback to open the Add Slide Template modal */
  onAddSlideTemplate?: () => void;
  /** tm-3-1: Callback to open the Add Deck Template modal */
  onAddDeckTemplate?: () => void;
  /** tm-2-1: Callback when a deck template card is clicked to open detail panel */
  onDeckTemplateClick?: (templateId: string) => void;
}

/**
 * Extract unique categories from templates.
 * Works for both SlideTemplateDisplay and DeckTemplateDisplay.
 */
function extractCategories(templates: { category: string }[]): string[] {
  const categories = new Set<string>();
  for (const t of templates) {
    if (t.category) {
      categories.add(t.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Filter templates by search query (name and description).
 */
function filterBySearch<T extends { name: string; description: string }>(
  templates: T[],
  query: string
): T[] {
  if (!query.trim()) return templates;
  const lower = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
  );
}

/**
 * Filter templates by category.
 * Works for both SlideTemplateDisplay and DeckTemplateDisplay.
 */
function filterByCategory<T extends { category: string }>(
  templates: T[],
  category: string | null
): T[] {
  if (!category) return templates;
  return templates.filter((t) => t.category === category);
}

// ---------------------------------------------------------------------------
// v3-2-3: TemplateCardWithMenu — wraps TemplateCard with context + kebab menu
// ---------------------------------------------------------------------------

function TemplateCardWithMenu({
  template,
  onClick,
  onEditTemplate,
  onUseTemplate,
  isDeck,
}: {
  template: SlideTemplateDisplay | DeckTemplateDisplay;
  onClick: (t: SlideTemplateDisplay | DeckTemplateDisplay) => void;
  onEditTemplate?: (templateId: string, templateName: string) => void;
  onUseTemplate?: (templateId: string) => void;
  isDeck: boolean;
}): React.ReactElement {
  const handlePreview = useCallback(() => onClick(template), [onClick, template]);
  const handleEdit = useCallback(
    () => onEditTemplate?.(template.id, template.name),
    [onEditTemplate, template.id, template.name],
  );
  const handleUse = useCallback(
    () => onUseTemplate?.(template.id),
    [onUseTemplate, template.id],
  );

  const menuItems = (Comp: typeof ContextMenu | typeof DropdownMenu) => (
    <>
      <Comp.Item className="deck-context-menu__item" onSelect={handlePreview}>
        <Eye size={14} style={{ marginRight: '8px' }} />
        Preview
      </Comp.Item>
      <Comp.Item className="deck-context-menu__item" onSelect={handleEdit}>
        <Settings size={14} style={{ marginRight: '8px' }} />
        Edit Template
      </Comp.Item>
      {isDeck && (
        <Comp.Item className="deck-context-menu__item" onSelect={handleUse}>
          <Plus size={14} style={{ marginRight: '8px' }} />
          Use Template
        </Comp.Item>
      )}
    </>
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="template-card-wrapper">
          <TemplateCard
            template={template}
            onClick={(!isDeck && onEditTemplate) ? (t) => onEditTemplate(t.id, t.name) : onClick}
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="template-card-wrapper__kebab"
                aria-label={`Actions for template ${template.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="deck-context-menu" sideOffset={4}>
                {menuItems(DropdownMenu)}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="deck-context-menu">
          {menuItems(ContextMenu)}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export function TemplateGrid({
  slideTemplates,
  deckTemplates,
  onClearFilters,
  onEditTemplate,
  onAddSlideTemplate,
  onAddDeckTemplate,
  onDeckTemplateClick,
}: TemplateGridProps): React.ReactElement {
  // State for sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<TemplateSubTab>('slide');

  // tm-1-6: Category filters come from context (persists across tab switches)
  const { dispatch } = useCatalog();
  const slideCategoryFilter = useTemplateCategoryFilter();
  const deckCategoryFilter = useDeckTemplateCategoryFilter();

  // tm-1-6: Filtered templates come from context hooks (apply search + category from context state)
  const { filtered: filteredSlideTemplates } = useFilteredSlideTemplates();
  const { filtered: filteredDeckTemplates } = useFilteredDeckTemplates();

  // tm-1-6: hasActiveFilters computed from context (covers search + slide category + deck category)
  const hasActiveFilters = useHasActiveTemplateFilters();

  // State for detail dialog
  const [selectedTemplate, setSelectedTemplate] = useState<
    SlideTemplateDisplay | DeckTemplateDisplay | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // VS Code API for messaging
  const vscode = getVSCodeApi();

  // Extract unique categories for slide templates
  const slideCategories = useMemo(
    () => extractCategories(slideTemplates),
    [slideTemplates]
  );

  // Extract unique categories for deck templates (cv-5-2 AC-14)
  const deckCategories = useMemo(
    () => extractCategories(deckTemplates),
    [deckTemplates]
  );

  // Get current category filter based on active tab
  const selectedCategory = activeSubTab === 'slide' ? slideCategoryFilter : deckCategoryFilter;

  // tm-1-6: Handle category chip click — dispatch to context (persists across tab switches)
  const handleCategoryClick = useCallback((category: string) => {
    if (activeSubTab === 'slide') {
      const newCategory = slideCategoryFilter === category ? null : category;
      dispatch({ type: 'SET_TEMPLATE_CATEGORY', category: newCategory });
    } else {
      const newCategory = deckCategoryFilter === category ? null : category;
      dispatch({ type: 'SET_DECK_TEMPLATE_CATEGORY', category: newCategory });
    }
  }, [activeSubTab, slideCategoryFilter, deckCategoryFilter, dispatch]);

  // Handle template card click - open detail dialog
  const handleTemplateClick = useCallback(
    (template: SlideTemplateDisplay | DeckTemplateDisplay) => {
      setSelectedTemplate(template);
      setDialogOpen(true);
    },
    []
  );

  // Handle dialog close
  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedTemplate(null);
    }
  }, []);

  // Handle "Use Template" action for deck templates (cv-5-2 AC-16)
  const handleUseTemplate = useCallback((templateId: string) => {
    vscode.postMessage({
      type: 'use-deck-template',
      templateId,
    });
  }, [vscode]);

  // Determine which templates to show based on active sub-tab
  const currentTemplates =
    activeSubTab === 'slide' ? filteredSlideTemplates : filteredDeckTemplates;
  const isEmpty = currentTemplates.length === 0;

  // Get categories for current tab
  const currentCategories = activeSubTab === 'slide' ? slideCategories : deckCategories;

  return (
    <div className="template-grid-container">
      {/* Sub-tabs: Slide Templates / Deck Templates */}
      <div className="template-subtabs">
        <button
          className={`template-subtab ${activeSubTab === 'slide' ? 'template-subtab--active' : ''}`}
          onClick={() => setActiveSubTab('slide')}
          aria-pressed={activeSubTab === 'slide'}
        >
          Slide Templates
        </button>
        <button
          className={`template-subtab ${activeSubTab === 'deck' ? 'template-subtab--active' : ''}`}
          onClick={() => setActiveSubTab('deck')}
          aria-pressed={activeSubTab === 'deck'}
        >
          Deck Templates
        </button>
        {/* tm-1-5: Add Slide Template button — visible only when Slide Templates sub-tab is active */}
        {activeSubTab === 'slide' && onAddSlideTemplate && (
          <button
            className="template-subtabs__add-btn"
            onClick={onAddSlideTemplate}
            aria-label="Add Slide Template"
            title="Add Slide Template"
          >
            <Plus size={14} />
            <span>Add Slide Template</span>
          </button>
        )}
        {/* tm-3-1: Add Deck Template button — visible only when Deck Templates sub-tab is active */}
        {activeSubTab === 'deck' && onAddDeckTemplate && (
          <button
            className="template-subtabs__add-btn"
            onClick={onAddDeckTemplate}
            aria-label="Add Deck Template"
            title="Add Deck Template"
          >
            <Plus size={14} />
            <span>Add Deck Template</span>
          </button>
        )}
      </div>

      {/* Category filter chips (for both slide and deck templates) (cv-5-2 AC-14) */}
      {currentCategories.length > 0 && (
        <div className="template-filter-chips" role="group" aria-label="Filter by category">
          {currentCategories.map((category) => (
            <button
              key={category}
              className={`template-filter-chip ${selectedCategory === category ? 'template-filter-chip--active' : ''}`}
              onClick={() => handleCategoryClick(category)}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Template grid or empty state */}
      {isEmpty ? (
        <div className="empty-state">
          <p className="empty-state__title">
            {activeSubTab === 'slide'
              ? 'No slide templates found'
              : 'No deck templates found'}
          </p>
          <p className="empty-state__hint">
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : activeSubTab === 'slide'
                ? 'Add slide templates to .slide-builder/config/catalog/slide-templates.json'
                : 'Add deck templates to .slide-builder/config/catalog/deck-templates.json'}
          </p>
          {hasActiveFilters && onClearFilters && (
            <button className="empty-state__clear-link" onClick={onClearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="template-grid">
          {activeSubTab === 'slide'
            ? filteredSlideTemplates.map((template) => (
                <TemplateCardWithMenu
                  key={template.id}
                  template={template}
                  onClick={handleTemplateClick}
                  onEditTemplate={onEditTemplate}
                  isDeck={false}
                />
              ))
            : filteredDeckTemplates.map((template) => (
                <TemplateCardWithMenu
                  key={template.id}
                  template={template}
                  onClick={onDeckTemplateClick
                    ? (t) => onDeckTemplateClick(t.id)
                    : handleTemplateClick}
                  onEditTemplate={onEditTemplate}
                  onUseTemplate={handleUseTemplate}
                  isDeck={true}
                />
              ))}
        </div>
      )}

      {/* Template detail dialog (cv-5-2 AC-16: includes onUseTemplate for deck templates) */}
      <TemplateDetail
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
