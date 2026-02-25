/**
 * TemplateDetail - Full-size template preview dialog.
 *
 * Story Reference: cv-5-1 Task 5 — TemplateDetail component
 * Story Reference: cv-5-2 AC-15, AC-16 — Deck template preview and "Use Template" CTA
 *
 * AC-6: Clicking a template card opens a full-size preview dialog
 *       with complete description, use cases list, and category.
 * AC-15 (cv-5-2): Deck template detail shows slide structure.
 * AC-16 (cv-5-2): "Use Template" CTA visible for deck templates.
 *
 * Uses Radix Dialog for accessibility:
 * - role="dialog" with proper ARIA
 * - Focus trap within dialog
 * - Close on Escape, click outside, or close button
 */

import React, { useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText } from 'lucide-react';
import type { SlideTemplateDisplay, DeckTemplateDisplay } from '../../../shared/types';

export interface TemplateDetailProps {
  template: SlideTemplateDisplay | DeckTemplateDisplay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback when "Use Template" is clicked for deck templates (cv-5-2 AC-16) */
  onUseTemplate?: (templateId: string) => void;
}

/**
 * Type guard to check if template is a DeckTemplateDisplay.
 * DeckTemplateDisplay has slideCount property.
 * Story Reference: cv-5-2 AC-15, AC-16
 */
function isDeckTemplate(
  template: SlideTemplateDisplay | DeckTemplateDisplay | null
): template is DeckTemplateDisplay {
  return template !== null && 'slideCount' in template && typeof (template as DeckTemplateDisplay).slideCount === 'number';
}

/**
 * Type guard to check if template is a SlideTemplateDisplay.
 * SlideTemplateDisplay has use_cases array.
 */
function isSlideTemplate(
  template: SlideTemplateDisplay | DeckTemplateDisplay | null
): template is SlideTemplateDisplay {
  return template !== null && 'use_cases' in template;
}

export function TemplateDetail({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplateDetailProps): React.ReactElement | null {
  if (!template && !open) {
    return null;
  }

  // Both template types now have category
  const category = template?.category || (isDeckTemplate(template) ? 'Deck' : 'Slide');
  const useCases = isSlideTemplate(template) ? template.use_cases : [];
  const previewUri = template?.previewUri;
  const slideCount = isDeckTemplate(template) ? template.slideCount : null;
  const isDeck = isDeckTemplate(template);

  const handleUseTemplate = useCallback(() => {
    if (template && onUseTemplate) {
      onUseTemplate(template.id);
      onOpenChange(false); // Close dialog after triggering use
    }
  }, [template, onUseTemplate, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="template-detail-overlay" />
        <Dialog.Content
          className="template-detail-content"
          aria-describedby="template-detail-description"
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="template-detail__close"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </Dialog.Close>

          {/* Full-size preview */}
          <div className="template-detail__preview">
            {previewUri ? (
              <img
                src={previewUri}
                alt={`Preview of ${template?.name ?? 'template'}`}
                className="template-detail__preview-image"
              />
            ) : (
              <div className="template-detail__preview-placeholder">
                <svg
                  width="64"
                  height="64"
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
              </div>
            )}
          </div>

          {/* Content body */}
          <div className="template-detail__body">
            {/* Header with category and slide count */}
            <div className="template-detail__header">
              {/* Category chip */}
              <span className="template-detail__category">{category}</span>

              {/* Slide count badge for deck templates (cv-5-2 AC-15) */}
              {slideCount !== null && slideCount > 0 && (
                <span className="template-detail__slide-count">
                  <FileText size={12} />
                  {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
                </span>
              )}
            </div>

            {/* Title */}
            <Dialog.Title className="template-detail__name">
              {template?.name ?? ''}
            </Dialog.Title>

            {/* Full description */}
            <p
              id="template-detail-description"
              className="template-detail__description"
            >
              {template?.description ?? ''}
            </p>

            {/* Use cases list for slide templates */}
            {useCases.length > 0 && (
              <div className="template-detail__use-cases">
                <h4 className="template-detail__use-cases-title">Use Cases</h4>
                <ul className="template-detail__use-cases-list">
                  {useCases.map((useCase, index) => (
                    <li key={index} className="template-detail__use-case">
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use Template CTA for deck templates (cv-5-2 AC-16) */}
            {isDeck && onUseTemplate && (
              <div className="template-detail__actions">
                <button
                  className="template-detail__use-button"
                  onClick={handleUseTemplate}
                  aria-label={`Use ${template?.name} template to create a new deck`}
                >
                  Use Template
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
