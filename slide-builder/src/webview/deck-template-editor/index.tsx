/**
 * Webview Entry Point - Deck Template Editor
 *
 * Story Reference: tm-2-1 — Standalone DeckTemplateDetail panel
 *
 * Renders DeckTemplateDetail in a full-size VS Code WebviewPanel.
 * Receives initial config via window.__INITIAL_STATE__ or deck-template-config
 * postMessage from the extension host.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { DeckTemplateDetail } from '../catalog/components/DeckTemplateDetail';
import type { DeckTemplateConfig } from '../../shared/types';

// =============================================================================
// VS Code API Singleton
// =============================================================================

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscodeApi = acquireVsCodeApi();

// =============================================================================
// App Component
// =============================================================================

interface InitialState {
  templateId: string;
  config: DeckTemplateConfig;
}

declare global {
  interface Window {
    __INITIAL_STATE__?: InitialState;
  }
}

function App(): React.ReactElement | null {
  const initial = window.__INITIAL_STATE__;
  const [templateId, setTemplateId] = useState<string | null>(initial?.templateId ?? null);
  const [config, setConfig] = useState<DeckTemplateConfig | null>(initial?.config ?? null);

  // Bug fix (Bug 1 — deck opening inconsistency):
  // Signal the extension host that the React SPA has mounted and is ready to receive
  // messages. DeckTemplateEditorPanel holds the pending deck-template-config payload
  // and flushes it only after receiving this 'ready' signal — preventing the race
  // condition where postMessage fired before window.addEventListener was registered.
  useEffect(() => {
    vscodeApi.postMessage({ type: 'ready' });
  }, []);

  // Listen for deck-template-config and deck-template-deleted messages from extension host
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (message.type === 'deck-template-config') {
        setTemplateId(message.templateId);
        setConfig(message.config);
      }
      // tm-2-3: Handle deck-template-deleted — close the panel after successful deletion
      if (message.type === 'deck-template-deleted' && message.success) {
        vscodeApi.postMessage({ type: 'close-deck-template-editor' });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Close handler: post close message to extension host
  const handleClose = useCallback(() => {
    vscodeApi.postMessage({ type: 'close-deck-template-editor' });
  }, []);

  // tm-2-2: Preview slide handler — sends preview-deck-template-slide message to extension host
  const handlePreviewSlide = useCallback((tid: string, slideFile: string) => {
    vscodeApi.postMessage({ type: 'preview-deck-template-slide', templateId: tid, slideFile });
  }, []);

  // tm-2-3: Delete template handler — sends delete-deck-template message to extension host
  const handleDeleteTemplate = useCallback((tid: string) => {
    vscodeApi.postMessage({ type: 'delete-deck-template', templateId: tid });
  }, []);

  // tm-3-4: Edit slide handler — sends submit-operation-form message to extension host (AC-2, AC-4)
  const handleEditSlide = useCallback((tid: string, slideFile: string, changes: string) => {
    vscodeApi.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:edit-deck-template',
      data: { templateId: tid, slideFile, changes },
    });
  }, []);

  if (!config || !templateId) {
    return (
      <div className="deck-template-editor-loading">
        <span>Loading template...</span>
      </div>
    );
  }

  return (
    <div className="deck-template-editor-root">
      <DeckTemplateDetail
        config={config}
        templateId={templateId}
        onClose={handleClose}
        onPreviewSlide={handlePreviewSlide}
        onDeleteTemplate={handleDeleteTemplate}
        onEditSlide={handleEditSlide}
      />
    </div>
  );
}

// =============================================================================
// Mount React App
// =============================================================================

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
