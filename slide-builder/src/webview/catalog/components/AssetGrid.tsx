/**
 * AssetGrid - Dense thumbnail grid for brand assets with search, type filters, and tag filters.
 *
 * Story Reference: cv-4-1 AC-1 through AC-8, AC-10
 * Story Reference: cv-4-2 AC-11 through AC-16
 * Architecture Reference: ADR-007 — Brand Asset Metadata in JSON Sidecar
 *
 * cv-4-1:
 * AC-1: Dense thumbnail grid of all brand assets
 * AC-3: Card shows thumbnail + filename + type badge
 * AC-4: Hover tooltip + border highlight
 * AC-5: Type icon overlay badge
 * AC-6: Grid: repeat(auto-fill, minmax(120px, 1fr)) with 12px gap
 * AC-7: EmptyState per sub-category
 * AC-8: "+ Add Assets" button placeholder
 * AC-10: Arrow key grid navigation, ARIA roles
 *
 * cv-4-2:
 * AC-11: Instant search filtering (<200ms)
 * AC-12: Search matches name, description, tags
 * AC-13: Toggleable type filter chips (Icons, Logos, Images)
 * AC-14: Tag filter chips from frequently used tags
 * AC-15: Empty results with "Clear filters" link
 * AC-16: Result count display ("X of Y assets")
 */

import React, { useCallback, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Image, FileImage, Award, Plus, Palette, Copy, Pencil, Tag, Files, Trash2 } from 'lucide-react';
import type { BrandAsset } from '../../../shared/types';
import {
  useCatalog,
  useFilteredBrandAssets,
  useBrandAssets,
  useAssetSearchQuery,
  useAssetTypeFilters,
  useAssetTagFilters,
  useAvailableAssetTags,
  useHasActiveAssetFilters,
  useSelectedAsset,
  useSetSelectedAsset,
  useToggleAddAssetsPanel,
  useAssetOperationMessage,
  useSetAssetOperationMessage,
} from '../context/CatalogContext';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { AssetDetail } from './AssetDetail';
import { AddAssetsPanel } from './AddAssetsPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { BatchAnalyzeButton } from './BatchAnalyzeButton';

// =============================================================================
// Type Filter Chips (cv-4-2 AC-13) — replaces SubCategoryTabs
// =============================================================================

const TYPE_FILTERS: { type: string; label: string }[] = [
  { type: 'icon', label: 'Icons' },
  { type: 'logo', label: 'Logos' },
  { type: 'image', label: 'Images' },
];

function TypeFilterChips(): React.ReactElement {
  const activeTypes = useAssetTypeFilters();
  const { dispatch } = useCatalog();

  const handleClick = useCallback(
    (filterType: string) => {
      dispatch({ type: 'TOGGLE_ASSET_TYPE_FILTER', filterType });
    },
    [dispatch],
  );

  return (
    <div className="asset-filter-chips" role="group" aria-label="Filter by type">
      {TYPE_FILTERS.map(({ type, label }) => {
        const isActive = activeTypes.includes(type);
        return (
          <button
            key={type}
            className={`asset-filter-chip asset-filter-chip--type${isActive ? ' asset-filter-chip--active' : ''}`}
            aria-pressed={isActive}
            onClick={() => handleClick(type)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Tag Filter Chips (cv-4-2 AC-14)
// =============================================================================

function TagFilterChips(): React.ReactElement | null {
  const availableTags = useAvailableAssetTags();
  const activeTags = useAssetTagFilters();
  const { dispatch } = useCatalog();

  const handleClick = useCallback(
    (tag: string) => {
      dispatch({ type: 'TOGGLE_ASSET_TAG_FILTER', tag });
    },
    [dispatch],
  );

  if (availableTags.length === 0) return null;

  return (
    <div className="asset-filter-chips asset-filter-chips--tags" role="group" aria-label="Filter by tag">
      {availableTags.map((tag) => {
        const isActive = activeTags.includes(tag);
        return (
          <button
            key={tag}
            className={`asset-filter-chip asset-filter-chip--tag${isActive ? ' asset-filter-chip--active' : ''}`}
            aria-pressed={isActive}
            onClick={() => handleClick(tag)}
            type="button"
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Type Badge (AC-5)
// =============================================================================

function TypeBadge({ type }: { type: BrandAsset['type'] }): React.ReactElement {
  const iconMap = {
    image: Image,
    icon: Palette,
    logo: Award,
  };
  const Icon = iconMap[type];

  return (
    <span className="asset-card__type-badge" aria-hidden="true">
      <Icon size={12} />
    </span>
  );
}

// =============================================================================
// Asset Card (AC-3, AC-4, AC-5)
// =============================================================================

interface AssetCardProps {
  asset: BrandAsset;
  onClick?: (asset: BrandAsset) => void;
  onCopyPath?: (asset: BrandAsset) => void;
  onEditDescription?: (asset: BrandAsset) => void;
  onEditTags?: (asset: BrandAsset) => void;
  onDuplicate?: (asset: BrandAsset) => void;
  onDelete?: (asset: BrandAsset) => void;
}

function AssetCard({
  asset,
  onClick,
  onCopyPath,
  onEditDescription,
  onEditTags,
  onDuplicate,
  onDelete,
}: AssetCardProps): React.ReactElement {
  const isIcon = asset.type === 'icon';

  const handleClick = useCallback(() => {
    onClick?.(asset);
  }, [asset, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(asset);
    }
  }, [asset, onClick]);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div>
          <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div
                  className="asset-card"
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`Asset: ${asset.name}, type: ${asset.type}`}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                >
                  <div className={`asset-card__thumbnail${isIcon ? ' asset-card__thumbnail--square' : ''}`}>
                    {asset.webviewUri ? (
                      <img
                        src={asset.webviewUri}
                        alt={asset.name}
                        className="asset-card__image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="asset-card__placeholder">
                        <FileImage size={24} />
                      </div>
                    )}
                    <TypeBadge type={asset.type} />
                  </div>
                  <p className="asset-card__name">{asset.name}</p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="asset-tooltip" sideOffset={5}>
                  <p className="asset-tooltip__name">{asset.name}</p>
                  {asset.description && (
                    <p className="asset-tooltip__description">{asset.description}</p>
                  )}
                  <p className="asset-tooltip__meta">
                    {asset.format.toUpperCase()} · {formatFileSize(asset.fileSize)}
                  </p>
                  <Tooltip.Arrow className="asset-tooltip__arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </ContextMenu.Trigger>
      {/* cv-4-5 AC-42, AC-43: Right-click context menu */}
      <ContextMenu.Portal>
        <ContextMenu.Content className="asset-context-menu">
          <ContextMenu.Item
            className="asset-context-menu__item"
            onSelect={() => onCopyPath?.(asset)}
          >
            <Copy size={14} />
            Copy Path
          </ContextMenu.Item>
          <ContextMenu.Item
            className="asset-context-menu__item"
            onSelect={() => onEditDescription?.(asset)}
          >
            <Pencil size={14} />
            Edit Description
          </ContextMenu.Item>
          <ContextMenu.Item
            className="asset-context-menu__item"
            onSelect={() => onEditTags?.(asset)}
          >
            <Tag size={14} />
            Edit Tags
          </ContextMenu.Item>
          <ContextMenu.Separator className="asset-context-menu__separator" />
          <ContextMenu.Item
            className="asset-context-menu__item"
            onSelect={() => onDuplicate?.(asset)}
          >
            <Files size={14} />
            Duplicate
          </ContextMenu.Item>
          <ContextMenu.Separator className="asset-context-menu__separator" />
          <ContextMenu.Item
            className="asset-context-menu__item asset-context-menu__item--destructive"
            onSelect={() => onDelete?.(asset)}
          >
            <Trash2 size={14} />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// Empty States (AC-7, cv-4-2 AC-15)
// =============================================================================

/** Empty state when brand library has no assets at all */
function AssetLibraryEmptyState(): React.ReactElement {
  return (
    <div className="empty-state" role="status">
      <p className="empty-state__title">No assets in your brand library</p>
      <p className="empty-state__hint">
        Add assets to <code>.slide-builder/config/catalog/brand-assets/</code> to see them here.
      </p>
    </div>
  );
}

/** Empty state when search/filters yield no results (cv-4-2 AC-15) */
function AssetSearchEmptyState({ query }: { query: string }): React.ReactElement {
  const { dispatch } = useCatalog();

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR_ASSET_FILTERS' });
  }, [dispatch]);

  return (
    <div className="asset-search-empty" role="status">
      <p className="asset-search-empty__title">
        {query ? `No results for '${query}'` : 'No matching assets'}
      </p>
      <button className="asset-search-empty__clear" onClick={handleClear} type="button">
        Clear filters
      </button>
    </div>
  );
}

// =============================================================================
// Main AssetGrid Component
// =============================================================================

export function AssetGrid(): React.ReactElement {
  const allAssets = useBrandAssets();
  const { filtered: filteredAssets, total } = useFilteredBrandAssets();
  const query = useAssetSearchQuery();
  const hasActiveFilters = useHasActiveAssetFilters();
  const selectedAsset = useSelectedAsset();
  const setSelectedAsset = useSetSelectedAsset();
  const { show: showAddAssetsPanel } = useToggleAddAssetsPanel();
  const operationMessage = useAssetOperationMessage();
  const setOperationMessage = useSetAssetOperationMessage();
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // cv-4-5: Context menu delete confirmation
  const [contextDeleteAsset, setContextDeleteAsset] = useState<BrandAsset | null>(null);

  // cv-4-3 AC-17: Handle asset card click to open detail panel
  const handleAssetClick = useCallback((asset: BrandAsset) => {
    setSelectedAsset(asset);
  }, [setSelectedAsset]);

  // cv-4-3 AC-21: Handle click outside to close panel
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking on the grid area, not the detail panel
    if (selectedAsset && containerRef.current) {
      const target = e.target as HTMLElement;
      // Check if click is outside the detail panel and not on an asset card
      const isOnDetailPanel = target.closest('.asset-detail');
      const isOnAssetCard = target.closest('.asset-card');
      if (!isOnDetailPanel && !isOnAssetCard) {
        setSelectedAsset(null);
      }
    }
  }, [selectedAsset, setSelectedAsset]);

  // AC-10: Arrow key navigation within grid
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!gridRef.current) return;
    const cells = Array.from(gridRef.current.querySelectorAll<HTMLElement>('[role="gridcell"]'));
    const currentIndex = cells.indexOf(document.activeElement as HTMLElement);
    if (currentIndex < 0) return;

    // Estimate columns from grid layout
    const gridWidth = gridRef.current.offsetWidth;
    const cols = Math.max(1, Math.floor(gridWidth / 132)); // 120px + 12px gap

    let nextIndex = -1;
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, cells.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + cols, cells.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - cols, 0);
        break;
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex !== currentIndex) {
      e.preventDefault();
      cells[nextIndex].focus();
    }
  }, []);

  // cv-4-4 AC-24: Open AddAssetsPanel when clicking "+ Add Assets"
  const handleAddAssets = useCallback(() => {
    showAddAssetsPanel();
  }, [showAddAssetsPanel]);

  // cv-4-4 AC-34: Auto-dismiss operation message after 3 seconds
  React.useEffect(() => {
    if (operationMessage) {
      const timer = setTimeout(() => {
        setOperationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationMessage, setOperationMessage]);

  // cv-4-5 AC-42: Context menu handlers
  const handleContextCopyPath = useCallback((asset: BrandAsset) => {
    getVSCodeApi().postMessage({
      type: 'copy-asset-path',
      relativePath: asset.relativePath,
    });
    setOperationMessage({ text: 'Path copied to clipboard', type: 'success' });
  }, [setOperationMessage]);

  const handleContextEditDescription = useCallback((asset: BrandAsset) => {
    // Open detail panel — description editing is in AssetDetail
    setSelectedAsset(asset);
  }, [setSelectedAsset]);

  const handleContextEditTags = useCallback((asset: BrandAsset) => {
    // Open detail panel — tag editing is in AssetDetail
    setSelectedAsset(asset);
  }, [setSelectedAsset]);

  const handleContextDuplicate = useCallback((asset: BrandAsset) => {
    getVSCodeApi().postMessage({
      type: 'duplicate-brand-asset',
      id: asset.id,
    });
  }, []);

  const handleContextDelete = useCallback((asset: BrandAsset) => {
    setContextDeleteAsset(asset);
  }, []);

  const handleConfirmContextDelete = useCallback(() => {
    if (contextDeleteAsset) {
      getVSCodeApi().postMessage({
        type: 'delete-brand-asset',
        id: contextDeleteAsset.id,
      });
      // If this was the selected asset, clear selection
      if (selectedAsset?.id === contextDeleteAsset.id) {
        setSelectedAsset(null);
      }
      setContextDeleteAsset(null);
    }
  }, [contextDeleteAsset, selectedAsset, setSelectedAsset]);

  // Main grid content
  const gridContent = (
    <div className="asset-grid-container">
      {/* cv-4-4 AC-34: Operation success/error message */}
      {operationMessage && (
        <div
          className={`asset-operation-message asset-operation-message--${operationMessage.type}`}
          role="status"
          aria-live="polite"
        >
          {operationMessage.text}
        </div>
      )}

      {/* Section header with type filters, Batch Analyze, and Add button */}
      <div className="asset-grid__header">
        <TypeFilterChips />
        <div className="asset-grid__header-actions">
          {/* v3-4-2 AC-11: Batch analyze button */}
          <BatchAnalyzeButton />
          <button
            className="asset-grid__add-btn"
            onClick={handleAddAssets}
            type="button"
            aria-label="Add brand assets"
          >
            <Plus size={14} />
            <span>Add Assets</span>
          </button>
        </div>
      </div>

      {/* Tag filter chips (cv-4-2 AC-14) */}
      <TagFilterChips />

      {/* Grid or empty state */}
      {allAssets.length === 0 ? (
        <AssetLibraryEmptyState />
      ) : filteredAssets.length === 0 ? (
        <AssetSearchEmptyState query={query} />
      ) : (
        <div
          ref={gridRef}
          className="asset-grid"
          role="grid"
          aria-label="Brand assets"
          onKeyDown={handleKeyDown}
        >
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={handleAssetClick}
              onCopyPath={handleContextCopyPath}
              onEditDescription={handleContextEditDescription}
              onEditTags={handleContextEditTags}
              onDuplicate={handleContextDuplicate}
              onDelete={handleContextDelete}
            />
          ))}
        </div>
      )}

      {/* cv-4-4 AC-24: AddAssetsPanel modal */}
      <AddAssetsPanel />

      {/* cv-4-5: Context menu delete confirmation */}
      <ConfirmDialog
        open={contextDeleteAsset !== null}
        onOpenChange={(open) => { if (!open) setContextDeleteAsset(null); }}
        title={contextDeleteAsset ? `Delete '${contextDeleteAsset.name}'?` : ''}
        description="This cannot be undone. The file will be moved to trash."
        confirmLabel="Delete"
        onConfirm={handleConfirmContextDelete}
        variant="destructive"
      />
    </div>
  );

  // cv-4-3 AC-22: Split view when asset is selected
  if (selectedAsset) {
    return (
      <div
        ref={containerRef}
        className="asset-grid-split"
        onClick={handleContainerClick}
      >
        <div className="asset-grid-split__main">
          {gridContent}
        </div>
        <AssetDetail />
      </div>
    );
  }

  return gridContent;
}
