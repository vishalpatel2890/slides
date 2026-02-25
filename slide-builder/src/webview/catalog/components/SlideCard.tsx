/**
 * SlideCard - Individual slide card for deck detail view.
 *
 * Story Reference: cv-1-6 Task 3 — SlideCard component
 * Story Reference: cv-3-4 AC-25, AC-30 — Build One button
 *
 * AC-4: Shows slide number, intent snippet, template badge, StatusDot.
 * AC-25: Build One button triggers single slide build.
 */

import React from 'react';
import { Hammer } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { SlideInfo } from '../../../shared/types';
import { StatusDot } from './StatusDot';

export interface SlideCardProps {
  slide: SlideInfo;
  onBuild?: (slideNumber: number) => void;
}

const SLIDE_STATUS_MAP = {
  planned: 'planned',
  built: 'built',
  error: 'error',
} as const;

function toDeckStatus(status: SlideInfo['status']) {
  return SLIDE_STATUS_MAP[status] ?? 'planned';
}

export function SlideCard({ slide, onBuild }: SlideCardProps): React.ReactElement {
  const label = `Slide ${slide.number}${slide.intent ? `: ${slide.intent}` : ''}`;

  const handleBuild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuild?.(slide.number);
  };

  return (
    <div className="slide-card" role="listitem" aria-label={label}>
      <div className="slide-card__header">
        <span className="slide-card__number">#{slide.number}</span>
        <div className="slide-card__actions">
          {onBuild && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  className="slide-card__build-btn"
                  onClick={handleBuild}
                  type="button"
                  aria-label={`Build slide ${slide.number}`}
                >
                  <Hammer size={12} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="catalog-tooltip" sideOffset={4}>
                  Build this slide
                  <Tooltip.Arrow className="catalog-tooltip__arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
          <StatusDot status={toDeckStatus(slide.status)} />
        </div>
      </div>
      {slide.intent && (
        <p className="slide-card__intent">{slide.intent}</p>
      )}
      {slide.template && (
        <span className="slide-card__template">{slide.template}</span>
      )}
    </div>
  );
}
