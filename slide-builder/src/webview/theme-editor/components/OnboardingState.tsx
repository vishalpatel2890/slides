/**
 * OnboardingState - Empty state UI when no theme.json exists.
 *
 * Story Reference: bt-2-4 Task 5 — AC-4, AC-5
 * Displays when `exists === false` after THEME_LOADED:
 * - Empty state illustration (Palette icon from lucide-react)
 * - "No brand theme found" heading
 * - Descriptive text explaining what to do
 * - "Set Up Brand" CTA button that sends theme-editor-launch-setup message
 *
 * Styled with VS Code CSS variables. Centered vertically and horizontally.
 */

import React, { useCallback } from 'react';
import { Palette } from 'lucide-react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';

export function OnboardingState(): React.JSX.Element {
  // bt-2-4 Task 5.2: Send theme-editor-launch-setup on CTA click (AC-5)
  const handleSetUpBrand = useCallback(() => {
    const vscodeApi = getVSCodeApi();
    vscodeApi.postMessage({ type: 'theme-editor-launch-setup' });
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8"
      style={{ color: 'var(--vscode-editor-foreground, #cccccc)' }}
    >
      {/* bt-2-4 Task 5.1/5.3: Empty state icon */}
      <div
        className="mb-6 opacity-40"
      >
        <Palette size={64} strokeWidth={1} />
      </div>

      {/* bt-2-4 Task 5.1: Heading */}
      <h2 className="text-xl font-bold mb-2">
        No brand theme found
      </h2>

      {/* bt-2-4 Task 5.1: Descriptive text */}
      <p className="text-sm opacity-70 mb-6 text-center max-w-sm leading-relaxed">
        Set up your brand to create a theme. The brand setup workflow will guide you through
        configuring colors, typography, and other visual properties for your slide decks.
      </p>

      {/* bt-2-4 Task 5.1/5.2: Set Up Brand CTA (AC-5) */}
      <button
        type="button"
        onClick={handleSetUpBrand}
        className="flex items-center gap-2 px-5 py-2 rounded text-sm font-medium"
        style={{
          background: 'var(--vscode-button-background, #0e639c)',
          color: 'var(--vscode-button-foreground, #ffffff)',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Set Up Brand"
      >
        <Palette size={16} />
        Set Up Brand
      </button>
    </div>
  );
}
