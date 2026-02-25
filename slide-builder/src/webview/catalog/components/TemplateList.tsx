/**
 * TemplateList - List view for template cards with context menus and kebab menus.
 *
 * Story Reference: v3-2-2 Task 6 — TemplateList component
 *
 * AC-2: Right-click context menu matching Grid view template menus
 * AC-4: Kebab dropdown menu matching Grid view template menus
 * AC-6: All Grid template operations available in List view
 */

import React, { useState, useMemo, useCallback } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Eye, Plus, Settings } from 'lucide-react';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../../shared/types';
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

export interface TemplateListProps {
  slideTemplates: SlideTemplateDisplay[];
  deckTemplates: DeckTemplateDisplay[];
  // tm-1-6: searchQuery prop removed — search is read from context via useFilteredSlideTemplates/useFilteredDeckTemplates
  onClearFilters?: () => void;
  /** v3-2-3: Callback for "Edit Template" action from context/kebab menu */
  onEditTemplate?: (templateId: string, templateName: string) => void;
  /** tm-1-5: Callback for "Add Slide Template" button */
  onAddSlideTemplate?: () => void;
  /** tm-3-1: Callback for "Add Deck Template" button */
  onAddDeckTemplate?: () => void;
  /** tm-2-1: Callback when a deck template row is clicked to open detail panel */
  onDeckTemplateClick?: (templateId: string) => void;
}

function isDeckTemplate(
  template: SlideTemplateDisplay | DeckTemplateDisplay
): template is DeckTemplateDisplay {
  return 'slideCount' in template && typeof (template as DeckTemplateDisplay).slideCount === 'number';
}

function extractCategories(templates: { category: string }[]): string[] {
  const categories = new Set<string>();
  for (const t of templates) {
    if (t.category) categories.add(t.category);
  }
  return Array.from(categories).sort();
}

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

function filterByCategory<T extends { category: string }>(
  templates: T[],
  category: string | null
): T[] {
  if (!category) return templates;
  return templates.filter((t) => t.category === category);
}

// ---------------------------------------------------------------------------
// Template List Row
// ---------------------------------------------------------------------------

function TemplateListRow({
  template,
  onClick,
  onUseTemplate,
  onEditTemplate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  template: SlideTemplateDisplay | DeckTemplateDisplay;
  onClick: (template: SlideTemplateDisplay | DeckTemplateDisplay) => void;
  onUseTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string, templateName: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}): React.ReactElement {
  const slideCount = isDeckTemplate(template) ? template.slideCount : null;

  const handlePreview = useCallback(() => onClick(template), [onClick, template]);
  const handleUseTemplate = useCallback(() => onUseTemplate?.(template.id), [onUseTemplate, template.id]);
  const handleEditTemplate = useCallback(
    () => onEditTemplate?.(template.id, template.name),
    [onEditTemplate, template.id, template.name],
  );
  const handleClick = useCallback(
    () => (!isDeckTemplate(template) && onEditTemplate)
      ? onEditTemplate(template.id, template.name)
      : onClick(template),
    [onEditTemplate, onClick, template],
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(template);
      }
    },
    [onClick, template],
  );

  let ariaLabel = `Template: ${template.name}`;
  if (template.category) ariaLabel += `, category: ${template.category}`;
  if (slideCount !== null && slideCount > 0) ariaLabel += `, ${slideCount} slides`;

  const menuItemsJsx = (Component: typeof ContextMenu | typeof DropdownMenu) => (
    <>
      <Component.Item className="deck-context-menu__item" onSelect={handlePreview}>
        <Eye size={14} style={{ marginRight: '8px' }} />
        Preview
      </Component.Item>
      <Component.Item className="deck-context-menu__item" onSelect={handleEditTemplate}>
        <Settings size={14} style={{ marginRight: '8px' }} />
        Edit Template
      </Component.Item>
      {isDeckTemplate(template) && (
        <Component.Item className="deck-context-menu__item" onSelect={handleUseTemplate}>
          <Plus size={14} style={{ marginRight: '8px' }} />
          Use Template
        </Component.Item>
      )}
    </>
  );

  const rowContent = (
    <div
      className="deck-list__row deck-list__row--template"
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    >
      <div className="deck-list__name">{template.name}</div>
      {template.category && (
        <span className="deck-list__category">{template.category}</span>
      )}
      {slideCount !== null && slideCount > 0 && (
        <span className="deck-list__count">
          {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
        </span>
      )}
      {/* Kebab menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="deck-list__kebab"
            aria-label={`Actions for template ${template.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="deck-context-menu" sideOffset={4}>
            {menuItemsJsx(DropdownMenu)}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{rowContent}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="deck-context-menu">
          {menuItemsJsx(ContextMenu)}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

// ---------------------------------------------------------------------------
// TemplateList (main component)
// ---------------------------------------------------------------------------

export function TemplateList({
  slideTemplates,
  deckTemplates,
  onClearFilters,
  onEditTemplate,
  onAddSlideTemplate,
  onAddDeckTemplate,
  onDeckTemplateClick,
}: TemplateListProps): React.ReactElement {
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

  const [selectedTemplate, setSelectedTemplate] = useState<
    SlideTemplateDisplay | DeckTemplateDisplay | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const vscode = getVSCodeApi();

  const slideCategories = useMemo(() => extractCategories(slideTemplates), [slideTemplates]);
  const deckCategories = useMemo(() => extractCategories(deckTemplates), [deckTemplates]);
  const selectedCategory = activeSubTab === 'slide' ? slideCategoryFilter : deckCategoryFilter;

  // tm-1-6: Handle category chip click — dispatch to context (persists across tab switches)
  const handleCategoryClick = useCallback(
    (category: string) => {
      if (activeSubTab === 'slide') {
        const newCategory = slideCategoryFilter === category ? null : category;
        dispatch({ type: 'SET_TEMPLATE_CATEGORY', category: newCategory });
      } else {
        const newCategory = deckCategoryFilter === category ? null : category;
        dispatch({ type: 'SET_DECK_TEMPLATE_CATEGORY', category: newCategory });
      }
    },
    [activeSubTab, slideCategoryFilter, deckCategoryFilter, dispatch],
  );

  const handleTemplateClick = useCallback(
    (template: SlideTemplateDisplay | DeckTemplateDisplay) => {
      setSelectedTemplate(template);
      setDialogOpen(true);
    },
    [],
  );

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setSelectedTemplate(null);
  }, []);

  const handleUseTemplate = useCallback(
    (templateId: string) => {
      vscode.postMessage({ type: 'use-deck-template', templateId });
    },
    [vscode],
  );

  const currentTemplates =
    activeSubTab === 'slide' ? filteredSlideTemplates : filteredDeckTemplates;
  const isEmpty = currentTemplates.length === 0;
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

      {/* Category filter chips */}
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

      {/* Template list or empty state */}
      {isEmpty ? (
        <div className="empty-state">
          <p className="empty-state__title">
            {activeSubTab === 'slide' ? 'No slide templates found' : 'No deck templates found'}
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
        <div className="deck-list" role="list">
          {currentTemplates.map((template) => {
            const isSlide = activeSubTab === 'slide' && !isDeckTemplate(template);
            // tm-2-1: For deck templates, use onDeckTemplateClick if provided
            const deckClick = !isSlide && onDeckTemplateClick
              ? () => onDeckTemplateClick(template.id)
              : undefined;
            return (
              <TemplateListRow
                key={template.id}
                template={template}
                onClick={deckClick ? (_t) => onDeckTemplateClick!(template.id) : handleTemplateClick}
                onUseTemplate={handleUseTemplate}
                onEditTemplate={onEditTemplate}
              />
            );
          })}
        </div>
      )}

      {/* Template detail dialog */}
      <TemplateDetail
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
