/**
 * ThemeEditorLayout - Main layout component rendering 6 collapsible sections.
 *
 * Story Reference: bt-2-2 Task 9 — AC-2 (Section Organization)
 * Story Reference: bt-2-4 Task 6 — AC-4, AC-10 (OnboardingState integration)
 * Story Reference: bt-2-4 Task 7 — AC-6 (AI Theme Edit button)
 * Consumes ThemeEditorContext to get theme data and expanded sections.
 * Renders SectionHeader + section component pairs for all 6 sections.
 * Renders OnboardingState when exists === false (AC-4).
 * Conditionally hides sections where theme data is missing (AC-8).
 * Shows loading state while theme data is null.
 */

import React, { useCallback } from 'react';
import { ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { SectionHeader } from './SectionHeader';
import { MetadataSection } from './MetadataSection';
import { ColorsSection } from './ColorsSection';
import { TypographySection } from './TypographySection';
import { ShapesSection } from './ShapesSection';
import { ComponentsSection } from './ComponentsSection';
import { RhythmSection } from './RhythmSection';
import { BrandContextSection } from './BrandContextSection';
import { SaveBar } from './SaveBar';
import { OnboardingState } from './OnboardingState';

// =============================================================================
// Component
// =============================================================================

export function ThemeEditorLayout(): React.JSX.Element {
  const { state, dispatch } = useThemeEditor();
  const { theme, exists, loaded, expandedSections } = state;

  // bt-2-2 Task 9.3: Section toggle handler
  const handleToggle = useCallback(
    (sectionKey: string) => {
      dispatch({ type: 'TOGGLE_SECTION', section: sectionKey });
    },
    [dispatch],
  );

  // bt-4-1 Task 3.3: Expand All / Collapse All handlers
  const handleExpandAll = useCallback(() => {
    dispatch({ type: 'EXPAND_ALL' });
  }, [dispatch]);

  const handleCollapseAll = useCallback(() => {
    dispatch({ type: 'COLLAPSE_ALL' });
  }, [dispatch]);

  // bt-2-2 Task 9.5: Loading state — haven't received THEME_LOADED yet
  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div
          className="text-base opacity-70"
          style={{ color: 'var(--vscode-editor-foreground)' }}
        >
          Loading theme...
        </div>
      </div>
    );
  }

  // bt-2-4 Task 6.1: Render OnboardingState when exists === false (AC-4, AC-10)
  // No sections or SaveBar visible in onboarding state.
  // When exists transitions from false to true (file watcher detects new theme.json),
  // React re-render automatically switches from OnboardingState to full editor (Task 6.2).
  if (!exists || theme === null) {
    return <OnboardingState />;
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* bt-2-3 Task 8.1-8.3: SaveBar at top, sticky, hidden when exists === false */}
      {exists && <SaveBar />}

      <div className="p-4">
      {/* bt-4-1 Task 3.1: Header with Expand All / Collapse All buttons */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-lg font-bold"
          style={{ color: 'var(--vscode-editor-foreground)' }}
        >
          Theme Editor
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExpandAll}
            title="Expand All"
            aria-label="Expand All"
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
              color: 'var(--vscode-button-secondaryForeground, #cccccc)',
              border: '1px solid var(--vscode-button-border, transparent)',
              cursor: 'pointer',
            }}
          >
            <ChevronsUpDown size={16} />
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            title="Collapse All"
            aria-label="Collapse All"
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
              color: 'var(--vscode-button-secondaryForeground, #cccccc)',
              border: '1px solid var(--vscode-button-border, transparent)',
              cursor: 'pointer',
            }}
          >
            <ChevronsDownUp size={16} />
          </button>
        </div>
      </div>

      {/* bt-2-2 Task 9.3: Render SectionHeader + section component pairs */}

      {/* Section 1: Metadata (always present — name/version are required) */}
      <SectionHeader
        title="Metadata"
        sectionKey="metadata"
        expanded={expandedSections.has('metadata')}
        onToggle={handleToggle}
      >
        <MetadataSection theme={theme} />
      </SectionHeader>

      {/* bt-4-7 Task 5.2: Section 2: Brand Context (between Metadata and Colors) */}
      <SectionHeader
        title="Brand Context"
        sectionKey="brandContext"
        expanded={expandedSections.has('brandContext')}
        onToggle={handleToggle}
      >
        <BrandContextSection brandContext={theme.brandContext} />
      </SectionHeader>

      {/* Section 3: Colors (required field) */}
      <SectionHeader
        title="Colors"
        sectionKey="colors"
        expanded={expandedSections.has('colors')}
        onToggle={handleToggle}
      >
        <ColorsSection colors={theme.colors} />
      </SectionHeader>

      {/* Section 3: Typography (required field) */}
      <SectionHeader
        title="Typography"
        sectionKey="typography"
        expanded={expandedSections.has('typography')}
        onToggle={handleToggle}
      >
        <TypographySection typography={theme.typography} />
      </SectionHeader>

      {/* Section 4: Shapes (required field) */}
      <SectionHeader
        title="Shapes"
        sectionKey="shapes"
        expanded={expandedSections.has('shapes')}
        onToggle={handleToggle}
      >
        <ShapesSection shapes={theme.shapes} />
      </SectionHeader>

      {/* Section 5: Components (required field) */}
      <SectionHeader
        title="Components"
        sectionKey="components"
        expanded={expandedSections.has('components')}
        onToggle={handleToggle}
      >
        <ComponentsSection components={theme.components} />
      </SectionHeader>

      {/* bt-2-2 Task 9.4: Section 6: Slide Rhythm — hidden if workflowRules is undefined (AC-8) */}
      {theme.workflowRules && (
        <SectionHeader
          title="Slide Rhythm"
          sectionKey="rhythm"
          expanded={expandedSections.has('rhythm')}
          onToggle={handleToggle}
        >
          <RhythmSection workflowRules={theme.workflowRules} />
        </SectionHeader>
      )}
      </div>
    </div>
  );
}
