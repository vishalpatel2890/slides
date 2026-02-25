/**
 * TypographySection - Renders typography properties with visual font preview editors.
 *
 * Story Reference: bt-3-2 Task 4 -- AC-11 through AC-16
 * Upgraded from basic DirtyTextInput/DirtyNumberInput to purpose-built visual editors:
 * - FontFamilyEditor for font family properties (heading, body, mono)
 * - FontWeightEditor for weight properties
 * - TypeScaleEditor for typographic scale entries
 *
 * Preserves: SectionHeader collapsible behavior, PropertyGroup sub-groups,
 * existing lineHeight section (basic inputs), UPDATE_VALUE dispatch mechanism.
 */

import React, { useCallback, useMemo } from 'react';
import type { ThemeTypography } from '../../../shared/types';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { DirtyNumberInput, PropertyGroup } from './PropertyInput';
import { FontFamilyEditor } from './FontFamilyEditor';
import { FontWeightEditor } from './FontWeightEditor';
import { TypeScaleEditor } from './TypeScaleEditor';
import type { TypeScaleEntry } from './TypeScaleEditor';

// =============================================================================
// Props
// =============================================================================

interface TypographySectionProps {
  typography: ThemeTypography;
}

// =============================================================================
// Component
// =============================================================================

export function TypographySection({ typography }: TypographySectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();

  const handleTextUpdate = useCallback(
    (path: string, value: string) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  const handleNumberUpdate = useCallback(
    (path: string, value: number) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  // Build scale entries array for TypeScaleEditor
  const scaleEntries: TypeScaleEntry[] = useMemo(
    () =>
      Object.entries(typography.scale).map(([key, value]) => ({
        key,
        value,
        path: `typography.scale.${key}`,
      })),
    [typography.scale],
  );

  return (
    <div data-testid="typography-section">
      {/* bt-3-2 Task 4.2: Font family properties with live preview */}
      <PropertyGroup title="Fonts">
        <FontFamilyEditor
          label="Heading"
          value={typography.fonts.heading}
          path="typography.fonts.heading"
          onUpdate={handleTextUpdate}
        />
        <FontFamilyEditor
          label="Body"
          value={typography.fonts.body}
          path="typography.fonts.body"
          onUpdate={handleTextUpdate}
        />
        {typography.fonts.mono !== undefined && (
          <FontFamilyEditor
            label="Mono"
            value={typography.fonts.mono}
            path="typography.fonts.mono"
            onUpdate={handleTextUpdate}
          />
        )}
      </PropertyGroup>

      {/* bt-3-2 Task 4.4: Typographic scale with proportional preview */}
      <PropertyGroup title="Scale">
        <TypeScaleEditor
          entries={scaleEntries}
          headingFont={typography.fonts.heading}
          bodyFont={typography.fonts.body}
          onUpdate={handleTextUpdate}
        />
      </PropertyGroup>

      {/* bt-3-2 Task 4.3: Font weight properties with weight-applied preview */}
      <PropertyGroup title="Weights">
        {Object.entries(typography.weights).map(([key, value]) => (
          <FontWeightEditor
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={value}
            path={`typography.weights.${key}`}
            onUpdate={handleNumberUpdate}
          />
        ))}
      </PropertyGroup>

      {/* bt-2-2 Task 5.5: LineHeight record (if present) -- kept as basic inputs */}
      {typography.lineHeight && Object.keys(typography.lineHeight).length > 0 && (
        <PropertyGroup title="Line Height">
          {Object.entries(typography.lineHeight).map(([key, value]) => (
            <DirtyNumberInput
              key={key}
              label={key}
              value={value}
              path={`typography.lineHeight.${key}`}
              onUpdate={handleNumberUpdate}
            />
          ))}
        </PropertyGroup>
      )}
    </div>
  );
}
