/**
 * TemplateCard - Visual card for browsing slide/deck templates.
 * Showcase card with 16:9 preview, name, description, and category chip.
 * Deck templates also show a slide count badge.
 *
 * Story Reference: cv-5-1 Task 3 — TemplateCard component
 * Story Reference: cv-5-2 AC-12 — Deck template slide count badge
 *
 * AC-2: Card shows: preview (16:9), name (14px, weight 500), description (2-line, 13px), category chip.
 * AC-7: Templates are read-only - no edit/delete actions.
 * AC-10: Keyboard accessible: role="button", tabindex="0", Enter/Space opens preview.
 * AC-12 (cv-5-2): Deck template cards show slide count badge (e.g., "12 slides").
 */

import React, { useCallback } from 'react';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../../shared/types';

export interface TemplateCardProps {
  template: SlideTemplateDisplay | DeckTemplateDisplay;
  onClick?: (template: SlideTemplateDisplay | DeckTemplateDisplay) => void;
  /** Category to display (extracted from template, can be overridden) */
  category?: string;
}

/**
 * Type guard to check if template is a DeckTemplateDisplay (has slideCount).
 * Story Reference: cv-5-2 AC-12
 */
function isDeckTemplate(
  template: SlideTemplateDisplay | DeckTemplateDisplay
): template is DeckTemplateDisplay {
  return 'slideCount' in template && typeof (template as DeckTemplateDisplay).slideCount === 'number';
}

/**
 * Type guard to check if template is a SlideTemplateDisplay.
 * SlideTemplateDisplay has use_cases array, DeckTemplateDisplay does not.
 */
function isSlideTemplate(
  template: SlideTemplateDisplay | DeckTemplateDisplay
): template is SlideTemplateDisplay {
  return 'use_cases' in template;
}

export function TemplateCard({
  template,
  onClick,
  category,
}: TemplateCardProps): React.ReactElement {
  // Both SlideTemplateDisplay and DeckTemplateDisplay now have category field
  const displayCategory = template.category || category;
  const slideCount = isDeckTemplate(template) ? template.slideCount : null;
  const previewUri = template.previewUri;

  const handleClick = useCallback(() => {
    onClick?.(template);
  }, [onClick, template]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(template);
      }
    },
    [onClick, template]
  );

  // Build aria-label with slide count for deck templates
  let ariaLabel = `Template: ${template.name}`;
  if (displayCategory) ariaLabel += `, category: ${displayCategory}`;
  if (slideCount !== null && slideCount > 0) ariaLabel += `, ${slideCount} slides`;

  return (
    <div
      className="template-card"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* 16:9 Preview area */}
      <div className="template-card__preview">
        {previewUri ? (
          <img
            src={previewUri}
            alt={`Preview of ${template.name}`}
            className="template-card__preview-image"
          />
        ) : (
          <div className="template-card__preview-placeholder">
            <span className="template-card__preview-icon">
              {/* Simple template icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="template-card__body">
        {/* Category and slide count chips container */}
        <div className="template-card__chips">
          {/* Category chip */}
          {displayCategory && (
            <span className="template-card__category">{displayCategory}</span>
          )}

          {/* Slide count badge for deck templates (cv-5-2 AC-12) */}
          {slideCount !== null && slideCount > 0 && (
            <span className="template-card__slide-count">
              {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
            </span>
          )}
        </div>

        {/* Template name (14px, weight 500) */}
        <p className="template-card__name">{template.name}</p>

      </div>
    </div>
  );
}
