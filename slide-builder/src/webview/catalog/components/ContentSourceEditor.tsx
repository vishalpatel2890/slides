/**
 * ContentSourceEditor - CRUD interface for content sources per slide.
 *
 * Story Reference: v4-1-6 AC-1, AC-2, AC-3, AC-4, AC-5
 *
 * AC-1: Content sources section lists all defined content_sources
 * AC-2: Add new source by selecting type from dropdown
 * AC-3: Edit source properties based on type
 * AC-4: Delete source from slide
 * AC-5: Saving persists to template-config.yaml
 */

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Database } from 'lucide-react';
import type { ContentSource } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ContentSourceEditorProps {
  /** Current content sources for the slide */
  sources: ContentSource[];
  /** Callback when sources are modified */
  onChange: (sources: ContentSource[]) => void;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
}

/** Content source type options */
const SOURCE_TYPES: Array<{ value: ContentSource['type']; label: string }> = [
  { value: 'web_search', label: 'Web Search' },
  { value: 'file', label: 'File' },
  { value: 'mcp_tool', label: 'MCP Tool' },
  { value: 'user_input', label: 'User Input' },
];

// =============================================================================
// Source property fields by type
// =============================================================================

interface FieldConfig {
  name: keyof ContentSource;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

const FIELDS_BY_TYPE: Record<ContentSource['type'], FieldConfig[]> = {
  web_search: [
    { name: 'query', label: 'Search Query', placeholder: 'e.g., {client_name} company overview' },
  ],
  file: [
    { name: 'path', label: 'File Path', placeholder: 'e.g., data/overview.md' },
  ],
  mcp_tool: [
    { name: 'tool', label: 'Tool Name', placeholder: 'e.g., fetch_company_data' },
  ],
  user_input: [
    { name: 'field', label: 'Field Name', placeholder: 'e.g., company_name' },
    { name: 'fallback', label: 'Fallback Instructions', placeholder: 'e.g., Ask user for company name' },
  ],
};

// =============================================================================
// SourceCard - Individual source editor
// =============================================================================

interface SourceCardProps {
  source: ContentSource;
  index: number;
  onChange: (index: number, source: ContentSource) => void;
  onDelete: (index: number) => void;
  readOnly?: boolean;
}

function SourceCard({ source, index, onChange, onDelete, readOnly }: SourceCardProps): React.ReactElement {
  const fields = FIELDS_BY_TYPE[source.type] || [];

  const handleFieldChange = useCallback(
    (fieldName: keyof ContentSource, value: string) => {
      onChange(index, { ...source, [fieldName]: value });
    },
    [source, index, onChange],
  );

  const handleTypeChange = useCallback(
    (newType: ContentSource['type']) => {
      // Reset type-specific fields when type changes
      const newSource: ContentSource = { type: newType };
      onChange(index, newSource);
    },
    [index, onChange],
  );

  return (
    <div className="content-source-editor__card" role="listitem">
      <div className="content-source-editor__card-header">
        {/* Type selector (AC-3) */}
        <select
          className="content-source-editor__type-select"
          value={source.type}
          onChange={(e) => handleTypeChange(e.target.value as ContentSource['type'])}
          disabled={readOnly}
          aria-label={`Source ${index + 1} type`}
        >
          {SOURCE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Delete button (AC-4) */}
        {!readOnly && (
          <button
            type="button"
            className="content-source-editor__delete-btn"
            onClick={() => onDelete(index)}
            aria-label={`Delete source ${index + 1}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Type-specific fields (AC-3) */}
      <div className="content-source-editor__fields">
        {fields.map((field) => (
          <div key={field.name} className="content-source-editor__field">
            <label className="content-source-editor__field-label">
              {field.label}
            </label>
            <input
              type="text"
              className="content-source-editor__field-input"
              value={(source[field.name] as string) || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={readOnly}
              aria-label={field.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ContentSourceEditor Component
// =============================================================================

export function ContentSourceEditor({
  sources,
  onChange,
  readOnly,
}: ContentSourceEditorProps): React.ReactElement {
  // Add new source (AC-2)
  const handleAdd = useCallback(() => {
    const newSource: ContentSource = { type: 'user_input' };
    onChange([...sources, newSource]);
  }, [sources, onChange]);

  // Update source at index (AC-3)
  const handleChange = useCallback(
    (index: number, source: ContentSource) => {
      const updated = [...sources];
      updated[index] = source;
      onChange(updated);
    },
    [sources, onChange],
  );

  // Delete source at index (AC-4)
  const handleDelete = useCallback(
    (index: number) => {
      const updated = sources.filter((_, i) => i !== index);
      onChange(updated);
    },
    [sources, onChange],
  );

  return (
    <div className="content-source-editor" role="region" aria-label="Content sources">
      <div className="content-source-editor__header">
        <span className="content-source-editor__title">
          <Database size={14} />
          Content Sources ({sources.length})
        </span>
        {!readOnly && (
          <button
            type="button"
            className="content-source-editor__add-btn"
            onClick={handleAdd}
            aria-label="Add content source"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Source list (AC-1) */}
      {sources.length === 0 ? (
        <p className="content-source-editor__empty">No content sources defined</p>
      ) : (
        <div className="content-source-editor__list" role="list">
          {sources.map((source, index) => (
            <SourceCard
              key={index}
              source={source}
              index={index}
              onChange={handleChange}
              onDelete={handleDelete}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentSourceEditor;
