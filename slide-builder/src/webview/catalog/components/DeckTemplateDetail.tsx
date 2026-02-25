/**
 * DeckTemplateDetail - Side panel showing deck template configuration.
 *
 * Story Reference: v4-1-3 AC-1, AC-2, AC-3, AC-4
 *
 * AC-1: Shows template name, description, version, slide count, and slide list
 * AC-2: Each slide row is clickable to expand and show instructions
 * AC-3: "Edit Template" button enters edit mode
 * AC-4: Follows AssetDetail slide-in panel pattern
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, FileText, PenLine, Pencil, Database, Eye, Trash2, Send } from 'lucide-react';
import type { DeckTemplateConfig, SlideConfig } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface DeckTemplateDetailProps {
  /** Template configuration to display (null = panel hidden) */
  config: DeckTemplateConfig | null;
  /** Template identifier */
  templateId: string | null;
  /** Callback when panel requests close */
  onClose: () => void;
  /** Callback when "Edit Template" is clicked (AC-3) */
  onEditTemplate?: (templateId: string) => void;
  /** Callback when "Preview" is clicked on a slide row (tm-2-2 AC-1, AC-2) */
  onPreviewSlide?: (templateId: string, slideFile: string) => void;
  /** Callback when "Delete" is clicked (tm-2-3 AC-5) */
  onDeleteTemplate?: (templateId: string) => void;
  /** tm-3-4: Callback when "Edit" is clicked on a slide row (AC-1, AC-2, AC-4) */
  onEditSlide?: (templateId: string, slideFile: string, changes: string) => void;
}

// =============================================================================
// SlideRow - Expandable slide row component
// =============================================================================

interface SlideRowProps {
  slide: SlideConfig;
  expanded: boolean;
  onToggle: () => void;
  /** Template identifier for preview (tm-2-2) */
  templateId?: string;
  /** Callback when Preview button is clicked (tm-2-2 AC-2) */
  onPreviewSlide?: (templateId: string, slideFile: string) => void;
  /** tm-3-4: Callback when Edit button is clicked (AC-1, AC-2) */
  onEditSlide?: (templateId: string, slideFile: string) => void;
}

function SlideRow({ slide, expanded, onToggle, templateId, onPreviewSlide, onEditSlide }: SlideRowProps): React.ReactElement {
  return (
    <div className="deck-template-detail__slide">
      <button
        type="button"
        className="deck-template-detail__slide-header"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`slide-content-${slide.number}`}
      >
        <span className="deck-template-detail__slide-toggle">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="deck-template-detail__slide-number">{slide.number}</span>
        <span className="deck-template-detail__slide-name">{slide.name}</span>
        {slide.content_sources.length > 0 && (
          <span className="deck-template-detail__slide-sources" title="Content sources">
            <Database size={12} />
            {slide.content_sources.length}
          </span>
        )}
        {onEditSlide && templateId && (
          <button
            type="button"
            className="deck-template-detail__slide-edit-btn"
            aria-label={`Edit slide ${slide.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onEditSlide(templateId, slide.file);
            }}
          >
            <Pencil size={12} />
          </button>
        )}
        {onPreviewSlide && templateId && (
          <button
            type="button"
            className="deck-template-detail__slide-preview-btn"
            aria-label={`Preview slide ${slide.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onPreviewSlide(templateId, slide.file);
            }}
          >
            <Eye size={12} />
          </button>
        )}
      </button>
      {expanded && (
        <div
          id={`slide-content-${slide.number}`}
          className="deck-template-detail__slide-body"
          role="region"
          aria-label={`Instructions for ${slide.name}`}
        >
          <div className="deck-template-detail__slide-file">
            <FileText size={12} />
            <span>{slide.file}</span>
          </div>
          <pre className="deck-template-detail__slide-instructions">
            {slide.instructions || 'No instructions defined'}
          </pre>
          {slide.content_sources.length > 0 && (
            <div className="deck-template-detail__sources-list">
              <span className="deck-template-detail__sources-title">Content Sources</span>
              {slide.content_sources.map((source, i) => (
                <div key={i} className="deck-template-detail__source-chip">
                  {source.type}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DeckTemplateDetail Component
// =============================================================================

export function DeckTemplateDetail({
  config,
  templateId,
  onClose,
  onEditTemplate,
  onPreviewSlide,
  onDeleteTemplate,
  onEditSlide,
}: DeckTemplateDetailProps): React.ReactElement | null {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set());

  // tm-3-4: State for the edit slide panel (AC-1, AC-2)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSlideFile, setEditSlideFile] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Escape key (AC-4: follows AssetDetail pattern)
  useEffect(() => {
    if (!config) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  // Focus close button when panel opens
  useEffect(() => {
    if (config && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [config]);

  // Reset expanded state when config changes
  useEffect(() => {
    setExpandedSlides(new Set());
  }, [templateId]);

  // Toggle slide expansion (AC-2)
  const toggleSlide = useCallback((slideNumber: number) => {
    setExpandedSlides((prev) => {
      const next = new Set(prev);
      if (next.has(slideNumber)) {
        next.delete(slideNumber);
      } else {
        next.add(slideNumber);
      }
      return next;
    });
  }, []);

  // Handle Edit Template click (AC-3)
  const handleEditTemplate = useCallback(() => {
    if (templateId && onEditTemplate) {
      onEditTemplate(templateId);
    }
  }, [templateId, onEditTemplate]);

  // tm-2-3: Handle Delete Template click (AC-5)
  const handleDeleteTemplate = useCallback(() => {
    if (templateId && onDeleteTemplate) {
      onDeleteTemplate(templateId);
    }
  }, [templateId, onDeleteTemplate]);

  // tm-3-4: Handle Edit Slide button click — opens inline edit panel (AC-1, AC-2)
  const handleEditSlideClick = useCallback((tid: string, slideFile: string) => {
    setEditSlideFile(slideFile);
    setEditInstruction('');
    setEditModalOpen(true);
    requestAnimationFrame(() => editTextareaRef.current?.focus());
  }, []);

  // tm-3-4: Handle edit panel close
  const handleEditSlideClose = useCallback(() => {
    setEditModalOpen(false);
    setEditSlideFile(null);
    setEditInstruction('');
  }, []);

  // tm-3-4: Handle edit panel submit (AC-2, AC-4)
  const handleEditSlideSubmit = useCallback(() => {
    const trimmed = editInstruction.trim();
    if (!trimmed || !templateId || !editSlideFile || !onEditSlide) return;
    onEditSlide(templateId, editSlideFile, trimmed);
    handleEditSlideClose();
  }, [templateId, editSlideFile, editInstruction, onEditSlide, handleEditSlideClose]);

  // tm-3-4: Keyboard handling for edit panel
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleEditSlideClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSlideSubmit();
    }
  }, [handleEditSlideClose, handleEditSlideSubmit]);

  // Don't render if no config
  if (!config) {
    return null;
  }

  const slideLabel = `${config.slide_count} slide${config.slide_count !== 1 ? 's' : ''}`;

  return (
    <aside
      ref={panelRef}
      className="deck-template-detail"
      role="complementary"
      aria-label="Deck template details"
    >
      {/* Header with action buttons (AC-4: matches AssetDetail) */}
      <div className="deck-template-detail__header">
        {onDeleteTemplate && (
          <button
            type="button"
            className="deck-template-detail__delete-btn"
            onClick={handleDeleteTemplate}
            aria-label="Delete template"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          ref={closeButtonRef}
          type="button"
          className="deck-template-detail__close"
          onClick={onClose}
          aria-label="Close template details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Template metadata (AC-1) */}
      <div className="deck-template-detail__content">
        <h2 className="deck-template-detail__name">{config.name}</h2>
        <p className="deck-template-detail__description">{config.description}</p>

        <div className="deck-template-detail__meta">
          <span className="deck-template-detail__version">v{config.version}</span>
          <span className="deck-template-detail__count">
            <FileText size={12} />
            {slideLabel}
          </span>
        </div>

        {/* Context variables summary */}
        {(config.required_context.length > 0 || config.optional_context.length > 0) && (
          <div className="deck-template-detail__context">
            <span className="deck-template-detail__context-label">Context Variables</span>
            <span className="deck-template-detail__context-count">
              {config.required_context.length} required, {config.optional_context.length} optional
            </span>
          </div>
        )}

        {/* Edit Template button (AC-3) */}
        {onEditTemplate && (
          <button
            type="button"
            className="deck-template-detail__edit-btn"
            onClick={handleEditTemplate}
            aria-label="Edit template configuration"
          >
            <PenLine size={14} />
            Edit Template
          </button>
        )}

        {/* Slide list (AC-1, AC-2) */}
        <div className="deck-template-detail__slides">
          <h3 className="deck-template-detail__slides-title">Slides</h3>
          {config.slides.length === 0 ? (
            <p className="deck-template-detail__empty">No slides configured</p>
          ) : (
            <div className="deck-template-detail__slide-list" role="list">
              {config.slides.map((slide) => (
                <SlideRow
                  key={slide.number}
                  slide={slide}
                  expanded={expandedSlides.has(slide.number)}
                  onToggle={() => toggleSlide(slide.number)}
                  templateId={templateId ?? undefined}
                  onPreviewSlide={onPreviewSlide}
                  onEditSlide={onEditSlide ? handleEditSlideClick : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* tm-3-4: Edit Slide inline panel (AC-2) — matches EditWithAiModal style */}
      {editModalOpen && editSlideFile && (
        <div className="edit-slide-panel">
          <div className="edit-slide-panel__header">
            <span className="edit-slide-panel__title">
              Edit with AI — {config.slides.find(s => s.file === editSlideFile)?.name ?? editSlideFile}
            </span>
            <button
              type="button"
              className="edit-slide-panel__close"
              onClick={handleEditSlideClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="edit-slide-panel__body">
            <textarea
              ref={editTextareaRef}
              className="edit-slide-panel__textarea"
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              onKeyDown={handleEditKeyDown}
              placeholder="Describe a layout change... (e.g., make two columns, move image right)"
            />
          </div>
          <div className="edit-slide-panel__footer">
            <button
              type="button"
              className="edit-slide-panel__submit"
              onClick={handleEditSlideSubmit}
              disabled={editInstruction.trim().length === 0}
              aria-label="Submit"
            >
              <Send size={14} />
              Submit
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default DeckTemplateDetail;
