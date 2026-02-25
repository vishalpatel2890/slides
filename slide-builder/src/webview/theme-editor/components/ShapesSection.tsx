/**
 * ShapesSection - Renders shape properties with visual editors.
 *
 * Story Reference: bt-3-3 Task 6 -- AC-17, AC-18, AC-19, AC-20, AC-23
 * Upgraded from basic DirtyTextInput to purpose-built visual editors:
 * - BorderRadiusEditor for borderRadius properties (number input + preview box)
 * - ShadowEditor for shadow properties (component inputs + color swatch + preview box)
 * - BorderEditor for border properties (width/style/color controls + preview box)
 *
 * Preserves collapsible section behavior via SectionHeader.
 */

import React, { useCallback } from 'react';
import type { ThemeShapes } from '../../../shared/types';
import { useThemeEditor } from '../context/ThemeEditorContext';
import { PropertyGroup } from './PropertyInput';
import { BorderRadiusEditor } from './BorderRadiusEditor';
import { ShadowEditor } from './ShadowEditor';
import { BorderEditor } from './BorderEditor';

// =============================================================================
// Props
// =============================================================================

interface ShapesSectionProps {
  shapes: ThemeShapes;
}

// =============================================================================
// Component
// =============================================================================

export function ShapesSection({ shapes }: ShapesSectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();

  const handleUpdate = useCallback(
    (path: string, value: string) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  return (
    <div>
      {/* bt-3-3 Task 6.2: BorderRadiusEditor for borderRadius properties (AC-17, AC-18) */}
      <PropertyGroup title="Border Radius">
        {Object.entries(shapes.borderRadius).map(([key, value]) => (
          <BorderRadiusEditor
            key={key}
            label={key}
            value={value}
            path={`shapes.borderRadius.${key}`}
            onUpdate={handleUpdate}
          />
        ))}
      </PropertyGroup>

      {/* bt-3-3 Task 6.3: ShadowEditor for shadow properties (AC-19, AC-23) */}
      <PropertyGroup title="Shadow">
        {Object.entries(shapes.shadow).map(([key, value]) => (
          <ShadowEditor
            key={key}
            label={key}
            value={value}
            path={`shapes.shadow.${key}`}
            onUpdate={handleUpdate}
          />
        ))}
      </PropertyGroup>

      {/* bt-3-3 Task 6.4: BorderEditor for border properties (AC-20, AC-23) */}
      <PropertyGroup title="Border">
        {Object.entries(shapes.border).map(([key, value]) => (
          <BorderEditor
            key={key}
            label={key}
            value={value}
            path={`shapes.border.${key}`}
            onUpdate={handleUpdate}
          />
        ))}
      </PropertyGroup>
    </div>
  );
}
