/**
 * DeckDetail - Drill-down view showing deck header, action bar, and slide grid.
 *
 * Story Reference: cv-1-6 Task 4 — DeckDetail component
 *
 * AC-1: In-place drill-down replacing grid.
 * AC-2: Header with name, slide count, relative time.
 * AC-3: Action bar with 4 buttons (Edit Plan enabled, others disabled).
 * AC-4: Slide grid with SlideCard components.
 * AC-5: Edit Plan sends open-plan-editor message.
 * AC-6: Slide search with 100ms debounce.
 * AC-9: Empty state when no slides.
 * AC-10: Responsive icon-only buttons below 400px.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, PenLine, Presentation, Search } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { useCatalog } from '../context/CatalogContext';
import { SlideCard } from './SlideCard';
import { StatusDot } from './StatusDot';
import type { DeckDetail as DeckDetailType } from '../../../shared/types';

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// =============================================================================
// Action Button
// =============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, variant, disabled, tooltip, onClick }: ActionButtonProps): React.ReactElement {
  const button = (
    <button
      className={`deck-detail__action deck-detail__action--${variant}${disabled ? ' deck-detail__action--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type="button"
      aria-label={label}
    >
      {icon}
      <span className="deck-detail__action-label">{label}</span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="catalog-tooltip" sideOffset={4}>
            {tooltip}
            <Tooltip.Arrow className="catalog-tooltip__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return button;
}

// =============================================================================
// DeckDetail Component
// =============================================================================

export interface DeckDetailProps {
  deck: DeckDetailType;
}

export function DeckDetail({ deck }: DeckDetailProps): React.ReactElement {
  const { dispatch } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search (AC-6)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 100);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Filter slides by search query (AC-6)
  const filteredSlides = useMemo(() => {
    if (!debouncedQuery) return deck.slides;
    const q = debouncedQuery.toLowerCase();
    return deck.slides.filter(
      (s) =>
        (s.intent && s.intent.toLowerCase().includes(q)) ||
        (s.template && s.template.toLowerCase().includes(q)),
    );
  }, [deck.slides, debouncedQuery]);

  // View Slides handler (cv-2-1 AC-11)
  const handleViewSlides = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-slide-viewer', deckId: deck.id });
  }, [deck.id]);

  // Edit Plan handler (AC-5)
  const handleEditPlan = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-plan-editor', deckId: deck.id });
  }, [deck.id]);

  // Present handler (cv-2-4 AC-1, AC-7)
  const handlePresent = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'present-deck', deckId: deck.id });
  }, [deck.id]);

  // Build One handler (cv-3-4 AC-25, AC-30)
  const handleBuildOne = useCallback((slideNumber: number) => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'build-deck', deckId: deck.id, mode: 'one', slideNumber });
  }, [deck.id]);

  const isPlanned = deck.status === 'planned';

  const slideLabel = `${deck.slideCount} slide${deck.slideCount !== 1 ? 's' : ''}`;

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="deck-detail">
        {/* Header (AC-2) */}
        <div className="deck-detail__header">
          <h3 className="deck-detail__name">{deck.name}</h3>
          <div className="deck-detail__meta">
            <span className="deck-detail__count">{slideLabel}</span>
            <StatusDot status={deck.status} />
            <span className="deck-detail__modified">
              Last modified {formatRelativeTime(deck.lastModified)}
            </span>
          </div>
        </div>

        {/* Action Bar (AC-3, AC-5, AC-10) */}
        <div className="deck-detail__actions">
          <ActionButton
            icon={<Eye size={16} />}
            label="View Slides"
            variant="primary"
            onClick={handleViewSlides}
          />
          <ActionButton
            icon={<PenLine size={16} />}
            label="Edit Plan"
            variant="secondary"
            onClick={handleEditPlan}
          />
          <ActionButton
            icon={<Presentation size={16} />}
            label="Present"
            variant="secondary"
            disabled={isPlanned}
            tooltip={isPlanned ? 'Build slides first' : undefined}
            onClick={handlePresent}
          />
        </div>

        {/* Slide Search (AC-6) */}
        {deck.slides.length > 0 && (
          <div className="deck-detail__search">
            <Search size={14} className="deck-detail__search-icon" />
            <input
              className="deck-detail__search-input"
              type="text"
              placeholder="Search slides..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search slides"
            />
          </div>
        )}

        {/* Slide Grid or Empty State (AC-4, AC-9) */}
        {deck.slides.length === 0 ? (
          <div className="deck-detail__empty" role="status">
            <p className="deck-detail__empty-title">No slides built yet</p>
            <p className="deck-detail__empty-hint">Build slides to see them here.</p>
          </div>
        ) : filteredSlides.length === 0 ? (
          <div className="deck-detail__empty" role="status">
            <p className="deck-detail__empty-title">No slides match &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="deck-detail__empty-hint">Try a different search term.</p>
          </div>
        ) : (
          <div className="deck-detail__slides" role="list">
            {filteredSlides.map((slide) => (
              <SlideCard key={slide.number} slide={slide} onBuild={handleBuildOne} />
            ))}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
