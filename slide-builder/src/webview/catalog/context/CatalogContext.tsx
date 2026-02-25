/**
 * CatalogContext - Global state management for the Catalog webview.
 *
 * Story Reference: cv-1-2 Task 1 — CatalogContext with useReducer
 * Architecture Reference: ADR-005 - useReducer + Context pattern
 *
 * AC-4: Tab state management (Decks active by default)
 * AC-6: Search query state
 */

import React, { createContext, useContext, useDeferredValue, useMemo, useReducer, type ReactNode } from 'react';
import type {
  CatalogState,
  CatalogAction,
  CatalogTab,
  DeckInfo,
  DeckStatus,
  FolderInfo,
  NavigationEntry,
  BuildProgress,
  BrandAsset,
  AssetSubCategory,
  SlideTemplateDisplay,
  DeckTemplateDisplay,
} from '../../../shared/types';
import { filterAssets, aggregateTags } from '../hooks/useAssetSearch';

// =============================================================================
// Constants
// =============================================================================

const TAB_LABELS: Record<CatalogTab, string> = {
  'decks': 'Decks',
  'brand-assets': 'Brand Assets',
  'templates': 'Templates',
};

function createTabRoot(tab: CatalogTab): NavigationEntry {
  return { id: tab, label: TAB_LABELS[tab], type: 'tab-root' };
}

// =============================================================================
// Initial State
// =============================================================================

// Extended state with newDeckIds for entrance animation (cv-3-1 AC-5)
// and newFolderIds for folder creation animation (cv-3-3)
// and buildProgress for build tracking (cv-3-5)
interface ExtendedCatalogState extends CatalogState {
  newDeckIds: Set<string>;
  newFolderIds: Set<string>;
  /** Active build progress state (cv-3-5 AC-29, AC-39) */
  buildProgress: BuildProgress | null;
  /** Brand assets (cv-4-1) */
  assets: BrandAsset[];
  assetSubCategory: AssetSubCategory;
  /** Brand asset search query (cv-4-2 AC-11) — separate from deck searchQuery */
  assetSearchQuery: string;
  /** Active type filters for brand assets (cv-4-2 AC-13) — multi-select */
  assetTypeFilters: string[];
  /** Active tag filters for brand assets (cv-4-2 AC-14) */
  assetTagFilters: string[];
  /** Selected asset for detail panel (cv-4-3 AC-17) */
  selectedAsset: BrandAsset | null;
  /** Show add assets panel (cv-4-4 AC-24) */
  showAddAssetsPanel: boolean;
  /** Files selected for adding (cv-4-4 AC-28) */
  selectedFilesForAdd: FilePreview[];
  /** Inline success message for asset operations (cv-4-4 AC-34) */
  assetOperationMessage: { text: string; type: 'success' | 'error' } | null;
  /** cv-5-1: Slide templates */
  slideTemplates: SlideTemplateDisplay[];
  /** cv-5-1, cv-5-2: Deck templates with display info */
  deckTemplates: DeckTemplateDisplay[];
  /** cv-5-1: Template search query */
  templateSearchQuery: string;
  /** cv-5-1: Template category filter (slide templates sub-tab) */
  templateCategoryFilter: string | null;
  /** tm-1-6: Deck template category filter (deck templates sub-tab, independent of slide filter) */
  deckTemplateCategoryFilter: string | null;
  /** cv-5-4: Selected item IDs for bulk operations (AC-27) */
  selectedIds: Set<string>;
  /** cv-5-4: Whether bulk selection mode is active */
  selectionMode: boolean;
  /** cv-5-4: Last selected ID for Shift+click range selection */
  lastSelectedId: string | null;
  /** bt-1-1: Whether theme.json exists (for brand section conditional rendering) */
  hasTheme: boolean;
}

/** File preview for add assets panel (cv-4-4 AC-28) */
export interface FilePreview {
  path: string;
  name: string;
  previewUrl?: string;
}

const initialState: ExtendedCatalogState = {
  activeTab: 'decks',
  navigationStack: [createTabRoot('decks')],
  decks: [],
  folders: [],
  searchQuery: '',
  statusFilters: [],
  selectedDeckId: null,
  deckDetail: null,
  viewMode: 'grid',
  currentFolderId: undefined,
  newDeckIds: new Set(),
  newFolderIds: new Set(),
  buildProgress: null,
  assets: [],
  assetSubCategory: 'all',
  assetSearchQuery: '',
  assetTypeFilters: [],
  assetTagFilters: [],
  selectedAsset: null,
  showAddAssetsPanel: false,
  selectedFilesForAdd: [],
  assetOperationMessage: null,
  slideTemplates: [],
  deckTemplates: [],
  templateSearchQuery: '',
  templateCategoryFilter: null,
  deckTemplateCategoryFilter: null,
  // cv-5-4: Selection state for bulk operations
  selectedIds: new Set(),
  selectionMode: false,
  lastSelectedId: null,
  // bt-1-1: Brand theme existence
  hasTheme: false,
};

// =============================================================================
// Reducer
// =============================================================================

// Extended action type for entrance animation (cv-3-1 AC-5, cv-3-3) and build progress (cv-3-5)
type ExtendedCatalogAction =
  | CatalogAction
  | { type: 'CLEAR_NEW_DECK'; deckId: string }
  | { type: 'CLEAR_NEW_FOLDER'; folderId: string }
  /** cv-3-5: Build progress actions */
  | { type: 'SET_BUILD_PROGRESS'; progress: BuildProgress }
  | { type: 'CLEAR_BUILD_PROGRESS' }
  | { type: 'NAVIGATE_TO_BUILD_PROGRESS'; deckId: string; deckName: string }
  /** cv-4-1: Brand asset actions */
  | { type: 'SET_BRAND_ASSETS'; assets: BrandAsset[] }
  | { type: 'SET_ASSET_SUB_CATEGORY'; subCategory: AssetSubCategory }
  /** cv-4-2: Brand asset search/filter actions */
  | { type: 'SET_ASSET_SEARCH'; query: string }
  | { type: 'TOGGLE_ASSET_TYPE_FILTER'; filterType: string }
  | { type: 'TOGGLE_ASSET_TAG_FILTER'; tag: string }
  | { type: 'CLEAR_ASSET_FILTERS' }
  /** cv-4-3: Selected asset for detail panel */
  | { type: 'SET_SELECTED_ASSET'; asset: BrandAsset | null }
  /** cv-4-4: Add assets panel actions */
  | { type: 'SHOW_ADD_ASSETS_PANEL' }
  | { type: 'HIDE_ADD_ASSETS_PANEL' }
  | { type: 'SET_FILES_FOR_ADD'; files: FilePreview[] }
  | { type: 'APPEND_FILES_FOR_ADD'; files: FilePreview[] }
  | { type: 'REMOVE_FILE_FOR_ADD'; path: string }
  | { type: 'SET_ASSET_OPERATION_MESSAGE'; message: { text: string; type: 'success' | 'error' } | null }
  /** cv-5-1: Template actions */
  | { type: 'SET_SLIDE_TEMPLATES'; templates: SlideTemplateDisplay[] }
  | { type: 'SET_DECK_TEMPLATES'; templates: DeckTemplateDisplay[] }
  /** tm-1-3: Delete slide template from catalog state */
  | { type: 'DELETE_SLIDE_TEMPLATE'; templateId: string }
  /** tm-2-3: Delete deck template from catalog state */
  | { type: 'DELETE_DECK_TEMPLATE'; templateId: string }
  /** tm-1-4: Reorder slide templates in catalog state */
  | { type: 'REORDER_SLIDE_TEMPLATES'; orderedTemplates: SlideTemplateDisplay[] }
  | { type: 'SET_TEMPLATE_SEARCH'; query: string }
  | { type: 'SET_TEMPLATE_CATEGORY'; category: string | null }
  /** tm-1-6: Deck template category filter (independent of slide category filter) */
  | { type: 'SET_DECK_TEMPLATE_CATEGORY'; category: string | null }
  | { type: 'CLEAR_TEMPLATE_FILTERS' }
  /** cv-5-4: Selection actions for bulk operations */
  | { type: 'SELECT_ITEM'; id: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'SELECT_RANGE'; fromId: string; toId: string; allIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  /** bt-1-1: Brand theme existence status */
  | { type: 'SET_BRAND_STATUS'; hasTheme: boolean };

function catalogReducer(state: ExtendedCatalogState, action: ExtendedCatalogAction): ExtendedCatalogState {
  switch (action.type) {
    case 'SET_TAB':
      // cv-5-4 AC-36: Clear selection on tab switch
      return {
        ...state,
        activeTab: action.tab,
        navigationStack: [createTabRoot(action.tab)],
        searchQuery: '',
        selectedDeckId: null,
        deckDetail: null,
        selectedIds: new Set(),
        selectionMode: false,
        lastSelectedId: null,
      };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    case 'TOGGLE_FILTER': {
      const has = state.statusFilters.includes(action.status);
      return {
        ...state,
        statusFilters: has
          ? state.statusFilters.filter((s) => s !== action.status)
          : [...state.statusFilters, action.status],
      };
    }

    case 'CLEAR_FILTERS':
      return { ...state, searchQuery: '', statusFilters: [] };

    case 'NAVIGATE_TO_DECK': {
      // cv-5-4 AC-36: Clear selection on drill-down navigation
      const deck = state.decks.find((d) => d.id === action.deckId);
      return {
        ...state,
        selectedDeckId: action.deckId,
        navigationStack: [
          ...state.navigationStack,
          { id: action.deckId, label: deck?.name ?? action.deckId, type: 'deck-detail' },
        ],
        selectedIds: new Set(),
        selectionMode: false,
        lastSelectedId: null,
      };
    }

    case 'NAVIGATE_BACK': {
      // cv-5-4 AC-36: Clear selection on back navigation
      if (state.navigationStack.length <= 1) return state;
      const newStack = state.navigationStack.slice(0, -1);
      // Check if we're leaving a folder
      const currentTop = state.navigationStack[state.navigationStack.length - 1];
      const newCurrentFolderId = currentTop?.type === 'folder' ? undefined : state.currentFolderId;
      return {
        ...state,
        navigationStack: newStack,
        selectedDeckId: null,
        deckDetail: null,
        currentFolderId: newCurrentFolderId,
        selectedIds: new Set(),
        selectionMode: false,
        lastSelectedId: null,
      };
    }

    case 'SET_DECKS': {
      // Track new deck IDs for entrance animation (cv-3-1 AC-5)
      const oldIds = new Set(state.decks.map((d) => d.id));
      const newIds = new Set<string>();
      for (const deck of action.decks) {
        if (!oldIds.has(deck.id)) {
          newIds.add(deck.id);
        }
      }
      return {
        ...state,
        decks: action.decks,
        newDeckIds: newIds.size > 0 ? new Set([...state.newDeckIds, ...newIds]) : state.newDeckIds,
      };
    }

    case 'CLEAR_NEW_DECK': {
      const updated = new Set(state.newDeckIds);
      updated.delete(action.deckId);
      return { ...state, newDeckIds: updated };
    }

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'SET_DECK_DETAIL':
      return {
        ...state,
        selectedDeckId: action.deck?.id ?? null,
        deckDetail: action.deck,
      };

    // cv-3-3: Folder operations
    case 'SET_FOLDERS': {
      // Track new folder IDs for entrance animation
      const oldFolderIds = new Set(state.folders.map((f) => f.id));
      const newFolderIds = new Set<string>();
      for (const folder of action.folders) {
        if (!oldFolderIds.has(folder.id)) {
          newFolderIds.add(folder.id);
        }
      }
      return {
        ...state,
        folders: action.folders,
        newFolderIds: newFolderIds.size > 0 ? new Set([...state.newFolderIds, ...newFolderIds]) : state.newFolderIds,
      };
    }

    case 'NAVIGATE_TO_FOLDER': {
      const folder = state.folders.find((f) => f.id === action.folderId);
      return {
        ...state,
        currentFolderId: action.folderId,
        navigationStack: [
          ...state.navigationStack,
          { id: action.folderId, label: folder?.name ?? action.folderId, type: 'folder' },
        ],
      };
    }

    case 'SET_NEW_FOLDER': {
      const updated = new Set(state.newFolderIds);
      updated.add(action.folderId);
      return { ...state, newFolderIds: updated };
    }

    case 'CLEAR_NEW_FOLDER': {
      const updated = new Set(state.newFolderIds);
      updated.delete(action.folderId);
      return { ...state, newFolderIds: updated };
    }

    // cv-3-5: Build progress actions
    case 'SET_BUILD_PROGRESS':
      return {
        ...state,
        buildProgress: action.progress,
      };

    case 'CLEAR_BUILD_PROGRESS':
      return {
        ...state,
        buildProgress: null,
      };

    case 'NAVIGATE_TO_BUILD_PROGRESS': {
      return {
        ...state,
        navigationStack: [
          ...state.navigationStack,
          { id: `build-${action.deckId}`, label: `Building ${action.deckName}`, type: 'deck-detail' },
        ],
      };
    }

    // cv-4-1: Brand asset actions
    case 'SET_BRAND_ASSETS': {
      const newAssets = Array.isArray(action.assets) ? action.assets : [];
      // Sync selectedAsset with updated data so detail panel reflects edits
      const updatedSelected = state.selectedAsset
        ? newAssets.find((a) => a.id === state.selectedAsset!.id) ?? null
        : null;
      return { ...state, assets: newAssets, selectedAsset: updatedSelected };
    }

    case 'SET_ASSET_SUB_CATEGORY':
      return { ...state, assetSubCategory: action.subCategory };

    // cv-4-2: Brand asset search/filter actions
    case 'SET_ASSET_SEARCH':
      return { ...state, assetSearchQuery: action.query };

    case 'TOGGLE_ASSET_TYPE_FILTER': {
      const has = state.assetTypeFilters.includes(action.filterType);
      return {
        ...state,
        assetTypeFilters: has
          ? state.assetTypeFilters.filter((t) => t !== action.filterType)
          : [...state.assetTypeFilters, action.filterType],
      };
    }

    case 'TOGGLE_ASSET_TAG_FILTER': {
      const has = state.assetTagFilters.includes(action.tag);
      return {
        ...state,
        assetTagFilters: has
          ? state.assetTagFilters.filter((t) => t !== action.tag)
          : [...state.assetTagFilters, action.tag],
      };
    }

    case 'CLEAR_ASSET_FILTERS':
      return { ...state, assetSearchQuery: '', assetTypeFilters: [], assetTagFilters: [] };

    // cv-4-3: Selected asset for detail panel
    case 'SET_SELECTED_ASSET':
      return { ...state, selectedAsset: action.asset };

    // cv-4-4: Add assets panel actions
    case 'SHOW_ADD_ASSETS_PANEL':
      return { ...state, showAddAssetsPanel: true, selectedFilesForAdd: [] };

    case 'HIDE_ADD_ASSETS_PANEL':
      return { ...state, showAddAssetsPanel: false, selectedFilesForAdd: [] };

    case 'SET_FILES_FOR_ADD':
      return { ...state, selectedFilesForAdd: action.files };

    case 'APPEND_FILES_FOR_ADD':
      return { ...state, selectedFilesForAdd: [...state.selectedFilesForAdd, ...action.files] };

    case 'REMOVE_FILE_FOR_ADD':
      return { ...state, selectedFilesForAdd: state.selectedFilesForAdd.filter((f) => f.path !== action.path) };

    case 'SET_ASSET_OPERATION_MESSAGE':
      return { ...state, assetOperationMessage: action.message };

    // cv-5-1: Template actions
    case 'SET_SLIDE_TEMPLATES':
      return { ...state, slideTemplates: action.templates };

    case 'SET_DECK_TEMPLATES':
      return { ...state, deckTemplates: action.templates };

    // tm-1-3: Remove deleted template from catalog state
    case 'DELETE_SLIDE_TEMPLATE':
      return { ...state, slideTemplates: state.slideTemplates.filter((t) => t.id !== action.templateId) };

    // tm-2-3: Remove deleted deck template from catalog state
    case 'DELETE_DECK_TEMPLATE':
      return { ...state, deckTemplates: state.deckTemplates.filter((t) => t.id !== action.templateId) };

    // tm-1-4: Reorder slide templates in catalog state (optimistic update)
    case 'REORDER_SLIDE_TEMPLATES':
      return { ...state, slideTemplates: action.orderedTemplates };

    case 'SET_TEMPLATE_SEARCH':
      return { ...state, templateSearchQuery: action.query };

    case 'SET_TEMPLATE_CATEGORY':
      return { ...state, templateCategoryFilter: action.category };

    // tm-1-6: Deck template category filter (independent of slide category filter)
    case 'SET_DECK_TEMPLATE_CATEGORY':
      return { ...state, deckTemplateCategoryFilter: action.category };

    case 'CLEAR_TEMPLATE_FILTERS':
      return { ...state, templateSearchQuery: '', templateCategoryFilter: null, deckTemplateCategoryFilter: null };

    // cv-5-4: Selection actions for bulk operations
    case 'SELECT_ITEM': {
      // AC-27: Plain click selects single item (clears previous selection)
      const newSelectedIds = new Set<string>([action.id]);
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionMode: true,
        lastSelectedId: action.id,
      };
    }

    case 'TOGGLE_ITEM': {
      // AC-27: Ctrl/Cmd+click toggles individual selection
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(action.id)) {
        newSelectedIds.delete(action.id);
      } else {
        newSelectedIds.add(action.id);
      }
      const selectionMode = newSelectedIds.size > 0;
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionMode,
        lastSelectedId: selectionMode ? action.id : null,
      };
    }

    case 'SELECT_RANGE': {
      // AC-27: Shift+click selects range from last selected to clicked
      const { fromId, toId, allIds } = action;
      const fromIndex = allIds.indexOf(fromId);
      const toIndex = allIds.indexOf(toId);

      if (fromIndex === -1 || toIndex === -1) {
        // Fallback: just select the target item
        return {
          ...state,
          selectedIds: new Set([toId]),
          selectionMode: true,
          lastSelectedId: toId,
        };
      }

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeIds = allIds.slice(start, end + 1);

      // Merge with existing selection
      const newSelectedIds = new Set(state.selectedIds);
      for (const id of rangeIds) {
        newSelectedIds.add(id);
      }

      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionMode: true,
        // Keep lastSelectedId as the original anchor point
      };
    }

    case 'CLEAR_SELECTION':
      // AC-32, AC-36: Clear entire selection
      return {
        ...state,
        selectedIds: new Set(),
        selectionMode: false,
        lastSelectedId: null,
      };

    // bt-1-1: Brand theme existence status
    case 'SET_BRAND_STATUS':
      return { ...state, hasTheme: action.hasTheme };

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface CatalogContextValue {
  state: ExtendedCatalogState;
  dispatch: React.Dispatch<ExtendedCatalogAction>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface CatalogProviderProps {
  children: ReactNode;
  /** Optional partial initial state for testing */
  initialOverrides?: Partial<CatalogState>;
}

export function CatalogProvider({ children, initialOverrides }: CatalogProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    catalogReducer,
    initialOverrides ? { ...initialState, ...initialOverrides } : initialState,
  );

  return (
    <CatalogContext.Provider value={{ state, dispatch }}>
      {children}
    </CatalogContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the catalog context.
 *
 * @throws Error if used outside of CatalogProvider
 */
export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (context === null) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

// =============================================================================
// Selector Hooks
// =============================================================================

export function useActiveTab(): CatalogTab {
  const { state } = useCatalog();
  return state.activeTab;
}

export function useSearchQuery(): string {
  const { state } = useCatalog();
  return state.searchQuery;
}

export function useNavigationStack(): NavigationEntry[] {
  const { state } = useCatalog();
  return state.navigationStack;
}

export function useCatalogDecks(): DeckInfo[] {
  const { state } = useCatalog();
  return state.decks;
}

export function useStatusFilters(): DeckStatus[] {
  const { state } = useCatalog();
  return state.statusFilters;
}

// =============================================================================
// Filtering Logic (cv-1-5 AC-1, AC-2, AC-6)
// =============================================================================

function matchesQuery(deck: DeckInfo, query: string): boolean {
  const q = query.toLowerCase();
  if (deck.name.toLowerCase().includes(q)) return true;
  if (deck.audience && deck.audience.toLowerCase().includes(q)) return true;
  return false;
}

function filterDecks(decks: DeckInfo[], query: string, statusFilters: DeckStatus[]): DeckInfo[] {
  let result = decks;
  if (query) {
    result = result.filter((d) => matchesQuery(d, query));
  }
  if (statusFilters.length > 0) {
    result = result.filter((d) => statusFilters.includes(d.status));
  }
  return result;
}

/**
 * Returns filtered decks using deferred search query for smooth typing.
 * Combines search query and status filters via AND intersection (AC-1, AC-2).
 */
export function useFilteredDecks(): { filtered: DeckInfo[]; total: number } {
  const { state } = useCatalog();
  const deferredQuery = useDeferredValue(state.searchQuery);

  return useMemo(
    () => ({
      filtered: filterDecks(state.decks, deferredQuery, state.statusFilters),
      total: state.decks.length,
    }),
    [state.decks, deferredQuery, state.statusFilters],
  );
}

/**
 * Hook to check if a deck is newly created (for entrance animation).
 * Story Reference: cv-3-1 AC-5
 */
export function useIsNewDeck(deckId: string): boolean {
  const { state } = useCatalog();
  return state.newDeckIds.has(deckId);
}

/**
 * Hook to clear a deck from new deck tracking (after animation).
 * Story Reference: cv-3-1 AC-5
 */
export function useClearNewDeck(): (deckId: string) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (deckId: string) => dispatch({ type: 'CLEAR_NEW_DECK', deckId }),
    [dispatch]
  );
}

// =============================================================================
// Folder Selector Hooks (cv-3-3)
// =============================================================================

export function useCatalogFolders(): FolderInfo[] {
  const { state } = useCatalog();
  return state.folders;
}

export function useCurrentFolderId(): string | undefined {
  const { state } = useCatalog();
  return state.currentFolderId;
}

/**
 * Returns filtered decks for the current folder (or root if no folder selected).
 * Also applies search query and status filters.
 * When searching, returns ALL matching decks across all folders.
 */
export function useFilteredDecksInFolder(): { filtered: DeckInfo[]; total: number } {
  const { state } = useCatalog();
  const deferredQuery = useDeferredValue(state.searchQuery);
  const isSearching = deferredQuery !== '' || state.statusFilters.length > 0;

  return useMemo(
    () => {
      let result: DeckInfo[];
      let total: number;

      if (isSearching) {
        // When searching, include ALL decks (not just current folder)
        result = filterDecks(state.decks, deferredQuery, state.statusFilters);
        total = state.decks.length;
      } else {
        // When browsing, filter by current folder
        result = state.currentFolderId
          ? state.decks.filter((d) => d.folderId === state.currentFolderId)
          : state.decks.filter((d) => !d.folderId);
        total = result.length;
      }

      return { filtered: result, total };
    },
    [state.decks, state.currentFolderId, deferredQuery, state.statusFilters, isSearching],
  );
}

/**
 * Hook to check if a folder is newly created (for entrance animation).
 * Story Reference: cv-3-3 AC-16
 */
export function useIsNewFolder(folderId: string): boolean {
  const { state } = useCatalog();
  return state.newFolderIds.has(folderId);
}

/**
 * Hook to clear a folder from new folder tracking (after animation).
 * Story Reference: cv-3-3
 */
export function useClearNewFolder(): (folderId: string) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (folderId: string) => dispatch({ type: 'CLEAR_NEW_FOLDER', folderId }),
    [dispatch]
  );
}

// =============================================================================
// Build Progress Hooks (cv-3-5)
// =============================================================================

/**
 * Hook to access build progress state.
 * Story Reference: cv-3-5 AC-29, AC-39
 */
export function useBuildProgress(): BuildProgress | null {
  const { state } = useCatalog();
  return state.buildProgress;
}

/**
 * Hook to check if a build is currently in progress.
 * Story Reference: cv-3-5
 */
export function useIsBuilding(): boolean {
  const { state } = useCatalog();
  return state.buildProgress?.status === 'building';
}

// =============================================================================
// Brand Asset Selector Hooks (cv-4-1, cv-4-2)
// =============================================================================

export function useBrandAssets(): BrandAsset[] {
  const { state } = useCatalog();
  return state.assets;
}

export function useAssetSubCategory(): AssetSubCategory {
  const { state } = useCatalog();
  return state.assetSubCategory;
}

export function useAssetSearchQuery(): string {
  const { state } = useCatalog();
  return state.assetSearchQuery;
}

export function useAssetTypeFilters(): string[] {
  const { state } = useCatalog();
  return state.assetTypeFilters;
}

export function useAssetTagFilters(): string[] {
  const { state } = useCatalog();
  return state.assetTagFilters;
}

/**
 * Returns filtered brand assets using deferred search for smooth typing.
 * Combines search query, type filters, and tag filters via AND intersection.
 * Story Reference: cv-4-2 AC-11, AC-12, AC-13, AC-14
 */
export function useFilteredBrandAssets(): { filtered: BrandAsset[]; total: number } {
  const { state } = useCatalog();
  const deferredQuery = useDeferredValue(state.assetSearchQuery);

  return useMemo(
    () => ({
      filtered: filterAssets(state.assets, deferredQuery, state.assetTypeFilters, state.assetTagFilters),
      total: state.assets.length,
    }),
    [state.assets, deferredQuery, state.assetTypeFilters, state.assetTagFilters],
  );
}

/**
 * Returns aggregated tags from all brand assets, sorted by frequency.
 * Story Reference: cv-4-2 AC-14
 */
export function useAvailableAssetTags(): string[] {
  const { state } = useCatalog();
  return useMemo(() => aggregateTags(state.assets), [state.assets]);
}

// Export internals for testing
export { catalogReducer, initialState, createTabRoot, filterDecks };
export type { CatalogContextValue, ExtendedCatalogState, ExtendedCatalogAction };

// cv-4-2: Check if any asset filters are active
export function useHasActiveAssetFilters(): boolean {
  const { state } = useCatalog();
  return state.assetSearchQuery !== '' || state.assetTypeFilters.length > 0 || state.assetTagFilters.length > 0;
}

// =============================================================================
// Selected Asset Hooks (cv-4-3)
// =============================================================================

/**
 * Hook to access the currently selected asset for the detail panel.
 * Story Reference: cv-4-3 AC-17
 */
export function useSelectedAsset(): BrandAsset | null {
  const { state } = useCatalog();
  return state.selectedAsset;
}

/**
 * Hook to set the selected asset (or clear with null).
 * Story Reference: cv-4-3 AC-17, AC-21
 */
export function useSetSelectedAsset(): (asset: BrandAsset | null) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (asset: BrandAsset | null) => dispatch({ type: 'SET_SELECTED_ASSET', asset }),
    [dispatch]
  );
}

// =============================================================================
// Add Assets Panel Hooks (cv-4-4)
// =============================================================================

/**
 * Hook to check if the add assets panel is visible.
 * Story Reference: cv-4-4 AC-24
 */
export function useShowAddAssetsPanel(): boolean {
  const { state } = useCatalog();
  return state.showAddAssetsPanel;
}

/**
 * Hook to show/hide the add assets panel.
 * Story Reference: cv-4-4 AC-24
 */
export function useToggleAddAssetsPanel(): { show: () => void; hide: () => void } {
  const { dispatch } = useCatalog();
  return React.useMemo(
    () => ({
      show: () => dispatch({ type: 'SHOW_ADD_ASSETS_PANEL' }),
      hide: () => dispatch({ type: 'HIDE_ADD_ASSETS_PANEL' }),
    }),
    [dispatch]
  );
}

/**
 * Hook to access files selected for adding.
 * Story Reference: cv-4-4 AC-28
 */
export function useSelectedFilesForAdd(): FilePreview[] {
  const { state } = useCatalog();
  return state.selectedFilesForAdd;
}

/**
 * Hook to set files selected for adding.
 * Story Reference: cv-4-4 AC-28
 */
export function useSetFilesForAdd(): (files: FilePreview[]) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (files: FilePreview[]) => dispatch({ type: 'SET_FILES_FOR_ADD', files }),
    [dispatch]
  );
}

/**
 * Hook to append files to the add-assets selection (without replacing existing).
 * Story Reference: cv-4-4 AC-26, AC-27
 */
export function useAppendFilesForAdd(): (files: FilePreview[]) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (files: FilePreview[]) => dispatch({ type: 'APPEND_FILES_FOR_ADD', files }),
    [dispatch]
  );
}

/**
 * Hook to remove a single file from the add-assets selection by path.
 * Story Reference: cv-4-4 AC-28
 */
export function useRemoveFileForAdd(): (path: string) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (path: string) => dispatch({ type: 'REMOVE_FILE_FOR_ADD', path }),
    [dispatch]
  );
}

/**
 * Hook to access asset operation message.
 * Story Reference: cv-4-4 AC-34
 */
export function useAssetOperationMessage(): { text: string; type: 'success' | 'error' } | null {
  const { state } = useCatalog();
  return state.assetOperationMessage;
}

/**
 * Hook to set asset operation message.
 * Story Reference: cv-4-4 AC-34
 */
export function useSetAssetOperationMessage(): (message: { text: string; type: 'success' | 'error' } | null) => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    (message: { text: string; type: 'success' | 'error' } | null) =>
      dispatch({ type: 'SET_ASSET_OPERATION_MESSAGE', message }),
    [dispatch]
  );
}

// =============================================================================
// Template Selector Hooks (cv-5-1)
// =============================================================================

/**
 * Hook to access slide templates.
 * Story Reference: cv-5-1 AC-1, AC-3
 */
export function useSlideTemplates(): SlideTemplateDisplay[] {
  const { state } = useCatalog();
  return state.slideTemplates;
}

/**
 * Hook to access deck templates.
 * Story Reference: cv-5-1 AC-1
 */
export function useDeckTemplates(): DeckTemplateInfo[] {
  const { state } = useCatalog();
  return state.deckTemplates;
}

/**
 * Hook to access template search query.
 * Story Reference: cv-5-1 AC-5
 */
export function useTemplateSearchQuery(): string {
  const { state } = useCatalog();
  return state.templateSearchQuery;
}

/**
 * Hook to access template category filter (slide templates sub-tab).
 * Story Reference: cv-5-1 AC-4
 */
export function useTemplateCategoryFilter(): string | null {
  const { state } = useCatalog();
  return state.templateCategoryFilter;
}

/**
 * Hook to access deck template category filter (deck templates sub-tab).
 * Story Reference: tm-1-6 AC-3, AC-8
 */
export function useDeckTemplateCategoryFilter(): string | null {
  const { state } = useCatalog();
  return state.deckTemplateCategoryFilter;
}

/**
 * Filter templates by search query (name and description).
 */
function filterTemplatesBySearch<T extends { name: string; description: string }>(
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
 * Filter slide templates by category.
 */
function filterTemplatesByCategory(
  templates: SlideTemplateDisplay[],
  category: string | null
): SlideTemplateDisplay[] {
  if (!category) return templates;
  return templates.filter((t) => t.category === category);
}

/**
 * Returns filtered slide templates using deferred search for smooth typing.
 * Combines search query and category filter via AND intersection.
 * Story Reference: cv-5-1 AC-4, AC-5
 */
export function useFilteredSlideTemplates(): { filtered: SlideTemplateDisplay[]; total: number } {
  const { state } = useCatalog();
  const deferredQuery = useDeferredValue(state.templateSearchQuery);

  return useMemo(
    () => {
      let result = state.slideTemplates;
      result = filterTemplatesBySearch(result, deferredQuery);
      result = filterTemplatesByCategory(result, state.templateCategoryFilter);
      return {
        filtered: result,
        total: state.slideTemplates.length,
      };
    },
    [state.slideTemplates, deferredQuery, state.templateCategoryFilter],
  );
}

/**
 * Returns filtered deck templates using deferred search for smooth typing.
 * Applies both search query and deck category filter from context state.
 * Story Reference: cv-5-1 AC-5, tm-1-6 AC-8
 */
export function useFilteredDeckTemplates(): { filtered: DeckTemplateInfo[]; total: number } {
  const { state } = useCatalog();
  const deferredQuery = useDeferredValue(state.templateSearchQuery);

  return useMemo(
    () => {
      let result = filterTemplatesBySearch(state.deckTemplates, deferredQuery);
      // tm-1-6: Apply deck-specific category filter independently from slide category filter
      if (state.deckTemplateCategoryFilter) {
        result = result.filter((t) => t.category === state.deckTemplateCategoryFilter);
      }
      return {
        filtered: result,
        total: state.deckTemplates.length,
      };
    },
    [state.deckTemplates, deferredQuery, state.deckTemplateCategoryFilter],
  );
}

/**
 * Extract unique categories from slide templates.
 * Story Reference: cv-5-1 AC-4
 */
export function useTemplateCategories(): string[] {
  const { state } = useCatalog();
  return useMemo(() => {
    const categories = new Set<string>();
    for (const t of state.slideTemplates) {
      if (t.category) {
        categories.add(t.category);
      }
    }
    return Array.from(categories).sort();
  }, [state.slideTemplates]);
}

/**
 * Check if any template filters are active (search, slide category, or deck category).
 * Story Reference: cv-5-1, tm-1-6 AC-5
 */
export function useHasActiveTemplateFilters(): boolean {
  const { state } = useCatalog();
  return (
    state.templateSearchQuery !== '' ||
    state.templateCategoryFilter !== null ||
    state.deckTemplateCategoryFilter !== null
  );
}

// Export template filter functions for testing
export { filterTemplatesBySearch, filterTemplatesByCategory };

// =============================================================================
// Selection Selector Hooks (cv-5-4)
// =============================================================================

/**
 * Hook to access selected item IDs for bulk operations.
 * Story Reference: cv-5-4 AC-27
 */
export function useSelectedIds(): Set<string> {
  const { state } = useCatalog();
  return state.selectedIds;
}

/**
 * Hook to check if bulk selection mode is active.
 * Story Reference: cv-5-4 AC-28, AC-29
 */
export function useSelectionMode(): boolean {
  const { state } = useCatalog();
  return state.selectionMode;
}

/**
 * Hook to get the last selected ID (anchor for Shift+click range).
 * Story Reference: cv-5-4 AC-27
 */
export function useLastSelectedId(): string | null {
  const { state } = useCatalog();
  return state.lastSelectedId;
}

/**
 * Hook to get the selection count.
 * Story Reference: cv-5-4 AC-28
 */
export function useSelectionCount(): number {
  const { state } = useCatalog();
  return state.selectedIds.size;
}

/**
 * Hook to check if a specific item is selected.
 * Story Reference: cv-5-4 AC-27
 */
export function useIsItemSelected(id: string): boolean {
  const { state } = useCatalog();
  return state.selectedIds.has(id);
}

/**
 * Hook to clear selection.
 * Story Reference: cv-5-4 AC-32, AC-36
 */
export function useClearSelection(): () => void {
  const { dispatch } = useCatalog();
  return React.useCallback(
    () => dispatch({ type: 'CLEAR_SELECTION' }),
    [dispatch]
  );
}

/**
 * bt-1-1: Whether theme.json exists (for brand section conditional rendering).
 */
export function useHasTheme(): boolean {
  const { state } = useCatalog();
  return state.hasTheme;
}
