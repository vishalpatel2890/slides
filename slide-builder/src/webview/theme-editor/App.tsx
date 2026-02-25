/**
 * ThemeEditorApp - Root component for the Theme Editor webview.
 *
 * Story Reference: bt-2-1 Task 4.2 — Placeholder UI with ready handshake
 * Story Reference: bt-2-2 Task 11 — AC-1, AC-2, AC-7 (Context + Layout integration)
 * Story Reference: bt-2-4 Task 4 — AC-2, AC-8, AC-9 (External change conflict dialog)
 *
 * AC-4: Sends theme-editor-ready on mount
 * AC-1: Receives theme-editor-data from extension host, dispatches THEME_LOADED
 * AC-2: Renders ThemeEditorLayout with 6 collapsible sections
 * AC-7: ThemeEditorProvider wraps the app with context
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getVSCodeApi } from '../shared/hooks/useVSCodeApi';
import { ThemeEditorProvider, useThemeEditor } from './context/ThemeEditorContext';
import { ThemeEditorLayout } from './components/ThemeEditorLayout';
import { ConflictDialog } from './components/ConflictDialog';
import type { ThemeEditorExtensionMessage } from '../../shared/types';
import type { ThemeJson } from '../../shared/types';

// =============================================================================
// Inner component that uses context
// =============================================================================

function ThemeEditorInner(): React.JSX.Element {
  const { state, dispatch } = useThemeEditor();

  // bt-2-4 Task 4.2: Store external theme for conflict dialog
  const [externalTheme, setExternalTheme] = useState<ThemeJson | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  useEffect(() => {
    // AC-4: Send theme-editor-ready message on mount
    const vscodeApi = getVSCodeApi();
    vscodeApi.postMessage({ type: 'theme-editor-ready' });

    // bt-2-2 Task 11.2: Listen for messages from extension host
    function handleMessage(event: MessageEvent<ThemeEditorExtensionMessage>) {
      const message = event.data;

      if (message.type === 'theme-editor-data') {
        // bt-2-2 Task 11.3: Dispatch THEME_LOADED action
        dispatch({
          type: 'THEME_LOADED',
          theme: message.theme,
          exists: message.exists,
        });
      }

      // bt-2-3 Task 6.1: Listen for save-result from extension host
      if (message.type === 'theme-editor-save-result') {
        // bt-2-3 Task 6.2/6.3: Dispatch SAVE_COMPLETE with success/failure
        dispatch({
          type: 'SAVE_COMPLETE',
          success: message.success,
        });
      }

      // bt-2-4 Task 4.1: Listen for external change notification (AC-2)
      if (message.type === 'theme-editor-external-change') {
        setExternalTheme(message.theme);
        setShowConflictDialog(true);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [dispatch]);

  // bt-2-3 Task 5.1: Watch isDirty and send theme-editor-dirty message to extension host
  useEffect(() => {
    const vscodeApi = getVSCodeApi();
    vscodeApi.postMessage({
      type: 'theme-editor-dirty',
      isDirty: state.isDirty,
    });
  }, [state.isDirty]);

  // bt-2-4 Task 4.4: Reload handler — dispatch EXTERNAL_CHANGE (AC-8)
  const handleReload = useCallback(() => {
    if (externalTheme) {
      dispatch({ type: 'EXTERNAL_CHANGE', theme: externalTheme });
    }
    setShowConflictDialog(false);
    setExternalTheme(null);
  }, [externalTheme, dispatch]);

  // bt-2-4 Task 4.5: Keep handler — dismiss dialog without state change (AC-9)
  const handleKeep = useCallback(() => {
    setShowConflictDialog(false);
    setExternalTheme(null);
  }, []);

  // bt-2-2 Task 11.4: Render ThemeEditorLayout instead of placeholder
  return (
    <>
      <ThemeEditorLayout />
      {showConflictDialog && (
        <ConflictDialog onReload={handleReload} onKeep={handleKeep} />
      )}
    </>
  );
}

// =============================================================================
// Root component with Provider
// =============================================================================

/**
 * bt-2-2 Task 11.1: Wrap with ThemeEditorProvider.
 */
export function ThemeEditorApp(): React.JSX.Element {
  return (
    <ThemeEditorProvider>
      <ThemeEditorInner />
    </ThemeEditorProvider>
  );
}
