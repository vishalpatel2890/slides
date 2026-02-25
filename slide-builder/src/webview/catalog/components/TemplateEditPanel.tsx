/**
 * TemplateEditPanel — Slide-in panel for editing slide template catalog fields.
 * Edits the fields stored in slide-templates.json: name, description, use_cases, background_mode.
 *
 * Story Reference: tm-1-1 (schema fields aligned to slide-templates.json)
 * Pattern Reference: AssetDetail.tsx (slide-in panel from right)
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Save, Trash2, Eye } from 'lucide-react';
import type { SlideTemplateSchema } from '../../../shared/types';
import { TagInput } from './TagInput';

export interface TemplateEditPanelProps {
  templateId: string;
  templateName: string;
  schema: {
    name: string;
    description: string;
    use_cases: string[];
    background_mode?: 'dark' | 'light';
  };
  onSave: (schema: SlideTemplateSchema) => void;
  onClose: () => void;
  /** tm-1-3: Optional delete handler — sends delete-slide-template message to extension host */
  onDelete?: () => void;
  /** Optional preview handler — sends preview request to extension host with templateId */
  onPreview?: (templateId: string) => void;
}

export function TemplateEditPanel({
  templateId,
  templateName,
  schema,
  onSave,
  onClose,
  onDelete,
  onPreview,
}: TemplateEditPanelProps): React.ReactElement {
  const [name, setName] = useState(schema.name);
  const [description, setDescription] = useState(schema.description);
  const [useCases, setUseCases] = useState<string[]>(schema.use_cases);
  const [backgroundMode, setBackgroundMode] = useState<'dark' | 'light'>(
    schema.background_mode ?? 'dark'
  );

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync state when props change (different template selected)
  useEffect(() => {
    setName(schema.name);
    setDescription(schema.description);
    setUseCases(schema.use_cases);
    setBackgroundMode(schema.background_mode ?? 'dark');
  }, [schema]);

  // Focus close button on mount for accessibility
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // ESC to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave({ name, description, use_cases: useCases, background_mode: backgroundMode });
  }, [name, description, useCases, backgroundMode, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(templateId);
  }, [templateId, onPreview]);

  return (
    <aside
      className="template-edit-panel"
      role="complementary"
      aria-label={`Edit template: ${templateName}`}
    >
      {/* Header */}
      <div className="template-edit-panel__header">
        <h2 className="template-edit-panel__title">{templateName}</h2>
        <div className="template-edit-panel__header-actions">
          {onPreview && (
            <button
              type="button"
              className="template-edit-panel__preview-btn"
              onClick={handlePreview}
              aria-label={`Preview template ${templateName}`}
            >
              <Eye size={12} />
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            className="template-edit-panel__close"
            onClick={onClose}
            aria-label="Close template editor"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Fields matching slide-templates.json schema */}
      <div className="template-edit-panel__content">
        <div className="template-edit-panel__field">
          <label htmlFor={`tep-name-${templateId}`} className="template-edit-panel__label">
            Name
          </label>
          <input
            id={`tep-name-${templateId}`}
            type="text"
            className="template-edit-panel__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name..."
          />
        </div>

        <div className="template-edit-panel__field">
          <label htmlFor={`tep-description-${templateId}`} className="template-edit-panel__label">
            Description
          </label>
          <textarea
            id={`tep-description-${templateId}`}
            className="template-edit-panel__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this template's purpose..."
            rows={3}
          />
        </div>

        <div className="template-edit-panel__field">
          <label className="template-edit-panel__label">Use Cases</label>
          <TagInput
            tags={useCases}
            onChange={setUseCases}
            placeholder="Add use case..."
            ariaLabel="Add template use case"
          />
        </div>

        <div className="template-edit-panel__field">
          <label htmlFor={`tep-bg-mode-${templateId}`} className="template-edit-panel__label">
            Background Mode
          </label>
          <select
            id={`tep-bg-mode-${templateId}`}
            className="template-edit-panel__select"
            value={backgroundMode}
            onChange={(e) => setBackgroundMode(e.target.value as 'dark' | 'light')}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="template-edit-panel__actions">
        {/* tm-1-3: Delete button — confirmation dialog shown by extension host */}
        {onDelete && (
          <button
            type="button"
            className="template-edit-panel__btn template-edit-panel__btn--danger"
            onClick={onDelete}
            aria-label={`Delete template ${templateName}`}
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
        <div className="template-edit-panel__actions-right">
          <button
            type="button"
            className="template-edit-panel__btn template-edit-panel__btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="template-edit-panel__btn template-edit-panel__btn--primary"
            onClick={handleSave}
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </aside>
  );
}
