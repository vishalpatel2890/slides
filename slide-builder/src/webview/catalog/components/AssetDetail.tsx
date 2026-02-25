/**
 * AssetDetail - Side panel component for full-size asset preview and metadata.
 *
 * Story Reference: cv-4-3 AC-17 through AC-23
 * Story Reference: cv-4-5 AC-35 through AC-41
 * Architecture Reference: ADR-004 - Render-only webview client
 *
 * cv-4-3:
 * AC-17: Panel slides in from right on asset card click
 * AC-18: Full-size preview scaled to fit panel width
 * AC-19: Metadata: name, description, tags (chips), file info
 * AC-20: Copy Path button copies relativePath to clipboard
 * AC-21: Close via button, Escape key, or click outside
 * AC-22: Split view - grid remains visible
 * AC-23: role="complementary" for accessibility
 *
 * cv-4-5:
 * AC-35: Clicking display name text makes it inline editable (saves on blur/Enter)
 * AC-36: Clicking description text makes it inline editable (same pattern)
 * AC-37: Tags displayed as chip input (delegated to TagInput component)
 * AC-38: All metadata changes save immediately to assets.json
 * AC-39: "Delete" button opens ConfirmDialog
 * AC-40: Confirming delete removes file and metadata
 * AC-41: "Duplicate" button copies asset with "-copy" suffix
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Copy, Check, FileImage, Folder, Hash, Info, Trash2, Files } from 'lucide-react';
import type { BrandAsset, ColorMetadata } from '../../../shared/types';
import { useSelectedAsset, useSetSelectedAsset, useSetAssetOperationMessage } from '../context/CatalogContext';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { InlineEditText } from './InlineEditText';
import { TagInput } from './TagInput';
import { ConfirmDialog } from './ConfirmDialog';
import { ColorMetadataFields } from './ColorMetadataFields';

// =============================================================================
// Types
// =============================================================================

interface AssetDetailProps {
  /** Callback when panel requests close (optional, for external handling) */
  onClose?: () => void;
  /** Focus field on open (for context menu "Edit Description" / "Edit Tags") */
  focusField?: 'description' | 'tags' | null;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format file size to human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension uppercase.
 */
function formatFileType(format: string): string {
  return format.toUpperCase();
}

// =============================================================================
// Component
// =============================================================================

export function AssetDetail({ onClose, focusField }: AssetDetailProps): React.ReactElement | null {
  const asset = useSelectedAsset();
  const setSelectedAsset = useSetSelectedAsset();
  const setOperationMessage = useSetAssetOperationMessage();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle close action
  const handleClose = useCallback(() => {
    setSelectedAsset(null);
    onClose?.();
  }, [setSelectedAsset, onClose]);

  // Handle Escape key (AC-21) — only when not in inline edit or dialog
  useEffect(() => {
    if (!asset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't close panel if user is in an input/textarea or dialog is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (showDeleteDialog) return;

      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [asset, handleClose, showDeleteDialog]);

  // Focus management - focus panel when opened
  useEffect(() => {
    if (asset && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [asset]);

  // Listen for operation results from extension host
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'asset-operation-success') {
        if (message.operation === 'delete') {
          setOperationMessage({ text: 'Asset deleted', type: 'success' });
          setSelectedAsset(null); // Close panel after delete (AC-40)
        } else if (message.operation === 'duplicate') {
          setOperationMessage({ text: 'Asset duplicated', type: 'success' });
        } else if (message.operation === 'update') {
          // Silent — immediate save, no toast needed for edits
        }
      }

      if (message.type === 'asset-operation-error') {
        setOperationMessage({
          text: message.message || `Failed to ${message.operation} asset`,
          type: 'error',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setOperationMessage, setSelectedAsset]);

  // Handle copy path (AC-20)
  const handleCopyPath = useCallback(async () => {
    if (!asset) return;

    try {
      await navigator.clipboard.writeText(asset.relativePath);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Clipboard API may fail in some webview contexts
      console.error('Failed to copy to clipboard');
    }
  }, [asset]);

  // cv-4-5 AC-38: Save metadata changes immediately
  const handleUpdateField = useCallback(
    (field: 'name' | 'description' | 'tags', value: string | string[]) => {
      if (!asset) return;
      getVSCodeApi().postMessage({
        type: 'update-brand-asset',
        id: asset.id,
        updates: { [field]: value },
      });
    },
    [asset],
  );

  // cv-4-5 AC-39: Delete asset
  const handleDelete = useCallback(() => {
    if (!asset) return;
    getVSCodeApi().postMessage({
      type: 'delete-brand-asset',
      id: asset.id,
    });
    setShowDeleteDialog(false);
  }, [asset]);

  // cv-4-5 AC-41: Duplicate asset
  const handleDuplicate = useCallback(() => {
    if (!asset) return;
    getVSCodeApi().postMessage({
      type: 'duplicate-brand-asset',
      id: asset.id,
    });
  }, [asset]);

  // v3-4-2: Debounce timer ref for color metadata updates
  const colorMetadataDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // v3-4-2 AC-5 to AC-10: Handle color metadata changes with debounce
  const handleColorMetadataChange = useCallback(
    (updates: Partial<ColorMetadata>) => {
      if (!asset) return;

      // Clear any pending debounced update
      if (colorMetadataDebounceRef.current) {
        clearTimeout(colorMetadataDebounceRef.current);
      }

      // Debounce rapid changes (300ms) - AC-8.3
      colorMetadataDebounceRef.current = setTimeout(() => {
        getVSCodeApi().postMessage({
          type: 'update-color-metadata',
          assetId: asset.id,
          metadata: updates,
        });
      }, 300);
    },
    [asset],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (colorMetadataDebounceRef.current) {
        clearTimeout(colorMetadataDebounceRef.current);
      }
    };
  }, []);

  // Don't render if no asset selected
  if (!asset) {
    return null;
  }

  return (
    <aside
      ref={panelRef}
      className="asset-detail"
      role="complementary"
      aria-label="Asset details"
    >
      {/* Header with close button (AC-21) */}
      <div className="asset-detail__header">
        <button
          ref={closeButtonRef}
          type="button"
          className="asset-detail__close"
          onClick={handleClose}
          aria-label="Close asset details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Full-size preview (AC-18) */}
      <div className="asset-detail__preview">
        {asset.webviewUri ? (
          <img
            src={asset.webviewUri}
            alt={asset.name}
            className="asset-detail__image"
          />
        ) : (
          <div className="asset-detail__placeholder">
            <FileImage size={48} />
          </div>
        )}
      </div>

      {/* Metadata section (AC-19, AC-35, AC-36, AC-37) */}
      <div className="asset-detail__content">
        {/* Name — inline editable (AC-35) */}
        <InlineEditText
          value={asset.name}
          onSave={(newName) => handleUpdateField('name', newName)}
          placeholder="Enter name"
          className="asset-detail__name"
          as="h2"
          ariaLabel="Asset name"
        />

        {/* Description — inline editable (AC-36) */}
        <InlineEditText
          value={asset.description}
          onSave={(newDesc) => handleUpdateField('description', newDesc)}
          placeholder="Add description"
          className="asset-detail__description"
          as="p"
          ariaLabel="Asset description"
          multiline
        />

        {/* Tags — chip input (AC-37) */}
        <div className="asset-detail__tags-edit">
          <span className="asset-detail__tags-label">Tags</span>
          <TagInput
            tags={asset.tags}
            onChange={(newTags) => handleUpdateField('tags', newTags)}
            ariaLabel="Asset tags"
          />
        </div>

        {/* File info table (AC-19) */}
        <div className="asset-detail__info">
          <div className="asset-detail__info-row">
            <span className="asset-detail__info-label">
              <Hash size={12} />
              Type
            </span>
            <span className="asset-detail__info-value">{asset.type}</span>
          </div>
          <div className="asset-detail__info-row">
            <span className="asset-detail__info-label">
              <Info size={12} />
              Format
            </span>
            <span className="asset-detail__info-value">{formatFileType(asset.format)}</span>
          </div>
          {asset.dimensions && (
            <div className="asset-detail__info-row">
              <span className="asset-detail__info-label">
                <FileImage size={12} />
                Dimensions
              </span>
              <span className="asset-detail__info-value">
                {asset.dimensions.width} x {asset.dimensions.height}
              </span>
            </div>
          )}
          <div className="asset-detail__info-row">
            <span className="asset-detail__info-label">
              <Info size={12} />
              Size
            </span>
            <span className="asset-detail__info-value">{formatFileSize(asset.fileSize)}</span>
          </div>
          <div className="asset-detail__info-row">
            <span className="asset-detail__info-label">
              <Folder size={12} />
              Path
            </span>
            <span className="asset-detail__info-value asset-detail__info-value--path">
              {asset.relativePath}
            </span>
          </div>
        </div>

        {/* v3-4-1, v3-4-2: Color metadata section - editable dropdowns/toggles */}
        {asset.colorMetadata && (
          <ColorMetadataFields
            metadata={asset.colorMetadata}
            onChange={handleColorMetadataChange}
          />
        )}

        {/* Copy Path button (AC-20) */}
        <button
          type="button"
          className="asset-detail__copy-btn"
          onClick={handleCopyPath}
          disabled={copyFeedback}
        >
          {copyFeedback ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Path
            </>
          )}
        </button>

        {/* Action buttons: Duplicate and Delete (AC-39, AC-41) */}
        <div className="asset-detail__actions">
          <button
            type="button"
            className="asset-detail__action-btn"
            onClick={handleDuplicate}
            aria-label="Duplicate asset"
          >
            <Files size={14} />
            Duplicate
          </button>
          <button
            type="button"
            className="asset-detail__action-btn asset-detail__action-btn--destructive"
            onClick={() => setShowDeleteDialog(true)}
            aria-label="Delete asset"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog (AC-39) */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete '${asset.name}'?`}
        description="This cannot be undone. The file will be moved to trash."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </aside>
  );
}

export default AssetDetail;
