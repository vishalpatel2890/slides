/**
 * useValidation - Hook to filter validation warnings by scope.
 *
 * Story Reference: 22-1 Task 4 - Create useValidation hook
 * AC-22.1.10: Badge click behavior uses filtered warnings
 *
 * Consumes validationWarnings from PlanContext and provides
 * filtered views by slide, section, or deck level.
 */

import { useCallback, useMemo } from 'react';
import { useValidationWarnings } from '../context/PlanContext';
import type { ValidationWarning } from '../../../shared/types';

export interface UseValidationResult {
  /** Get warnings for a specific slide number */
  slideWarnings: (slideNumber: number) => ValidationWarning[];
  /** Get warnings for a specific section */
  sectionWarnings: (sectionId: string) => ValidationWarning[];
  /** Deck-level warnings (no slideNumber or sectionId) */
  deckWarnings: ValidationWarning[];
  /** Whether any warnings exist */
  hasWarnings: boolean;
}

export function useValidation(): UseValidationResult {
  const warnings = useValidationWarnings();

  const slideWarnings = useCallback(
    (slideNumber: number): ValidationWarning[] =>
      warnings.filter((w) => w.slideNumber === slideNumber),
    [warnings]
  );

  const sectionWarnings = useCallback(
    (sectionId: string): ValidationWarning[] =>
      warnings.filter((w) => w.sectionId === sectionId),
    [warnings]
  );

  const deckWarnings = useMemo(
    () => warnings.filter((w) => w.slideNumber === undefined && w.sectionId === undefined),
    [warnings]
  );

  const hasWarnings = warnings.length > 0;

  return { slideWarnings, sectionWarnings, deckWarnings, hasWarnings };
}
