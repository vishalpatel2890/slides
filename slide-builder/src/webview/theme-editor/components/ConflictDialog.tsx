/**
 * ConflictDialog - Modal dialog shown when theme.json changes externally while editor has unsaved changes.
 *
 * Story Reference: bt-2-4 Task 4.3 — AC-2, AC-8, AC-9
 * Presents two choices:
 * - "Reload" — accept external changes, lose unsaved edits (AC-8)
 * - "Keep My Changes" — dismiss dialog, retain unsaved edits (AC-9)
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConflictDialogProps {
  onReload: () => void;
  onKeep: () => void;
}

export function ConflictDialog({ onReload, onKeep }: ConflictDialogProps): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        style={{
          background: 'var(--vscode-editorWidget-background, #252526)',
          border: '1px solid var(--vscode-editorWidget-border, #454545)',
          color: 'var(--vscode-editor-foreground, #cccccc)',
        }}
      >
        {/* Icon and title */}
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle
            size={24}
            style={{ color: 'var(--vscode-editorWarning-foreground, #cca700)' }}
          />
          <h2 className="text-base font-semibold" style={{ margin: 0 }}>
            Theme File Changed Externally
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm mb-6 opacity-80 leading-relaxed">
          The theme file has been modified outside this editor. You have unsaved changes that may
          conflict with the external modifications. Would you like to reload the file and lose your
          unsaved changes, or keep your current edits?
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onKeep}
            className="px-4 py-1.5 rounded text-xs font-medium"
            style={{
              background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
              color: 'var(--vscode-button-secondaryForeground, #cccccc)',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Keep my changes"
          >
            Keep My Changes
          </button>
          <button
            type="button"
            onClick={onReload}
            className="px-4 py-1.5 rounded text-xs font-medium"
            style={{
              background: 'var(--vscode-button-background, #0e639c)',
              color: 'var(--vscode-button-foreground, #ffffff)',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Reload theme from disk"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
