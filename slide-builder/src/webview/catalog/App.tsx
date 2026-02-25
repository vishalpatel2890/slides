/**
 * Catalog webview root component.
 *
 * Story Reference: cv-1-2 Task 6 — Integrate components in App.tsx
 * Story Reference: cv-1-3 AC-4, AC-6 — Deck data consumption and empty state
 * Story Reference: cv-1-4 Task 6 — Wire DeckGrid into App.tsx
 * Story Reference: cv-1-5 Task 6 — Wire search/filter into DecksContent
 * Story Reference: cv-1-6 Task 6 — Wire DeckDetail into navigation
 *
 * AC-4: CatalogProvider → TabBar → SearchBar → NavigationHeader → content area
 * AC-5: Responsive collapse handled by TabBar
 * AC-6: Empty state when no decks found; DeckGrid when decks available
 * AC-7: Theme integration via CSS custom properties
 * cv-1-6 AC-1: Drill-down to DeckDetail when navigating to deck
 */

import React, { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, List, Trash2, X } from 'lucide-react';
import {
  CatalogProvider,
  useCatalog,
  useFilteredDecksInFolder,
  useFilteredBrandAssets,
  useCatalogDecks,
  useCatalogFolders,
  useCurrentFolderId,
  useBuildProgress,
  useHasActiveAssetFilters,
  useSlideTemplates,
  useDeckTemplates,
  useHasActiveTemplateFilters,
  useSelectionCount,
  useSelectedIds,
  useClearSelection,
} from './context/CatalogContext';
import { TabBar } from './components/TabBar';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { NavigationHeader } from './components/NavigationHeader';
import { DeckGrid } from './components/DeckGrid';
import { DeckDetail } from './components/DeckDetail';
import { BuildProgress } from './components/BuildProgress';
import { EmptyState } from './components/EmptyState';
import { AssetGrid } from './components/AssetGrid';
import { TemplateGrid } from './components/TemplateGrid';
import { TemplateList } from './components/TemplateList';
import { TemplateEditPanel } from './components/TemplateEditPanel';
import { DeckList } from './components/DeckList';
import { NewDeckDropdown } from './components/NewDeckDropdown';
import { ConfirmDialog } from './components/ConfirmDialog';
import { BulkDeleteDialog } from './components/BulkDeleteDialog';
import { MoveToFolderDropdown } from './components/MoveToFolderDropdown';
import { OperationModal } from './components/OperationModal';
import { BrandSection } from './components/BrandSection';
import { useNavigation } from './hooks/useNavigation';
import { useCatalogBridge } from './hooks/useCatalogBridge';
import { useOperationForms } from './hooks/useOperationForms';
import { getVSCodeApi } from '../shared/hooks/useVSCodeApi';
import { useActiveTab } from './context/CatalogContext';
import type { CatalogTab, DeckInfo, FolderInfo, SlideTemplateSchema } from '../../shared/types';

// =============================================================================
// Tab Content Placeholders
// =============================================================================

const TAB_PLACEHOLDERS: Record<CatalogTab, string> = {
  'decks': '', // Handled by DecksContent component
  'brand-assets': '', // Handled by AssetGrid component
  'templates': '', // Handled by TemplatesContent component
};

// =============================================================================
// View Toggle (cv-1-4 AC-4)
// =============================================================================

function ViewToggle(): React.ReactElement {
  const { state, dispatch } = useCatalog();
  const isGrid = state.viewMode === 'grid';

  const handleToggle = useCallback(() => {
    const newMode = isGrid ? 'list' : 'grid';
    // v3-2-1 AC-1, AC-5: Update local state immediately (instant switch)
    dispatch({ type: 'SET_VIEW_MODE', mode: newMode });
    // v3-2-1 AC-2: Post to extension host for globalState persistence
    const api = getVSCodeApi();
    api.postMessage({ type: 'set-view-preference', mode: newMode });
  }, [dispatch, isGrid]);

  return (
    <button
      className="view-toggle"
      onClick={handleToggle}
      type="button"
      aria-label={isGrid ? 'Switch to list view' : 'Switch to grid view'}
      title={isGrid ? 'List view' : 'Grid view'}
    >
      {isGrid ? <List size={16} /> : <LayoutGrid size={16} />}
    </button>
  );
}

// =============================================================================
// Deck Actions - View Toggle + New Deck Dropdown (cv-3-1 AC-1, AC-2, AC-3)
// cv-5-4: Bulk actions when items selected
// =============================================================================

function DeckActions(): React.ReactElement {
  const folders = useCatalogFolders();
  const selectionCount = useSelectionCount();
  const selectedIds = useSelectedIds();
  const clearSelection = useClearSelection();
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // v3-5-1: Operation modal state
  const [planDeckModalOpen, setPlanDeckModalOpen] = useState(false);
  const [planOneModalOpen, setPlanOneModalOpen] = useState(false);
  const { getConfig } = useOperationForms();
  const planDeckConfig = getConfig('plan-deck');
  const planOneConfig = getConfig('plan-one');

  // v3-5-1 AC-1: Open modal instead of directly invoking Claude Code
  const handlePlanWithAI = useCallback(() => {
    setPlanDeckModalOpen(true);
  }, []);

  const handlePlanSlideWithAI = useCallback(() => {
    setPlanOneModalOpen(true);
  }, []);

  // v3-5-1 AC-3: Handle form submission
  const handlePlanDeckSubmit = useCallback((data: Record<string, unknown>) => {
    const api = getVSCodeApi();
    api.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-create:plan-deck',
      data,
    });
  }, []);

  const handlePlanOneSubmit = useCallback((data: Record<string, unknown>) => {
    const api = getVSCodeApi();
    api.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-create:plan-one',
      data,
    });
  }, []);

  const handleFromTemplate = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'create-deck', method: 'from-template' });
  }, []);

  // cv-3-3 AC-16: Create new folder
  const handleNewFolder = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'create-folder' });
  }, []);

  // cv-5-4 AC-34: Bulk delete handler
  const handleBulkDelete = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'delete-decks', deckIds: Array.from(selectedIds) });
    clearSelection();
  }, [selectedIds, clearSelection]);

  // cv-5-4 AC-35: Bulk move handler
  const handleBulkMove = useCallback((targetFolderId: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'move-decks-to-folder', deckIds: Array.from(selectedIds), targetFolderId });
    clearSelection();
  }, [selectedIds, clearSelection]);

  // cv-5-4: Show bulk actions when items are selected
  if (selectionCount > 0) {
    return (
      <>
        {/* Selection indicator */}
        <span className="selection-indicator">
          {selectionCount} selected
        </span>

        {/* Move to folder dropdown - AC-31 */}
        <MoveToFolderDropdown
          folders={folders}
          onSelectFolder={handleBulkMove}
          onCreateAndMove={(name) => {
            // For now, just create folder and move (TODO: implement create-and-move)
            const api = getVSCodeApi();
            api.postMessage({ type: 'create-folder' });
          }}
        />

        {/* Delete selected - AC-30 */}
        <button
          type="button"
          className="bulk-action-btn bulk-action-btn--destructive"
          onClick={() => setBulkDeleteDialogOpen(true)}
          aria-label={`Delete ${selectionCount} selected decks`}
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>

        {/* Clear selection button */}
        <button
          type="button"
          className="bulk-action-btn"
          onClick={clearSelection}
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>

        {/* Bulk delete confirmation dialog */}
        <BulkDeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          count={selectionCount}
          itemType="decks"
          onConfirm={handleBulkDelete}
        />
      </>
    );
  }

  // Normal deck actions (no selection)
  return (
    <>
      <NewDeckDropdown
        onPlanWithAI={handlePlanWithAI}
        onPlanSlideWithAI={handlePlanSlideWithAI}
        onFromTemplate={handleFromTemplate}
        onNewFolder={handleNewFolder}
      />
      <ViewToggle />
      {/* v3-5-1 AC-1, AC-2, AC-3, AC-4: Plan deck modal */}
      {planDeckConfig && (
        <OperationModal
          open={planDeckModalOpen}
          onOpenChange={setPlanDeckModalOpen}
          config={planDeckConfig}
          onSubmit={handlePlanDeckSubmit}
        />
      )}
      {/* Plan one modal */}
      {planOneConfig && (
        <OperationModal
          open={planOneModalOpen}
          onOpenChange={setPlanOneModalOpen}
          config={planOneConfig}
          onSubmit={handlePlanOneSubmit}
        />
      )}
    </>
  );
}

// =============================================================================
// Decks Content (cv-1-4 AC-1, AC-6; cv-1-5 AC-1, AC-2, AC-3; cv-1-6 AC-1)
// =============================================================================

function DecksContent(): React.ReactElement {
  const allDecks = useCatalogDecks();
  const folders = useCatalogFolders();
  const currentFolderId = useCurrentFolderId();
  const { filtered } = useFilteredDecksInFolder();
  const { state, dispatch } = useCatalog();
  const buildProgress = useBuildProgress();

  // cv-3-2: Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<DeckInfo | null>(null);

  // Check if we're on a deck-detail view or folder view
  const currentEntry = state.navigationStack[state.navigationStack.length - 1];
  const isDetailView = currentEntry?.type === 'deck-detail';
  const isFolderView = currentEntry?.type === 'folder';

  const handleDeckClick = useCallback(
    (deckId: string) => {
      dispatch({ type: 'NAVIGATE_TO_DECK', deckId });
      // Request deck detail data from extension host
      const api = getVSCodeApi();
      api.postMessage({ type: 'request-deck-detail', deckId });
    },
    [dispatch],
  );

  // cv-3-3 AC-20: Folder drill-down navigation
  const handleFolderClick = useCallback(
    (folderId: string) => {
      dispatch({ type: 'NAVIGATE_TO_FOLDER', folderId });
    },
    [dispatch],
  );

  const handleEditPlan = useCallback((deckId: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-plan-editor', deckId });
  }, []);

  // cv-3-2 AC-2: Duplicate handler - send message to extension host
  const handleDuplicate = useCallback((deckId: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'duplicate-deck', deckId });
  }, []);

  // cv-3-2 AC-4: Delete handler - open confirmation dialog
  const handleDeleteRequest = useCallback((deck: DeckInfo) => {
    setDeckToDelete(deck);
    setDeleteDialogOpen(true);
  }, []);

  // cv-3-2 AC-7: Confirm delete - send message to extension host
  const handleDeleteConfirm = useCallback(() => {
    if (deckToDelete) {
      const api = getVSCodeApi();
      api.postMessage({ type: 'delete-deck', deckId: deckToDelete.id });
      setDeckToDelete(null);
    }
  }, [deckToDelete]);

  // cv-3-3 AC-21: Folder rename handler
  const handleFolderRename = useCallback((folderId: string, newName: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'rename-folder', folderId, newName });
  }, []);

  // cv-3-6: Folder delete handler
  const handleFolderDelete = useCallback((folder: FolderInfo) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'delete-folder', folderId: folder.id });
  }, []);

  // cv-3-3 AC-18: Move deck to folder handler
  const handleMoveDeck = useCallback((deckId: string, targetFolderId: string | undefined) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'move-deck', deckId, targetFolderId });
  }, []);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

  // cv-3-5: Cancel build handler - just clear progress (no navigation needed)
  const handleCancelBuild = useCallback(() => {
    dispatch({ type: 'CLEAR_BUILD_PROGRESS' });
  }, [dispatch]);

  // cv-3-5: Back/dismiss from build progress - just clear progress
  const handleBuildProgressBack = useCallback(() => {
    dispatch({ type: 'CLEAR_BUILD_PROGRESS' });
  }, [dispatch]);

  // Re-request deck detail on restore from persisted state (cv-1-6 AC-8)
  useEffect(() => {
    if (isDetailView && !state.deckDetail && state.selectedDeckId) {
      const api = getVSCodeApi();
      api.postMessage({ type: 'request-deck-detail', deckId: state.selectedDeckId });
    }
  }, [isDetailView, state.deckDetail, state.selectedDeckId]);

  // cv-3-5: Render BuildProgress when build is active (AC-29)
  if (buildProgress && (buildProgress.status === 'building' || buildProgress.status === 'complete' || buildProgress.status === 'cancelled')) {
    return (
      <BuildProgress
        progress={buildProgress}
        onCancel={handleCancelBuild}
        onBack={handleBuildProgressBack}
      />
    );
  }

  // Render DeckDetail when drilled in (cv-1-6 AC-1)
  if (isDetailView && state.deckDetail) {
    return <DeckDetail deck={state.deckDetail} />;
  }

  // Still loading detail data
  if (isDetailView && !state.deckDetail) {
    return <div className="deck-detail__loading" role="status">Loading deck details...</div>;
  }

  const isFiltering = state.searchQuery !== '' || state.statusFilters.length > 0;

  // No decks at all (and no folders at root) — show default empty state
  if (allDecks.length === 0 && folders.length === 0) {
    return <EmptyState section="decks" />;
  }

  // Decks exist but no results match current search/filter (cv-1-8 AC-2: works inside folders too)
  if (filtered.length === 0 && isFiltering) {
    return (
      <EmptyState
        section="decks"
        searchContext={{ query: state.searchQuery, hasFilters: state.statusFilters.length > 0 }}
        onClearFilters={handleClearFilters}
      />
    );
  }

  // v3-2-2: Conditionally render DeckList (list mode) or DeckGrid (grid mode)
  const displayFolders = isFiltering ? [] : folders;

  return (
    <>
      {state.viewMode === 'list' ? (
        <DeckList
          decks={filtered}
          folders={displayFolders}
          onDeckClick={handleDeckClick}
          onFolderClick={handleFolderClick}
          onEditPlan={handleEditPlan}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteRequest}
          onFolderRename={handleFolderRename}
          onFolderDelete={handleFolderDelete}
          onMoveDeck={handleMoveDeck}
          currentFolderId={currentFolderId}
        />
      ) : (
        <DeckGrid
          decks={filtered}
          folders={displayFolders}
          viewMode={state.viewMode}
          onDeckClick={handleDeckClick}
          onFolderClick={handleFolderClick}
          onEditPlan={handleEditPlan}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteRequest}
          onFolderRename={handleFolderRename}
          onFolderDelete={handleFolderDelete}
          onMoveDeck={handleMoveDeck}
          currentFolderId={currentFolderId}
        />
      )}
      {/* cv-3-2 AC-4, AC-5, AC-6: Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete '${deckToDelete?.name ?? ''}'?`}
        description="This removes the deck and all its slides. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}

// =============================================================================
// Templates Content (cv-5-1, tm-1-1)
// tm-1-1: Slide template schema editing via TemplateEditPanel
// =============================================================================

function TemplatesContent(): React.ReactElement {
  const slideTemplates = useSlideTemplates();
  const deckTemplates = useDeckTemplates();
  // tm-1-6: searchQuery no longer prop-drilled; TemplateGrid/TemplateList read from context
  const { state, dispatch } = useCatalog();

  // tm-1-1: State for slide template editing (slide templates only)
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // tm-1-5: State for Add Slide Template modal
  const [addSlideTemplateModalOpen, setAddSlideTemplateModalOpen] = useState(false);
  // tm-3-1: State for Add Deck Template modal
  const [addDeckTemplateModalOpen, setAddDeckTemplateModalOpen] = useState(false);
  const { getConfig } = useOperationForms();
  const addSlideTemplateConfig = getConfig('add-slide-template');
  const addDeckTemplateConfig = getConfig('add-deck-template');

  // cv-5-1: Request templates on mount
  useEffect(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'request-templates' });
  }, []);

  // tm-1-1: Listen for save confirmation from extension host
  // tm-1-3: Listen for delete confirmation from extension host
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (
        message.type === 'slide-template-schema-saved' &&
        message.templateId === editingTemplate?.id &&
        message.success
      ) {
        setEditingTemplate(null);
      }
      if (
        message.type === 'slide-template-deleted' &&
        message.templateId === editingTemplate?.id &&
        message.success
      ) {
        dispatch({ type: 'DELETE_SLIDE_TEMPLATE', templateId: message.templateId });
        setEditingTemplate(null);
      }
      // tm-2-3: Handle deck-template-deleted for forward-compatibility
      if (
        message.type === 'deck-template-deleted' &&
        message.success
      ) {
        dispatch({ type: 'DELETE_DECK_TEMPLATE', templateId: message.templateId });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingTemplate?.id, dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_TEMPLATE_FILTERS' });
  }, [dispatch]);

  // tm-1-1: Open edit panel for slide templates only (deck templates have a different schema)
  const handleEditTemplate = useCallback((templateId: string, templateName: string) => {
    const isSlide = slideTemplates.some((t) => t.id === templateId);
    if (!isSlide) return;
    setEditingTemplate({ id: templateId, name: templateName });
  }, [slideTemplates]);

  // tm-1-1: Save slide template schema to extension host
  const handleSaveSchema = useCallback((schema: SlideTemplateSchema) => {
    if (!editingTemplate) return;
    const api = getVSCodeApi();
    api.postMessage({
      type: 'save-slide-template-schema',
      templateId: editingTemplate.id,
      schema,
    });
  }, [editingTemplate]);

  const handleCloseEditPanel = useCallback(() => {
    setEditingTemplate(null);
  }, []);

  // tm-1-3: Delete slide template — sends delete-slide-template message to extension host
  const handleDeleteTemplate = useCallback(() => {
    if (!editingTemplate) return;
    const api = getVSCodeApi();
    api.postMessage({
      type: 'delete-slide-template',
      templateId: editingTemplate.id,
    });
  }, [editingTemplate]);

  // tm-1-5: Open the Add Slide Template modal
  const handleOpenAddSlideTemplate = useCallback(() => {
    setAddSlideTemplateModalOpen(true);
  }, []);

  // tm-1-5: Submit Add Slide Template form — routes to PromptAssemblyService via extension host
  const handleAddSlideTemplateSubmit = useCallback((data: Record<string, unknown>) => {
    const api = getVSCodeApi();
    api.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-slide-template',
      data,
    });
  }, []);

  // tm-3-1: Open the Add Deck Template modal
  const handleOpenAddDeckTemplate = useCallback(() => {
    setAddDeckTemplateModalOpen(true);
  }, []);

  // tm-3-1: Submit Add Deck Template form — routes to PromptAssemblyService via extension host
  const handleAddDeckTemplateSubmit = useCallback((data: Record<string, unknown>) => {
    const api = getVSCodeApi();
    api.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-deck-template',
      data,
    });
  }, []);

  // tm-1-5: Listen for form-submitted-ack to close the modal on success
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (
        message.type === 'form-submitted-ack' &&
        message.operationId === 'sb-manage:add-slide-template' &&
        message.success
      ) {
        setAddSlideTemplateModalOpen(false);
      }
      // tm-3-1: Close Add Deck Template modal on success
      if (
        message.type === 'form-submitted-ack' &&
        message.operationId === 'sb-manage:add-deck-template' &&
        message.success
      ) {
        setAddDeckTemplateModalOpen(false);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // tm-2-1: Handle deck template card click — sends inspect-deck-template to extension
  // Extension host opens DeckTemplateEditorPanel; no response handling needed here.
  const handleDeckTemplateClick = useCallback((templateId: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'inspect-deck-template', templateId });
  }, []);

  // Story 1.2: Handle slide template preview — sends preview-slide-template to extension
  // Extension host opens SlideViewerV2Panel with the template HTML
  const handleSlideTemplatePreview = useCallback((templateId: string) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'preview-slide-template', templateId });
  }, []);

  // Shared props for both grid and list views
  // tm-1-6: searchQuery removed — TemplateGrid/TemplateList read search from context hooks
  const sharedTemplateProps = {
    slideTemplates,
    deckTemplates,
    onClearFilters: handleClearFilters,
    onEditTemplate: handleEditTemplate,
  };

  const gridOrList = state.viewMode === 'list' ? (
    <TemplateList
      {...sharedTemplateProps}
      onAddSlideTemplate={handleOpenAddSlideTemplate}
      onAddDeckTemplate={handleOpenAddDeckTemplate}
      onDeckTemplateClick={handleDeckTemplateClick}
    />
  ) : (
    <TemplateGrid
      {...sharedTemplateProps}
      onAddSlideTemplate={handleOpenAddSlideTemplate}
      onAddDeckTemplate={handleOpenAddDeckTemplate}
      onDeckTemplateClick={handleDeckTemplateClick}
    />
  );

  if (!editingTemplate) {
    return (
      <>
        {gridOrList}
        {/* tm-1-5: Add Slide Template modal */}
        {addSlideTemplateConfig && (
          <OperationModal
            open={addSlideTemplateModalOpen}
            onOpenChange={setAddSlideTemplateModalOpen}
            config={addSlideTemplateConfig}
            onSubmit={handleAddSlideTemplateSubmit}
          />
        )}
        {/* tm-3-1: Add Deck Template modal */}
        {addDeckTemplateConfig && (
          <OperationModal
            open={addDeckTemplateModalOpen}
            onOpenChange={setAddDeckTemplateModalOpen}
            config={addDeckTemplateConfig}
            onSubmit={handleAddDeckTemplateSubmit}
          />
        )}
      </>
    );
  }

  const foundTemplate = slideTemplates.find((t) => t.id === editingTemplate.id);
  return (
    <div className="template-grid-split">
      <div className="template-grid-split__main">
        {gridOrList}
      </div>
      {/* tm-1-1: Slide template schema edit panel — slides in from right */}
      {/* tm-1-3: onDelete wired to send delete-slide-template message */}
      {/* Story 1.2: onPreview wired to send preview-slide-template message */}
      <TemplateEditPanel
        templateId={editingTemplate.id}
        templateName={editingTemplate.name}
        schema={{
          name: foundTemplate?.name ?? editingTemplate.name,
          description: foundTemplate?.description ?? '',
          use_cases: foundTemplate?.use_cases ?? [],
          background_mode: foundTemplate?.background_mode,
        }}
        onSave={handleSaveSchema}
        onClose={handleCloseEditPanel}
        onDelete={handleDeleteTemplate}
        onPreview={handleSlideTemplatePreview}
      />
      {/* tm-1-5: Add Slide Template modal (also available in edit-panel split view) */}
      {addSlideTemplateConfig && (
        <OperationModal
          open={addSlideTemplateModalOpen}
          onOpenChange={setAddSlideTemplateModalOpen}
          config={addSlideTemplateConfig}
          onSubmit={handleAddSlideTemplateSubmit}
        />
      )}
      {/* tm-3-1: Add Deck Template modal (also available in edit-panel split view) */}
      {addDeckTemplateConfig && (
        <OperationModal
          open={addDeckTemplateModalOpen}
          onOpenChange={setAddDeckTemplateModalOpen}
          config={addDeckTemplateConfig}
          onSubmit={handleAddDeckTemplateSubmit}
        />
      )}
    </div>
  );
}

// =============================================================================
// Backspace Navigation (cv-1-6 AC-8)
// =============================================================================

function useBackspaceNavigation(): void {
  const { state, dispatch } = useCatalog();
  const currentEntry = state.navigationStack[state.navigationStack.length - 1];
  const isDetailView = currentEntry?.type === 'deck-detail';
  const isFolderView = currentEntry?.type === 'folder';
  const canGoBack = isDetailView || isFolderView;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger on Backspace when in detail/folder view and not typing in an input
      if (
        e.key === 'Backspace' &&
        canGoBack &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        dispatch({ type: 'NAVIGATE_BACK' });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, canGoBack]);
}

// =============================================================================
// App Content (inside CatalogProvider)
// =============================================================================

function AppContent(): React.ReactElement {
  useNavigation(); // Handles state persistence with VS Code webview state
  useCatalogBridge(); // Connects to extension host for deck data (cv-1-3)
  useBackspaceNavigation(); // Backspace returns from detail to grid (cv-1-6 AC-8)
  const activeTab = useActiveTab();
  const { filtered, total } = useFilteredDecksInFolder();
  const { filtered: filteredAssets, total: assetTotal } = useFilteredBrandAssets();
  const hasActiveAssetFilters = useHasActiveAssetFilters();
  const folders = useCatalogFolders();
  const currentFolderId = useCurrentFolderId();
  const { state } = useCatalog();
  const isDeckFiltering = state.searchQuery !== '' || state.statusFilters.length > 0;
  const currentEntry = state.navigationStack[state.navigationStack.length - 1];
  const isDetailView = currentEntry?.type === 'deck-detail';
  // cv-1-8 AC-4: Resolve folder name for scoped result count display
  // Don't show folder scope when searching globally (search spans all folders)
  const folderName = (currentFolderId && !isDeckFiltering)
    ? folders.find((f) => f.id === currentFolderId)?.name
    : undefined;

  // cv-4-2: Compute result count based on active tab
  const searchResultCount = activeTab === 'brand-assets'
    ? (hasActiveAssetFilters ? { filtered: filteredAssets.length, total: assetTotal } : undefined)
    : (isDeckFiltering ? { filtered: filtered.length, total } : undefined);

  return (
    <div className="catalog-root" role="main" aria-label="Slide Builder Catalog">
      <TabBar />
      {!isDetailView && (
        <>
          <SearchBar resultCount={searchResultCount} folderName={folderName} />
          {activeTab === 'decks' && <FilterChips />}
        </>
      )}
      <NavigationHeader actions={activeTab === 'decks' && !isDetailView ? <DeckActions /> : undefined} />
      <main className="catalog-content" role="tabpanel">
        {activeTab === 'decks' ? (
          <DecksContent />
        ) : activeTab === 'brand-assets' ? (
          <AssetGrid />
        ) : activeTab === 'templates' ? (
          <TemplatesContent />
        ) : (
          <p>{TAB_PLACEHOLDERS[activeTab]}</p>
        )}
      </main>
      {/* bt-1-1: Persistent brand management section (ADR-BRAND-1) */}
      <BrandSection />
    </div>
  );
}

// =============================================================================
// Root Component
// =============================================================================

export function App(): React.ReactElement {
  return (
    <CatalogProvider>
      <AppContent />
    </CatalogProvider>
  );
}
