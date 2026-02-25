/**
 * Theme Editor webview entry point.
 * Mounts the React app into the #root element.
 *
 * Story Reference: bt-2-1 Task 4.1 — React root mount (follows catalog/index.tsx pattern)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeEditorApp } from './App';
// CSS is built separately by Tailwind CLI plugin in esbuild.mjs

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ThemeEditorApp />);
}
