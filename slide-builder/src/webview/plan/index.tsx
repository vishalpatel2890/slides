/**
 * Webview Entry Point - Plan Editor
 *
 * Story Reference: 18-3 Task 1 - Create React webview entry point
 * Architecture Reference: notes/architecture/architecture.md#Project Structure
 *
 * AC-18.3.1: Custom editor loads React application inside VS Code webview
 * AC-18.3.2: index.tsx acquires VS Code API via acquireVsCodeApi() as singleton
 */

import { createRoot } from 'react-dom/client';
import { App } from './App';
// CSS is built separately by Tailwind CLI and linked in the webview HTML

// =============================================================================
// VS Code API Singleton
// AC-18.3.2: Acquire VS Code API once and store as module-level singleton
// =============================================================================

// The VS Code API is acquired in the useVSCodeApi hook via getVSCodeApi()
// This ensures the API is only acquired once when first needed

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
