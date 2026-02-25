import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ViewerProvider } from './context/ViewerContext';
import { sendV2Ready } from './hooks/useVsCodeApi';

/**
 * V2 Viewer webview entry point.
 * Wraps App in ViewerProvider and sends v2-ready message on mount.
 *
 * Story Reference: v2-1-1 AC-6 - React app sends v2-ready message on mount
 */
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ViewerProvider>
      <App />
    </ViewerProvider>
  );

  // AC-6: Send v2-ready message to extension host on mount
  sendV2Ready();
}
