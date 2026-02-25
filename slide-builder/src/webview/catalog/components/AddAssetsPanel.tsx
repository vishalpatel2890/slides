/**
 * AddAssetsPanel - Panel for adding new brand assets via path input, file browsing, or drag-drop.
 *
 * Story Reference: cv-4-4 AC-24 through AC-34
 * Architecture Reference: ADR-007 — Brand Asset Metadata in JSON Sidecar
 *
 * AC-24: Clicking "+ Add Assets" opens the AddAssetsPanel
 * AC-25: Text field accepts file/folder paths (comma-separated or one per line)
 * AC-26: "Browse..." button opens VS Code file picker dialog
 * AC-27: Drag-drop zone accepts files dragged into the panel
 * AC-28: Previews of selected files appear before confirmation
 * AC-29: User can set a batch description
 * AC-30: System suggests tags based on filename and asset type
 * AC-31: User selects asset type classification
 * AC-32: Clicking "Add" copies files and updates assets.json
 * AC-33: File watcher detects new assets and grid refreshes
 * AC-34: Confirmation message shown inline
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { X, Upload, FolderOpen, FileImage, Plus, Tag } from 'lucide-react';
import type { BrandAssetType } from '../../../shared/types';
import {
  useShowAddAssetsPanel,
  useToggleAddAssetsPanel,
  useSelectedFilesForAdd,
  useSetFilesForAdd,
  useAppendFilesForAdd,
  useRemoveFileForAdd,
  useSetAssetOperationMessage,
  type FilePreview,
} from '../context/CatalogContext';
import { autoGenerateTags, suggestAssetType } from '../utils/autoGenerateTags';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';

// =============================================================================
// Type Selector Component (AC-31)
// =============================================================================

interface TypeSelectorProps {
  value: BrandAssetType;
  onChange: (type: BrandAssetType) => void;
}

function TypeSelector({ value, onChange }: TypeSelectorProps): React.ReactElement {
  const types: { type: BrandAssetType; label: string }[] = [
    { type: 'icon', label: 'Icon' },
    { type: 'logo', label: 'Logo' },
    { type: 'image', label: 'Image' },
  ];

  return (
    <div className="add-assets-panel__type-selector" role="radiogroup" aria-label="Asset type">
      {types.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          className={`add-assets-panel__type-btn${value === type ? ' add-assets-panel__type-btn--active' : ''}`}
          onClick={() => onChange(type)}
          role="radio"
          aria-checked={value === type}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Tag Chips Component (AC-30)
// =============================================================================

interface TagChipsProps {
  tags: string[];
  onRemove: (tag: string) => void;
  onAdd: (tag: string) => void;
}

function TagChips({ tags, onRemove, onAdd }: TagChipsProps): React.ReactElement {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        onAdd(inputValue.trim().toLowerCase());
        setInputValue('');
      }
    },
    [inputValue, onAdd]
  );

  return (
    <div className="add-assets-panel__tags">
      <div className="add-assets-panel__tags-list">
        {tags.map((tag) => (
          <span key={tag} className="add-assets-panel__tag-chip">
            {tag}
            <button
              type="button"
              className="add-assets-panel__tag-remove"
              onClick={() => onRemove(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="add-assets-panel__tag-input"
          placeholder="Add tag..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Add new tag"
        />
      </div>
    </div>
  );
}

// =============================================================================
// File Preview Grid Component (AC-28)
// =============================================================================

interface FilePreviewGridProps {
  files: FilePreview[];
  onRemove: (path: string) => void;
}

function FilePreviewGrid({ files, onRemove }: FilePreviewGridProps): React.ReactElement | null {
  if (files.length === 0) return null;

  return (
    <div className="add-assets-panel__preview-grid">
      {files.map((file) => (
        <div key={file.path} className="add-assets-panel__preview-item">
          <div className="add-assets-panel__preview-thumbnail">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt={file.name} />
            ) : (
              <FileImage size={24} />
            )}
          </div>
          <p className="add-assets-panel__preview-name" title={file.path}>
            {file.name}
          </p>
          <button
            type="button"
            className="add-assets-panel__preview-remove"
            onClick={() => onRemove(file.path)}
            aria-label={`Remove ${file.name}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main AddAssetsPanel Component
// =============================================================================

export function AddAssetsPanel(): React.ReactElement | null {
  const showPanel = useShowAddAssetsPanel();
  const { hide } = useToggleAddAssetsPanel();
  const selectedFiles = useSelectedFilesForAdd();
  const setSelectedFiles = useSetFilesForAdd();
  const appendFiles = useAppendFilesForAdd();
  const removeFile = useRemoveFileForAdd();
  const setOperationMessage = useSetAssetOperationMessage();

  // Local state
  const [pathInput, setPathInput] = useState('');
  const [assetType, setAssetType] = useState<BrandAssetType>('image');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset state when panel opens
  useEffect(() => {
    if (showPanel) {
      setPathInput('');
      setAssetType('image');
      setDescription('');
      setTags([]);
      setSelectedFiles([]);
      setIsSubmitting(false);
    }
  }, [showPanel, setSelectedFiles]);

  // Parse path input and update selected files (AC-25)
  const handlePathInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setPathInput(value);

      // Parse paths (comma-separated or newline-separated)
      const paths = value
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const files: FilePreview[] = paths.map((path) => ({
        path,
        name: path.split(/[/\\]/).pop() || path,
      }));

      setSelectedFiles(files);

      // Auto-suggest type based on first path (AC-31)
      if (paths.length > 0) {
        const suggested = suggestAssetType(paths[0]);
        if (suggested) {
          setAssetType(suggested);
        }
      }

      // Auto-generate tags from first filename (AC-30)
      if (files.length > 0) {
        const autoTags = autoGenerateTags(files[0].name, assetType);
        setTags(autoTags);
      }
    },
    [setSelectedFiles, assetType]
  );

  // Handle browse button click (AC-26)
  const handleBrowse = useCallback(() => {
    getVSCodeApi().postMessage({ type: 'browse-files', assetType });
  }, [assetType]);

  // Listen for browse-files-result from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'browse-files-result' && Array.isArray(message.paths)) {
        const files: FilePreview[] = message.paths.map((path: string) => ({
          path,
          name: path.split(/[/\\]/).pop() || path,
        }));
        appendFiles(files);
        setPathInput((prev) => {
          const existing = prev.trim();
          const newPaths = message.paths.join('\n');
          return existing ? `${existing}\n${newPaths}` : newPaths;
        });

        // Auto-generate tags
        if (files.length > 0) {
          const autoTags = autoGenerateTags(files[0].name, assetType);
          setTags((prev) => [...new Set([...prev, ...autoTags])]);
        }
      }

      if (message.type === 'asset-operation-success' && message.operation === 'add') {
        setIsSubmitting(false);
        // AC-34: Show success message
        const count = message.count ?? selectedFiles.length;
        setOperationMessage({
          text: `${count} asset${count !== 1 ? 's' : ''} added to ${assetType}s`,
          type: 'success',
        });
        hide();
      }

      if (message.type === 'asset-operation-error') {
        setIsSubmitting(false);
        setOperationMessage({
          text: message.message || 'Failed to add assets',
          type: 'error',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [assetType, hide, appendFiles, setOperationMessage, selectedFiles.length]);

  // Handle drag-drop (AC-27)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // Note: In VS Code webviews, drag-drop may have limitations
      // The dataTransfer.files may be empty due to CSP restrictions
      // Fallback to path input or browse button
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const fileInfos: FilePreview[] = files.map((f) => ({
          path: f.name, // Full path not available in browser drag-drop
          name: f.name,
          previewUrl: URL.createObjectURL(f),
        }));
        appendFiles(fileInfos);
      }
    },
    [appendFiles]
  );

  // Handle tag operations
  const handleAddTag = useCallback((tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }, []);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Handle file removal from preview
  const handleRemoveFile = useCallback(
    (path: string) => {
      removeFile(path);
      setPathInput((prev) =>
        prev
          .split(/[,\n]/)
          .filter((p) => p.trim() !== path)
          .join('\n')
      );
    },
    [removeFile]
  );

  // Handle add button click (AC-32)
  const handleAdd = useCallback(() => {
    if (selectedFiles.length === 0) return;

    setIsSubmitting(true);
    getVSCodeApi().postMessage({
      type: 'add-brand-assets',
      paths: selectedFiles.map((f) => f.path),
      assetType,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  }, [selectedFiles, assetType, description, tags]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    hide();
  }, [hide]);

  // Handle click outside to close (optional)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        hide();
      }
    },
    [hide]
  );

  if (!showPanel) return null;

  return (
    <div className="add-assets-panel__backdrop" onClick={handleBackdropClick}>
      <div
        ref={panelRef}
        className="add-assets-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-assets-title"
      >
        {/* Header */}
        <div className="add-assets-panel__header">
          <h2 id="add-assets-title" className="add-assets-panel__title">
            <Plus size={18} />
            Add Brand Assets
          </h2>
          <button
            type="button"
            className="add-assets-panel__close"
            onClick={handleCancel}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="add-assets-panel__content">
          {/* Asset Type Selector (AC-31) */}
          <div className="add-assets-panel__section">
            <label className="add-assets-panel__label">Asset Type</label>
            <TypeSelector value={assetType} onChange={setAssetType} />
          </div>

          {/* Path Input (AC-25) */}
          <div className="add-assets-panel__section">
            <label htmlFor="path-input" className="add-assets-panel__label">
              File Paths
            </label>
            <div className="add-assets-panel__input-row">
              <textarea
                id="path-input"
                className="add-assets-panel__path-input"
                placeholder="Enter file paths (one per line or comma-separated)..."
                value={pathInput}
                onChange={handlePathInputChange}
                rows={3}
              />
              <button
                type="button"
                className="add-assets-panel__browse-btn"
                onClick={handleBrowse}
                aria-label="Browse for files"
              >
                <FolderOpen size={16} />
                Browse...
              </button>
            </div>
          </div>

          {/* Drag-Drop Zone (AC-27) */}
          <div
            ref={dropZoneRef}
            className={`add-assets-panel__drop-zone${isDragOver ? ' add-assets-panel__drop-zone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="region"
            aria-label="Drag and drop files here"
          >
            <Upload size={24} />
            <p>Drag & drop files here</p>
            <p className="add-assets-panel__drop-hint">or use Browse button above</p>
          </div>

          {/* File Previews (AC-28) */}
          <FilePreviewGrid files={selectedFiles} onRemove={handleRemoveFile} />

          {/* Batch Description (AC-29) */}
          <div className="add-assets-panel__section">
            <label htmlFor="description-input" className="add-assets-panel__label">
              Description (optional)
            </label>
            <input
              id="description-input"
              type="text"
              className="add-assets-panel__description-input"
              placeholder="Description for all assets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tags (AC-30) */}
          <div className="add-assets-panel__section">
            <label className="add-assets-panel__label">
              <Tag size={14} />
              Tags (auto-suggested)
            </label>
            <TagChips tags={tags} onRemove={handleRemoveTag} onAdd={handleAddTag} />
          </div>
        </div>

        {/* Footer */}
        <div className="add-assets-panel__footer">
          <button
            type="button"
            className="add-assets-panel__cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="add-assets-panel__add-btn"
            onClick={handleAdd}
            disabled={selectedFiles.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : `Add ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
