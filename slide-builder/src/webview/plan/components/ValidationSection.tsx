/**
 * ValidationSection - Displays validation warnings with resolution suggestions.
 *
 * Story Reference: 22-2 Task 1 - Create ValidationSection component
 * AC-22.2.1: Validation section in EditPanel showing warning icon, type, message, and resolution suggestion
 * AC-22.2.6: Actionable resolution suggestions for each warning type
 * AC-22.2.7: Amber warning styling (#fffbeb bg, #fde68a border, #f59e0b text)
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ValidationWarning } from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface ValidationSectionProps {
  /** Array of warnings to display */
  warnings: ValidationWarning[];
}

// =============================================================================
// Resolution Suggestion Mapping (AC-22.2.6)
// =============================================================================

/**
 * Get resolution suggestion text for a warning type.
 * Maps warning types to actionable user guidance.
 */
function getResolutionSuggestion(warning: ValidationWarning): string {
  switch (warning.type) {
    case 'missing-field':
      // Distinguish between intent and template based on message content
      if (warning.message.toLowerCase().includes('intent') ||
          warning.message.toLowerCase().includes('description')) {
        return 'Add an intent description for this slide';
      }
      if (warning.message.toLowerCase().includes('template')) {
        return 'Select a template from the template selector';
      }
      return 'Fill in the required field';

    case 'low-confidence':
      return 'Refine the slide intent to better match available templates';

    case 'empty-section':
      return 'Add slides to this section or remove it';

    case 'missing-cta':
      return 'Assign a CTA storyline role to at least one slide';

    case 'empty-description':
      return 'Add a description for this slide';

    case 'multiline-description':
      return 'Convert description to a single line; move details to key points';

    case 'empty-key-points':
      return 'Add at least one key point for this slide';

    default:
      return 'Review and fix this issue';
  }
}

/**
 * Get display label for a warning type.
 */
function getWarningTypeLabel(type: ValidationWarning['type']): string {
  switch (type) {
    case 'missing-field':
      return 'Missing Field';
    case 'low-confidence':
      return 'Low Confidence';
    case 'empty-section':
      return 'Empty Section';
    case 'missing-cta':
      return 'Missing CTA';
    case 'empty-description':
      return 'Empty Description';
    case 'multiline-description':
      return 'Multiline Description';
    case 'empty-key-points':
      return 'Missing Key Points';
    default:
      return 'Warning';
  }
}

// =============================================================================
// ValidationSection Component
// =============================================================================

/**
 * ValidationSection displays a list of validation warnings with amber styling.
 * Each warning shows an icon, type label, message, and resolution suggestion.
 *
 * @example
 * <ValidationSection warnings={slideWarnings} />
 */
export function ValidationSection({ warnings }: ValidationSectionProps): React.ReactElement | null {
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col gap-2"
    >
      {warnings.map((warning, index) => (
        <div
          key={`${warning.type}-${warning.slideNumber ?? 'deck'}-${index}`}
          className={cn(
            // AC-22.2.7: Amber warning styling
            'bg-[#fffbeb] border border-[#fde68a]',
            'px-3 py-2 rounded-md',
            'flex flex-col gap-1'
          )}
        >
          {/* Warning header with icon and type label */}
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="w-4 h-4 text-[#f59e0b] flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-[12px] font-medium text-[#f59e0b]">
              {getWarningTypeLabel(warning.type)}
            </span>
          </div>

          {/* Warning message */}
          <p className="text-[13px] text-[#b45309] pl-6">
            {warning.message}
          </p>

          {/* Resolution suggestion (AC-22.2.6) */}
          <p className="text-[12px] text-[#92400e] pl-6 italic">
            {getResolutionSuggestion(warning)}
          </p>
        </div>
      ))}
    </div>
  );
}

ValidationSection.displayName = 'ValidationSection';
