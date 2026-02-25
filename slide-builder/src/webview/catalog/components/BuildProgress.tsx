/**
 * BuildProgress - Real-time build progress view showing per-slide status.
 *
 * Story Reference: cv-3-5 AC29-AC40
 *
 * AC-29: Shows inline in Catalog sidebar, replaces deck detail during build.
 * AC-30: Overall progress bar with fraction label (e.g., "8/12 slides").
 * AC-31: Per-slide status list with icons: Built (green), Building (blue pulse), Pending (gray), Error (red).
 * AC-32: Currently building slide has blue left-border accent.
 * AC-33: "Cancel Build" button to stop the process.
 * AC-35: Completed slides show thumbnails (clickable for preview).
 * AC-36: Partial builds show Done/Queued counts.
 * AC-37: "Build Complete" banner with "View Slides" CTA when done.
 * AC-38: Clicking "View Slides" opens SlideViewerPanel.
 */

import React, { useCallback } from 'react';
import { Check, Circle, X, XCircle, Eye, PenLine, Presentation, Loader2 } from 'lucide-react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import type { BuildProgress as BuildProgressType, BuildSlideStatus } from '../../../shared/types';

// =============================================================================
// Slide Status Icon
// =============================================================================

interface SlideStatusIconProps {
  status: BuildSlideStatus['status'];
}

function SlideStatusIcon({ status }: SlideStatusIconProps): React.ReactElement {
  switch (status) {
    case 'built':
      return <Check size={14} className="build-progress__status-icon build-progress__status-icon--built" aria-hidden="true" />;
    case 'building':
      return <Loader2 size={14} className="build-progress__status-icon build-progress__status-icon--building" aria-hidden="true" />;
    case 'error':
      return <XCircle size={14} className="build-progress__status-icon build-progress__status-icon--error" aria-hidden="true" />;
    case 'pending':
    default:
      return <Circle size={14} className="build-progress__status-icon build-progress__status-icon--pending" aria-hidden="true" />;
  }
}

// =============================================================================
// Progress Bar
// =============================================================================

interface ProgressBarProps {
  builtCount: number;
  totalCount: number;
}

function ProgressBar({ builtCount, totalCount }: ProgressBarProps): React.ReactElement {
  const percentage = totalCount > 0 ? Math.round((builtCount / totalCount) * 100) : 0;

  return (
    <div className="build-progress__bar-container">
      <div
        className="build-progress__bar"
        role="progressbar"
        aria-valuenow={builtCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`Build progress: ${builtCount} of ${totalCount} slides`}
      >
        <div
          className="build-progress__bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="build-progress__bar-label">{builtCount}/{totalCount} slides</span>
    </div>
  );
}

// =============================================================================
// Slide Status Row
// =============================================================================

interface SlideStatusRowProps {
  slide: BuildSlideStatus;
}

function SlideStatusRow({ slide }: SlideStatusRowProps): React.ReactElement {
  const isBuilding = slide.status === 'building';
  const statusLabel = getStatusLabel(slide.status);

  return (
    <div
      className={`build-progress__slide ${isBuilding ? 'build-progress__slide--building' : ''}`}
      role="listitem"
    >
      <div className="build-progress__slide-status">
        <SlideStatusIcon status={slide.status} />
        <span className="sr-only">{statusLabel}</span>
      </div>
      <div className="build-progress__slide-info">
        <span className="build-progress__slide-number">Slide {slide.number}</span>
        <span className="build-progress__slide-name">{slide.name}</span>
      </div>
      {slide.thumbnailUri && (
        <img
          src={slide.thumbnailUri}
          alt={`Thumbnail for slide ${slide.number}`}
          className="build-progress__slide-thumbnail"
        />
      )}
      {slide.errorMessage && (
        <span className="build-progress__slide-error" title={slide.errorMessage}>
          {slide.errorMessage}
        </span>
      )}
    </div>
  );
}

function getStatusLabel(status: BuildSlideStatus['status']): string {
  switch (status) {
    case 'built':
      return 'Built';
    case 'building':
      return 'Building';
    case 'error':
      return 'Error';
    case 'pending':
    default:
      return 'Pending';
  }
}

// =============================================================================
// Build Complete Banner
// =============================================================================

interface BuildCompleteBannerProps {
  deckId: string;
  onViewSlides: () => void;
  onEditPlan: () => void;
  onPresent: () => void;
}

function BuildCompleteBanner({
  onViewSlides,
  onEditPlan,
  onPresent,
}: BuildCompleteBannerProps): React.ReactElement {
  return (
    <div className="build-progress__complete" role="status">
      <div className="build-progress__complete-icon">
        <Check size={24} aria-hidden="true" />
      </div>
      <h3 className="build-progress__complete-title">Build Complete</h3>
      <p className="build-progress__complete-hint">All slides have been built successfully.</p>
      <div className="build-progress__complete-actions">
        <button
          type="button"
          className="build-progress__action build-progress__action--primary"
          onClick={onViewSlides}
        >
          <Eye size={16} aria-hidden="true" />
          <span>View Slides</span>
        </button>
        <button
          type="button"
          className="build-progress__action build-progress__action--secondary"
          onClick={onEditPlan}
        >
          <PenLine size={16} aria-hidden="true" />
          <span>Edit Plan</span>
        </button>
        <button
          type="button"
          className="build-progress__action build-progress__action--secondary"
          onClick={onPresent}
        >
          <Presentation size={16} aria-hidden="true" />
          <span>Present</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Build Cancelled Banner
// =============================================================================

interface BuildCancelledBannerProps {
  builtCount: number;
  totalCount: number;
}

function BuildCancelledBanner({ builtCount, totalCount }: BuildCancelledBannerProps): React.ReactElement {
  return (
    <div className="build-progress__cancelled" role="status">
      <div className="build-progress__cancelled-icon">
        <X size={20} aria-hidden="true" />
      </div>
      <span className="build-progress__cancelled-text">
        Build Cancelled — {builtCount}/{totalCount} slides built
      </span>
    </div>
  );
}

// =============================================================================
// BuildProgress Component
// =============================================================================

export interface BuildProgressProps {
  progress: BuildProgressType;
  onCancel: () => void;
  onBack: () => void;
}

export function BuildProgress({ progress, onCancel, onBack }: BuildProgressProps): React.ReactElement {
  const builtCount = progress.slides.filter((s) => s.status === 'built').length;
  const totalCount = progress.slides.length;

  const isComplete = progress.status === 'complete';
  const isCancelled = progress.status === 'cancelled';
  const isBuilding = progress.status === 'building';

  // Handlers for Build Complete actions
  const handleViewSlides = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-slide-viewer', deckId: progress.deckId });
  }, [progress.deckId]);

  const handleEditPlan = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'open-plan-editor', deckId: progress.deckId });
  }, [progress.deckId]);

  const handlePresent = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'present-deck', deckId: progress.deckId });
  }, [progress.deckId]);

  const handleCancel = useCallback(() => {
    const api = getVSCodeApi();
    api.postMessage({ type: 'cancel-build', deckId: progress.deckId });
    onCancel();
  }, [progress.deckId, onCancel]);

  return (
    <div className="build-progress">
      {/* Header */}
      <div className="build-progress__header">
        <h3 className="build-progress__title">
          {isBuilding ? 'Building...' : isComplete ? 'Build Complete' : isCancelled ? 'Build Cancelled' : 'Build Progress'}
        </h3>
        <span className="build-progress__deck-name">{progress.deckName}</span>
      </div>

      {/* Progress Bar (AC-30) */}
      <ProgressBar builtCount={builtCount} totalCount={totalCount} />

      {/* Build Complete Banner (AC-37, AC-38) */}
      {isComplete && (
        <BuildCompleteBanner
          deckId={progress.deckId}
          onViewSlides={handleViewSlides}
          onEditPlan={handleEditPlan}
          onPresent={handlePresent}
        />
      )}

      {/* Build Cancelled Banner (AC-36) */}
      {isCancelled && (
        <BuildCancelledBanner builtCount={builtCount} totalCount={totalCount} />
      )}

      {/* Cancel Button (AC-33) */}
      {isBuilding && (
        <button
          type="button"
          className="build-progress__cancel"
          onClick={handleCancel}
        >
          <X size={14} aria-hidden="true" />
          <span>Cancel Build</span>
        </button>
      )}

      {/* Per-slide Status List (AC-31, AC-32) */}
      <div className="build-progress__slides" role="list" aria-label="Slide build status">
        {progress.slides.map((slide) => (
          <SlideStatusRow key={slide.number} slide={slide} />
        ))}
      </div>

      {/* Back Button (for cancelled/error states) */}
      {(isCancelled || progress.status === 'error') && (
        <button
          type="button"
          className="build-progress__back"
          onClick={onBack}
        >
          Back to Deck
        </button>
      )}
    </div>
  );
}
