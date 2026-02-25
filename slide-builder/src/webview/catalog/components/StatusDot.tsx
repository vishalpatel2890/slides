/**
 * StatusDot - Color-coded build status indicator.
 *
 * Story Reference: cv-1-4 Task 1 — StatusDot component
 *
 * AC-3: Correct colors per DeckStatus. Never rely on color alone — always includes aria-label.
 */

import React from 'react';
import type { DeckStatus } from '../../../shared/types';

const STATUS_LABELS: Record<DeckStatus, string> = {
  planned: 'Planned',
  partial: 'Partially built',
  built: 'Built',
  error: 'Error',
};

export interface StatusDotProps {
  status: DeckStatus;
  className?: string;
}

export function StatusDot({ status, className = '' }: StatusDotProps): React.ReactElement {
  return (
    <span
      className={`status-dot status-dot--${status} ${className}`.trim()}
      role="img"
      aria-label={`Build status: ${STATUS_LABELS[status]}`}
    />
  );
}
