/**
 * SaveBar - Persistent save/revert bar for the Theme Editor.
 *
 * Story Reference: bt-2-3 Task 1 — AC-1, AC-2, AC-3, AC-5, AC-7
 * Story Reference: bt-2-4 Task 7 — AC-6 (AI Theme Edit button)
 * Renders Save and Revert buttons that respond to dirty/saving state.
 * Save: disabled when !isDirty or saving, shows spinner during save.
 * Revert: disabled when !isDirty or saving.
 * AI Theme Edit: launches /sb-brand:theme-edit via Claude Code (AC-6).
 * Positioned as sticky bar at top of editor layout.
 */

import React, { useCallback } from 'react';
import { Save, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';

// =============================================================================
// Component
// =============================================================================

export function SaveBar(): React.JSX.Element {
  const { state, dispatch } = useThemeEditor();
  const { isDirty, saving } = state;

  // bt-2-3 Task 1.4: Save click handler
  const handleSave = useCallback(() => {
    if (!isDirty || saving || !state.theme) return;

    // Dispatch SAVE_START to show spinner
    dispatch({ type: 'SAVE_START' });

    // Send full theme to extension host for writing to disk
    const vscodeApi = getVSCodeApi();
    vscodeApi.postMessage({
      type: 'theme-editor-save',
      theme: state.theme,
    });
  }, [isDirty, saving, state.theme, dispatch]);

  // bt-2-3 Task 1.5: Revert click handler
  const handleRevert = useCallback(() => {
    if (!isDirty || saving) return;
    dispatch({ type: 'REVERT' });
  }, [isDirty, saving, dispatch]);

  // bt-2-4 Task 7.2: AI Theme Edit click handler (AC-6)
  const handleAIThemeEdit = useCallback(() => {
    const vscodeApi = getVSCodeApi();
    vscodeApi.postMessage({ type: 'theme-editor-launch-edit' });
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 mb-3"
      style={{
        background: 'var(--vscode-editorWidget-background, #252526)',
        borderBottom: '1px solid var(--vscode-panel-border, #333333)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* bt-2-3 Task 1.2: Save button */}
      <button
        type="button"
        disabled={!isDirty || saving}
        onClick={handleSave}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-opacity"
        style={{
          background: isDirty && !saving
            ? 'var(--vscode-button-background, #0e639c)'
            : 'var(--vscode-button-secondaryBackground, #3a3d41)',
          color: isDirty && !saving
            ? 'var(--vscode-button-foreground, #ffffff)'
            : 'var(--vscode-disabledForeground, #cccccc80)',
          cursor: isDirty && !saving ? 'pointer' : 'default',
          opacity: isDirty && !saving ? 1 : 0.5,
          border: 'none',
        }}
        aria-label={saving ? 'Saving...' : 'Save theme'}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* bt-2-3 Task 1.3: Revert button */}
      <button
        type="button"
        disabled={!isDirty || saving}
        onClick={handleRevert}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-opacity"
        style={{
          background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
          color: isDirty && !saving
            ? 'var(--vscode-button-secondaryForeground, #cccccc)'
            : 'var(--vscode-disabledForeground, #cccccc80)',
          cursor: isDirty && !saving ? 'pointer' : 'default',
          opacity: isDirty && !saving ? 1 : 0.5,
          border: 'none',
        }}
        aria-label="Revert changes"
      >
        <RotateCcw size={14} />
        Revert
      </button>

      {/* Dirty state indicator text */}
      {isDirty && !saving && (
        <span
          className="text-xs ml-2 opacity-70"
          style={{ color: 'var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)' }}
        >
          Unsaved changes
        </span>
      )}

      {/* Spacer to push AI button to the right */}
      <div className="flex-1" />

      {/* bt-2-4 Task 7.1/7.2: AI Theme Edit button (AC-6) */}
      <button
        type="button"
        onClick={handleAIThemeEdit}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-opacity"
        style={{
          background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
          color: 'var(--vscode-button-secondaryForeground, #cccccc)',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="AI Theme Edit"
      >
        <Sparkles size={14} />
        AI Theme Edit
      </button>
    </div>
  );
}
