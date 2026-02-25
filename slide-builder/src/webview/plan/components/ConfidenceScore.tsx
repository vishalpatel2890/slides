/**
 * ConfidenceScore - Colored percentage badge for template confidence scoring.
 *
 * Story Reference: 20-2 Task 1 - Create ConfidenceScore component
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 *
 * AC-20.2.4: Badge colors - Green (#22c55e) >=80%, Amber (#f59e0b) 50-79%, Red (#ef4444) <50%
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// =============================================================================
// Badge Variants using cva
// =============================================================================

const confidenceVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap tabular-nums',
  {
    variants: {
      tier: {
        high: 'bg-[#22c55e]/15 text-[#16a34a] border border-[#22c55e]/30',
        medium: 'bg-[#f59e0b]/15 text-[#d97706] border border-[#f59e0b]/30',
        low: 'bg-[#ef4444]/15 text-[#dc2626] border border-[#ef4444]/30',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-[11px]',
      },
    },
    defaultVariants: {
      tier: 'low',
      size: 'md',
    },
  }
);

// =============================================================================
// Props Interface
// =============================================================================

export interface ConfidenceScoreProps extends VariantProps<typeof confidenceVariants> {
  /** Confidence score 0-100 */
  score: number;
  /** Display size: sm for card badge, md for dropdown */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Helper
// =============================================================================

/**
 * Determine tier from score.
 * AC-20.2.4: >=80 high, 50-79 medium, <50 low
 */
export function scoreTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

// =============================================================================
// Component
// =============================================================================

/**
 * ConfidenceScore displays a confidence percentage as a colored pill badge.
 *
 * @example
 * <ConfidenceScore score={85} />        // Green badge "85%"
 * <ConfidenceScore score={65} size="sm" /> // Amber badge, compact
 */
export function ConfidenceScore({
  score,
  size = 'md',
  className,
}: ConfidenceScoreProps): React.ReactElement {
  const tier = scoreTier(score);

  return (
    <span
      className={cn(confidenceVariants({ tier, size }), className)}
      aria-label={`${Math.round(score)}% confidence`}
    >
      {Math.round(score)}%
    </span>
  );
}
