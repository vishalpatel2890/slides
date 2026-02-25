/**
 * MetadataSection - Displays theme metadata as read-only labels.
 *
 * Story Reference: bt-2-2 Task 3 — AC-4 (FR31 Metadata Display)
 * Displays: theme name, version, generated date, extraction sources, brand description.
 * All fields are read-only in this story. Theme name editing deferred to story 2.3.
 */

import React, { useCallback } from 'react';
import type { ThemeJson } from '../../../shared/types';
import { useThemeEditor, useFieldDirty } from '../context/ThemeEditorContext';

// =============================================================================
// Props
// =============================================================================

interface MetadataSectionProps {
  theme: ThemeJson;
}

// =============================================================================
// Helper: Read-only label row
// =============================================================================

function ReadOnlyField({ label, value }: { label: string; value: string | undefined | null }): React.JSX.Element | null {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col mb-3">
      <span
        className="text-xs font-medium mb-1 opacity-60"
        style={{ color: 'var(--vscode-editor-foreground)' }}
      >
        {label}
      </span>
      <span
        className="text-sm px-2 py-1 rounded"
        style={{
          color: 'var(--vscode-editor-foreground)',
          background: 'var(--vscode-input-background, #3c3c3c)',
          border: '1px solid var(--vscode-input-border, #555555)',
          opacity: 0.8,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * bt-2-2 Task 3.1-3.7: MetadataSection component.
 *
 * AC-4: Displays version, generated date, extraction sources as read-only labels.
 * Theme name displayed as text label (editing in story 2.3).
 * Handles missing metadata fields gracefully.
 */
export function MetadataSection({ theme }: MetadataSectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();
  const meta = theme.meta;
  const extractedFrom = meta?.extractedFrom;
  const nameIsDirty = useFieldDirty('name');

  // bt-2-3 Task 7.2: Handle theme name change
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'UPDATE_VALUE', path: 'name', value: e.target.value });
    },
    [dispatch],
  );

  return (
    <div>
      {/* bt-2-3 Task 7.1: Theme name as editable text input (FR32) */}
      <div className="flex flex-col mb-3">
        <span
          className="text-xs font-medium mb-1 opacity-60"
          style={{ color: 'var(--vscode-editor-foreground)' }}
        >
          Theme Name
        </span>
        <input
          type="text"
          className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
          style={{
            color: 'var(--vscode-input-foreground, #cccccc)',
            background: 'var(--vscode-input-background, #3c3c3c)',
            border: nameIsDirty
              ? '1px solid var(--vscode-input-border, #555555)'
              : '1px solid var(--vscode-input-border, #555555)',
            borderLeft: nameIsDirty
              ? '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)'
              : '1px solid var(--vscode-input-border, #555555)',
          }}
          value={theme.name || ''}
          onChange={handleNameChange}
          aria-label="Theme name"
        />
      </div>

      {/* bt-2-2 Task 3.3: Version as read-only label */}
      <ReadOnlyField label="Version" value={theme.version} />

      {/* bt-2-2 Task 3.4: Generated date from meta */}
      {extractedFrom && typeof extractedFrom === 'object' && (
        <ReadOnlyField
          label="Generated Date"
          value={extractedFrom.date || extractedFrom.generatedAt || undefined}
        />
      )}

      {/* bt-2-2 Task 3.5: Extraction sources list */}
      {extractedFrom && typeof extractedFrom === 'object' && (
        <div className="mb-3">
          <span
            className="text-xs font-medium mb-1 opacity-60 block"
            style={{ color: 'var(--vscode-editor-foreground)' }}
          >
            Extraction Sources
          </span>
          <div className="space-y-1">
            {Object.entries(extractedFrom)
              .filter(([key]) => key !== 'date' && key !== 'generatedAt')
              .map(([key, value]) => (
                <div
                  key={key}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: 'var(--vscode-editor-foreground)',
                    background: 'var(--vscode-input-background, #3c3c3c)',
                    border: '1px solid var(--vscode-input-border, #555555)',
                    opacity: 0.8,
                  }}
                >
                  <span className="opacity-60">{key}:</span> {String(value)}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* bt-2-2 Task 3.6: Brand description if present */}
      {meta?.brandDescription && (
        <div className="mb-3">
          <span
            className="text-xs font-medium mb-1 opacity-60 block"
            style={{ color: 'var(--vscode-editor-foreground)' }}
          >
            Brand Description
          </span>
          <p
            className="text-sm px-2 py-1 rounded"
            style={{
              color: 'var(--vscode-editor-foreground)',
              background: 'var(--vscode-input-background, #3c3c3c)',
              border: '1px solid var(--vscode-input-border, #555555)',
              opacity: 0.8,
            }}
          >
            {meta.brandDescription}
          </p>
        </div>
      )}

      {/* bt-2-2 Task 3.7: Confidence if present */}
      {meta?.confidence !== undefined && (
        <ReadOnlyField label="Confidence" value={`${Math.round(meta.confidence * 100)}%`} />
      )}
    </div>
  );
}
