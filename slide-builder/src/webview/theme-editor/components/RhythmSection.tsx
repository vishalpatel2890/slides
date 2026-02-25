/**
 * RhythmSection - Renders slide rhythm / workflow rules settings.
 *
 * Story Reference: bt-2-2 Task 8 — AC-6 (Basic Property Editors), AC-8 (Missing Sections)
 * Enhanced: bt-3-4 Tasks 1–3 — AC-24 through AC-27
 *   - Labeled number inputs with descriptive help text (AC-24, AC-25)
 *   - backgroundMode select dropdown with dark/light/auto options (AC-26, AC-27)
 *   - PropertyGroup separation between rhythm settings and role overrides
 *   - Empty state handling
 *
 * Renders workflowRules.rhythm settings and roleOverrides record.
 * The entire section is hidden if workflowRules is undefined (handled by ThemeEditorLayout).
 */

import React, { useCallback } from 'react';
import type { ThemeWorkflowRules } from '../../../shared/types';
import { useThemeEditor, useFieldDirty } from '../context/ThemeEditorContext';
import { DirtyTextInput, DirtyNumberInput, PropertyGroup } from './PropertyInput';

// =============================================================================
// Constants
// =============================================================================

const BACKGROUND_MODES = ['dark', 'light', 'auto'] as const;

/** Descriptive help text for each rhythm setting */
const RHYTHM_DESCRIPTIONS: Record<string, string> = {
  maxConsecutiveDark: 'Maximum consecutive slides with dark backgrounds before forcing a break',
  maxConsecutiveLight: 'Maximum consecutive slides with light backgrounds before forcing a break',
  forceBreakAfter: 'Force a background mode switch after this many consecutive slides',
  defaultMode: 'Default background mode for new slides',
};

// =============================================================================
// Styles
// =============================================================================

const inputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
};

const dirtyInputStyle: React.CSSProperties = {
  ...inputStyle,
  borderLeft: '3px solid var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

const helpTextStyle: React.CSSProperties = {
  color: 'var(--vscode-descriptionForeground, var(--vscode-editor-foreground))',
  fontSize: '11px',
  opacity: 0.6,
  marginTop: '2px',
};

const smallLabelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
  fontSize: '10px',
  opacity: 0.5,
};

// =============================================================================
// Props
// =============================================================================

interface RhythmSectionProps {
  workflowRules: ThemeWorkflowRules;
}

// =============================================================================
// Sub-component: BackgroundModeSelect
// =============================================================================

interface BackgroundModeSelectProps {
  role: string;
  value: string;
  path: string;
  onUpdate: (path: string, value: string) => void;
}

function BackgroundModeSelect({ role, value, path, onUpdate }: BackgroundModeSelectProps): React.JSX.Element {
  const isDirty = useFieldDirty(path);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(path, e.target.value);
    },
    [path, onUpdate],
  );

  // Build options: always include dark/light/auto, plus current value if non-standard
  const hasNonStandard = value && !BACKGROUND_MODES.includes(value as (typeof BACKGROUND_MODES)[number]);

  return (
    <div className="flex flex-col mb-2">
      <span style={smallLabelStyle}>Background Mode</span>
      <select
        data-testid={`rhythm-bg-mode-${role}`}
        className="text-sm px-2 py-1 rounded outline-none"
        style={isDirty ? dirtyInputStyle : inputStyle}
        value={value}
        onChange={handleChange}
        aria-label={`${role} background mode`}
      >
        {hasNonStandard && (
          <option key={value} value={value}>
            {value}
          </option>
        )}
        {BACKGROUND_MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function RhythmSection({ workflowRules }: RhythmSectionProps): React.JSX.Element {
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

  const rhythm = workflowRules.rhythm;

  if (!rhythm) {
    return (
      <p data-testid="rhythm-empty" className="text-xs opacity-50" style={{ color: 'var(--vscode-editor-foreground)' }}>
        No rhythm settings defined.
      </p>
    );
  }

  const hasRhythmSettings =
    rhythm.defaultMode !== undefined ||
    rhythm.maxConsecutiveDark !== undefined ||
    rhythm.maxConsecutiveLight !== undefined ||
    rhythm.forceBreakAfter !== undefined;

  const hasRoleOverrides = rhythm.roleOverrides && Object.keys(rhythm.roleOverrides).length > 0;

  return (
    <div>
      {/* bt-3-4 Task 3.1: Rhythm Settings sub-section */}
      {hasRhythmSettings && (
        <PropertyGroup title="Rhythm Settings">
          {/* bt-3-4 Task 1.5: defaultMode text input with description */}
          {rhythm.defaultMode !== undefined && (
            <div className="mb-3">
              <DirtyTextInput
                label="Default Mode"
                value={rhythm.defaultMode}
                path="workflowRules.rhythm.defaultMode"
                onUpdate={handleTextUpdate}
              />
              <p data-testid="help-defaultMode" style={helpTextStyle}>
                {RHYTHM_DESCRIPTIONS.defaultMode}
              </p>
            </div>
          )}

          {/* bt-3-4 Task 1.2: maxConsecutiveDark with description */}
          {rhythm.maxConsecutiveDark !== undefined && (
            <div className="mb-3">
              <DirtyNumberInput
                label="Max Consecutive Dark"
                value={rhythm.maxConsecutiveDark}
                path="workflowRules.rhythm.maxConsecutiveDark"
                onUpdate={handleNumberUpdate}
              />
              <p data-testid="help-maxConsecutiveDark" style={helpTextStyle}>
                {RHYTHM_DESCRIPTIONS.maxConsecutiveDark}
              </p>
            </div>
          )}

          {/* bt-3-4 Task 1.2: maxConsecutiveLight with description */}
          {rhythm.maxConsecutiveLight !== undefined && (
            <div className="mb-3">
              <DirtyNumberInput
                label="Max Consecutive Light"
                value={rhythm.maxConsecutiveLight}
                path="workflowRules.rhythm.maxConsecutiveLight"
                onUpdate={handleNumberUpdate}
              />
              <p data-testid="help-maxConsecutiveLight" style={helpTextStyle}>
                {RHYTHM_DESCRIPTIONS.maxConsecutiveLight}
              </p>
            </div>
          )}

          {/* bt-3-4 Task 1.2: forceBreakAfter with description */}
          {rhythm.forceBreakAfter !== undefined && (
            <div className="mb-3">
              <DirtyNumberInput
                label="Force Break After"
                value={rhythm.forceBreakAfter}
                path="workflowRules.rhythm.forceBreakAfter"
                onUpdate={handleNumberUpdate}
              />
              <p data-testid="help-forceBreakAfter" style={helpTextStyle}>
                {RHYTHM_DESCRIPTIONS.forceBreakAfter}
              </p>
            </div>
          )}
        </PropertyGroup>
      )}

      {/* bt-3-4 Task 3.1: Role Overrides sub-section */}
      {hasRoleOverrides && (
        <PropertyGroup title="Role Overrides">
          {Object.entries(rhythm.roleOverrides!).map(([role, settings]) => (
            <div key={role} data-testid={`role-override-${role}`} className="mb-3">
              {/* bt-3-4 Task 2.6: Role name label */}
              <label className="text-xs font-semibold mb-1 block opacity-70" style={labelStyle}>
                {role}
              </label>

              {/* bt-3-4 Task 2.1-2.5: backgroundMode select dropdown */}
              {settings.backgroundMode !== undefined && (
                <BackgroundModeSelect
                  role={role}
                  value={settings.backgroundMode}
                  path={`workflowRules.rhythm.roleOverrides.${role}.backgroundMode`}
                  onUpdate={handleTextUpdate}
                />
              )}
            </div>
          ))}
        </PropertyGroup>
      )}
    </div>
  );
}
