/**
 * BrandSection - Persistent brand management section in the Catalog sidebar.
 *
 * Story Reference: bt-1-1 AC-1, AC-2 — Conditional rendering based on theme existence
 * Story Reference: bt-1-2 AC-4, AC-5, AC-7, AC-10 — Brand setup modal with folder picker
 * Architecture Reference: ADR-BRAND-1 — Persistent section (not a tab)
 * Architecture Reference: Pattern 9 — Catalog Sidebar Brand Section
 *
 * AC-1: No theme → "Set Up Brand" button visible; "Open Theme Editor" / "AI Theme Edit" hidden
 * AC-2: Theme exists → "Open Theme Editor" / "AI Theme Edit" visible; "Set Up Brand" hidden
 * AC-4: Clicking "Set Up Brand" opens brand setup modal form
 * AC-7: Form submission sends structured data via submit-operation-form
 * AC-9: "AI Theme Edit" dispatches /sb-brand:theme-edit via sendToClaudeCode()
 * AC-10: Modal dismiss (Escape, outside click) resets form
 * AC-stub: "Open Theme Editor" shows stub info message
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Palette, Wand2, Brush } from 'lucide-react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { useHasTheme } from '../context/CatalogContext';
import { OperationModal } from './OperationModal';
import { useOperationForms } from '../hooks/useOperationForms';

export function BrandSection(): React.ReactElement {
  const hasTheme = useHasTheme();

  // bt-1-2: Brand setup modal state
  const [brandSetupModalOpen, setBrandSetupModalOpen] = useState(false);
  const { getConfig } = useOperationForms();
  const brandSetupConfig = getConfig('brand-setup');

  // bt-1-2 AC-4: Listen for open-brand-setup message from extension host (Command Palette trigger)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'open-brand-setup') {
        setBrandSetupModalOpen(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSetupBrand = useCallback(() => {
    // bt-1-2 AC-4: Open the brand setup modal form
    setBrandSetupModalOpen(true);
  }, []);

  // bt-1-2 AC-7: Handle brand setup form submission
  const handleBrandSetupSubmit = useCallback((data: Record<string, unknown>) => {
    const api = getVSCodeApi();
    api.postMessage({
      type: 'submit-operation-form',
      operation: 'sb-brand:setup',
      data,
    });
  }, []);

  const handleOpenThemeEditor = useCallback(() => {
    // bt-1-1 AC-stub: Send open-theme-editor message to extension host
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-theme-editor' });
  }, []);

  const handleAiThemeEdit = useCallback(() => {
    // bt-1-1 AC-9: Send launch-ai-theme-edit message to extension host
    const api = getVSCodeApi();
    api.postMessage({ type: 'launch-ai-theme-edit' });
  }, []);

  return (
    <section className="brand-section" aria-label="Brand Management">
      <div className="brand-section__header">
        <Palette size={14} className="brand-section__icon" />
        <span className="brand-section__title">Brand</span>
      </div>
      <div className="brand-section__actions">
        {!hasTheme ? (
          /* AC-1: No theme state — show "Set Up Brand" */
          <button
            type="button"
            className="brand-section__btn brand-section__btn--primary"
            onClick={handleSetupBrand}
            aria-label="Set Up Brand"
          >
            <Palette size={14} />
            <span>Set Up Brand</span>
          </button>
        ) : (
          /* AC-2: Theme exists — show "Open Theme Editor" and "AI Theme Edit" */
          <>
            <button
              type="button"
              className="brand-section__btn"
              onClick={handleOpenThemeEditor}
              aria-label="Open Theme Editor"
            >
              <Brush size={14} />
              <span>Open Theme Editor</span>
            </button>
            <button
              type="button"
              className="brand-section__btn"
              onClick={handleAiThemeEdit}
              aria-label="AI Theme Edit"
            >
              <Wand2 size={14} />
              <span>AI Theme Edit</span>
            </button>
          </>
        )}
      </div>
      {/* bt-1-2: Brand setup modal form */}
      {brandSetupConfig && (
        <OperationModal
          open={brandSetupModalOpen}
          onOpenChange={setBrandSetupModalOpen}
          config={brandSetupConfig}
          onSubmit={handleBrandSetupSubmit}
        />
      )}
    </section>
  );
}
