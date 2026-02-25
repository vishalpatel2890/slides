/**
 * ChipGroup - Reusable chip/pill component for labels and tags.
 *
 * Story Reference: 19-1 Task 2 - Create ChipGroup Component
 * AC-19.1.6: Storyline role chip color-coded per UX spec
 *
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// =============================================================================
// ROLE_COLORS - Color mappings per storyline role
// From tech-spec-epic-19.md#Data Models and Contracts
// =============================================================================

export const ROLE_COLORS = {
  hook: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  context: { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  evidence: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  detail: { bg: 'var(--surface)', text: 'var(--fg-secondary)', border: 'var(--border)' },
  transition: { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
  cta: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
} as const;

export type StorylineRole = keyof typeof ROLE_COLORS;

// =============================================================================
// Chip Variants using cva
// =============================================================================

const chipVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border',
        outlined: 'border bg-transparent',
      },
      size: {
        // AC-19.4.3: Caption/Tiny = 11px, Caption = 11px/500
        sm: 'px-2 py-0.5 text-[11px] font-medium',
        md: 'px-2.5 py-1 text-xs font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

// =============================================================================
// Props Interface
// =============================================================================

export interface ChipProps extends VariantProps<typeof chipVariants> {
  /** Text label to display */
  label: string;
  /** Color scheme based on storyline role or neutral */
  colorScheme?: StorylineRole | 'neutral';
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Chip component for displaying labels with optional color coding.
 *
 * @example
 * // Storyline role chip
 * <Chip label="hook" colorScheme="hook" />
 *
 * @example
 * // Neutral chip
 * <Chip label="Template Name" colorScheme="neutral" size="md" />
 */
export function Chip({
  label,
  variant,
  colorScheme = 'neutral',
  size,
  className,
}: ChipProps): React.ReactElement {
  // Neutral style fallback for invalid/undefined colorScheme
  const neutralStyle = {
    backgroundColor: 'var(--surface)',
    color: 'var(--fg-secondary)',
    borderColor: 'var(--border)',
  };

  // Get color styles based on colorScheme - fall back to neutral if invalid
  const isValidRole = colorScheme && colorScheme !== 'neutral' && colorScheme in ROLE_COLORS;
  const colorStyles = isValidRole
    ? {
        backgroundColor: ROLE_COLORS[colorScheme as StorylineRole].bg,
        color: ROLE_COLORS[colorScheme as StorylineRole].text,
        borderColor: ROLE_COLORS[colorScheme as StorylineRole].border,
      }
    : neutralStyle;

  return (
    <span
      className={cn(chipVariants({ variant, size }), className)}
      style={colorStyles}
    >
      {label}
    </span>
  );
}

// =============================================================================
// ChipGroup - Multiple chips in a row
// =============================================================================

export interface ChipGroupProps {
  /** Array of chip configurations */
  chips: ChipProps[];
  /** Gap between chips */
  gap?: 'sm' | 'md';
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * ChipGroup for displaying multiple chips in a flex row.
 *
 * @example
 * <ChipGroup chips={[
 *   { label: 'hook', colorScheme: 'hook' },
 *   { label: 'Title Slide', colorScheme: 'neutral' },
 * ]} />
 */
export function ChipGroup({
  chips,
  gap = 'sm',
  className,
}: ChipGroupProps): React.ReactElement {
  const gapClass = gap === 'sm' ? 'gap-1' : 'gap-2';

  return (
    <div className={cn('flex flex-wrap items-center', gapClass, className)}>
      {chips.map((chipProps, index) => (
        <Chip key={`${chipProps.label}-${index}`} {...chipProps} />
      ))}
    </div>
  );
}
