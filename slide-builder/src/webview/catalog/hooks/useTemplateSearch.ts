/**
 * useTemplateSearch - Re-exports template filtering utilities from CatalogContext.
 *
 * Story Reference: cv-5-1 Task 6 — Template search hook
 *
 * The core filtering logic lives in CatalogContext alongside the state it operates on.
 * This module re-exports those utilities for consumers that prefer importing from hooks/.
 */

export {
  useSlideTemplates,
  useDeckTemplates,
  useTemplateSearchQuery,
  useTemplateCategoryFilter,
  useFilteredSlideTemplates,
  useFilteredDeckTemplates,
  useTemplateCategories,
  useHasActiveTemplateFilters,
  filterTemplatesBySearch,
  filterTemplatesByCategory,
} from '../context/CatalogContext';
