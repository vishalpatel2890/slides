/**
 * BrandContextSection - Dynamic renderer for arbitrary brandContext data.
 *
 * Story Reference: bt-4-7 Tasks 1-4 — AC-31 through AC-38
 * Renders string, array, object, nested object, boolean, number, and null values
 * from theme.brandContext with type-appropriate editors.
 * Uses UPDATE_VALUE dispatch with brandContext.* dot-notation paths.
 * Enforces a 3-level depth limit (beyond 3, renders as formatted JSON).
 */

import React, { useState, useCallback } from 'react';
import { Trash2, Plus, ChevronDown } from 'lucide-react';
import { useThemeEditor } from '../context/ThemeEditorContext';

// =============================================================================
// Constants
// =============================================================================

const MAX_DEPTH = 3;
const LONG_STRING_THRESHOLD = 50;

// =============================================================================
// Props
// =============================================================================

export interface BrandContextSectionProps {
  brandContext: Record<string, unknown> | undefined;
}

// =============================================================================
// Shared Styles
// =============================================================================

const labelStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground)',
};

const inputStyle: React.CSSProperties = {
  color: 'var(--vscode-input-foreground, #cccccc)',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-input-border, #555555)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--vscode-sideBar-background, #252526)',
  border: '1px solid var(--vscode-panel-border, #333333)',
};

const buttonStyle: React.CSSProperties = {
  background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
  color: 'var(--vscode-button-secondaryForeground, #cccccc)',
  border: '1px solid var(--vscode-button-border, transparent)',
  cursor: 'pointer',
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: 'var(--vscode-errorForeground, #f48771)',
};

// =============================================================================
// Value Renderers
// =============================================================================

interface ValueRendererProps {
  value: unknown;
  path: string;
  depth: number;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}

/**
 * bt-4-7 Task 2.5: Beyond 3 levels, render as formatted JSON in read-only pre block.
 */
function JsonFallbackRenderer({ value, label }: { value: unknown; label?: string }): React.JSX.Element {
  return (
    <div className="flex flex-col mb-3">
      {label && (
        <span className="text-xs font-medium mb-1 opacity-60" style={labelStyle}>
          {label}
        </span>
      )}
      <pre
        className="text-xs px-2 py-1 rounded overflow-auto"
        style={{
          ...inputStyle,
          opacity: 0.8,
          maxHeight: '200px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

/**
 * bt-4-7 Task 2.1: String renderer — textarea for >50 chars, input otherwise.
 */
function StringRenderer({
  value,
  path,
  label,
  onUpdate,
  onDelete,
}: {
  value: string;
  path: string;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onUpdate(path, e.target.value);
    },
    [path, onUpdate],
  );

  const isLong = value.length > LONG_STRING_THRESHOLD;

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-center justify-between mb-1">
        {label && (
          <span className="text-xs font-medium opacity-60" style={labelStyle}>
            {label}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title={`Delete ${label || 'field'}`}
            aria-label={`Delete ${label || 'field'}`}
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1"
            style={dangerButtonStyle}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {isLong ? (
        <textarea
          className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
          style={inputStyle}
          value={value}
          onChange={handleChange}
          rows={3}
          aria-label={label || path}
        />
      ) : (
        <input
          type="text"
          className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
          style={inputStyle}
          value={value}
          onChange={handleChange}
          aria-label={label || path}
        />
      )}
    </div>
  );
}

/**
 * bt-4-7 Task 2.6: Number renderer — number input.
 */
function NumberRenderer({
  value,
  path,
  label,
  onUpdate,
  onDelete,
}: {
  value: number;
  path: string;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      onUpdate(path, isNaN(num) ? 0 : num);
    },
    [path, onUpdate],
  );

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-center justify-between mb-1">
        {label && (
          <span className="text-xs font-medium opacity-60" style={labelStyle}>
            {label}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title={`Delete ${label || 'field'}`}
            aria-label={`Delete ${label || 'field'}`}
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1"
            style={dangerButtonStyle}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <input
        type="number"
        className="text-sm px-2 py-1 rounded outline-none focus:ring-1"
        style={inputStyle}
        value={value}
        onChange={handleChange}
        aria-label={label || path}
      />
    </div>
  );
}

/**
 * bt-4-7 Task 2.6: Boolean renderer — checkbox.
 */
function BooleanRenderer({
  value,
  path,
  label,
  onUpdate,
  onDelete,
}: {
  value: boolean;
  path: string;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(path, e.target.checked);
    },
    [path, onUpdate],
  );

  return (
    <div className="flex items-center mb-3 gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={handleChange}
        aria-label={label || path}
      />
      {label && (
        <span className="text-xs font-medium opacity-60" style={labelStyle}>
          {label}
        </span>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={`Delete ${label || 'field'}`}
          aria-label={`Delete ${label || 'field'}`}
          className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1 ml-auto"
          style={dangerButtonStyle}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * bt-4-7 Task 2.2: Array renderer — editable list with add/remove buttons.
 */
function ArrayRenderer({
  value,
  path,
  depth,
  label,
  onUpdate,
  onDelete,
}: {
  value: unknown[];
  path: string;
  depth: number;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const handleItemChange = useCallback(
    (index: number, newValue: unknown) => {
      const updated = [...value];
      updated[index] = newValue;
      onUpdate(path, updated);
    },
    [value, path, onUpdate],
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index);
      onUpdate(path, updated);
    },
    [value, path, onUpdate],
  );

  const handleAddItem = useCallback(() => {
    onUpdate(path, [...value, '']);
  }, [value, path, onUpdate]);

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-center justify-between mb-1">
        {label && (
          <span className="text-xs font-medium opacity-60" style={labelStyle}>
            {label}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title={`Delete ${label || 'field'}`}
            aria-label={`Delete ${label || 'field'}`}
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1"
            style={dangerButtonStyle}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div className="pl-2 border-l-2" style={{ borderColor: 'var(--vscode-panel-border, #333333)' }}>
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="flex-1">
              {typeof item === 'string' ? (
                <input
                  type="text"
                  className="text-sm px-2 py-1 rounded outline-none focus:ring-1 w-full"
                  style={inputStyle}
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  aria-label={`${label || path} item ${index + 1}`}
                />
              ) : (
                <ValueRenderer
                  value={item}
                  path={`${path}.${index}`}
                  depth={depth + 1}
                  onUpdate={onUpdate}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              title={`Remove item ${index + 1}`}
              aria-label={`Remove ${label || 'list'} item ${index + 1}`}
              className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1 mt-1"
              style={dangerButtonStyle}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
          style={buttonStyle}
          aria-label={`Add item to ${label || 'list'}`}
        >
          <Plus size={12} /> Add item
        </button>
      </div>
    </div>
  );
}

/**
 * bt-4-7 Task 2.3, 2.4: Object renderer — key-value pairs with collapsible sub-cards.
 */
function ObjectRenderer({
  value,
  path,
  depth,
  label,
  onUpdate,
  onDelete,
}: {
  value: Record<string, unknown>;
  path: string;
  depth: number;
  label?: string;
  onUpdate: (path: string, value: unknown) => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col mb-3">
      <div
        className="flex items-center justify-between rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
        style={cardStyle}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        aria-expanded={expanded}
        aria-label={`${label || 'object'} section`}
      >
        <div className="flex items-center gap-1">
          <ChevronDown
            size={14}
            style={{
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s ease',
            }}
          />
          {label && (
            <span className="text-xs font-medium" style={labelStyle}>
              {label}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title={`Delete ${label || 'field'}`}
            aria-label={`Delete ${label || 'field'}`}
            className="flex items-center justify-center rounded hover:opacity-80 transition-opacity p-1"
            style={dangerButtonStyle}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {expanded && (
        <div
          className="pl-3 mt-1 border-l-2"
          style={{ borderColor: 'var(--vscode-panel-border, #333333)' }}
        >
          {Object.entries(value).map(([key, val]) => (
            <ValueRenderer
              key={key}
              value={val}
              path={`${path}.${key}`}
              depth={depth + 1}
              label={key}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * bt-4-7 Tasks 2.1-2.6: Master value renderer that delegates to type-specific renderers.
 * Enforces 3-level depth limit.
 */
function ValueRenderer({
  value,
  path,
  depth,
  label,
  onUpdate,
  onDelete,
}: ValueRendererProps): React.JSX.Element {
  // bt-4-7 Task 2.5: Beyond depth limit, render as formatted JSON
  if (depth >= MAX_DEPTH) {
    return <JsonFallbackRenderer value={value} label={label} />;
  }

  // bt-4-7 Task 2.6: null values render as empty string input
  if (value === null || value === undefined) {
    return (
      <StringRenderer
        value=""
        path={path}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // String
  if (typeof value === 'string') {
    return (
      <StringRenderer
        value={value}
        path={path}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // Number
  if (typeof value === 'number') {
    return (
      <NumberRenderer
        value={value}
        path={path}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <BooleanRenderer
        value={value}
        path={path}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // Array
  if (Array.isArray(value)) {
    return (
      <ArrayRenderer
        value={value}
        path={path}
        depth={depth}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // Object
  if (typeof value === 'object') {
    return (
      <ObjectRenderer
        value={value as Record<string, unknown>}
        path={path}
        depth={depth}
        label={label}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
  }

  // Fallback
  return <JsonFallbackRenderer value={value} label={label} />;
}

// =============================================================================
// Add Field Component
// =============================================================================

/**
 * bt-4-7 Task 3.1-3.4: Inline "Add Field" input for new top-level brandContext keys.
 */
function AddFieldButton({
  onAdd,
}: {
  onAdd: (key: string) => void;
}): React.JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');

  const handleConfirm = useCallback(() => {
    const trimmed = newKey.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewKey('');
      setIsAdding(false);
    }
  }, [newKey, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        setNewKey('');
        setIsAdding(false);
      }
    },
    [handleConfirm],
  );

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded hover:opacity-80 transition-opacity mt-2"
        style={buttonStyle}
        aria-label="Add Field"
      >
        <Plus size={14} /> Add Field
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        className="text-sm px-2 py-1 rounded outline-none focus:ring-1 flex-1"
        style={inputStyle}
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter field name..."
        aria-label="New field name"
        autoFocus
      />
      <button
        type="button"
        onClick={handleConfirm}
        className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
        style={{
          background: 'var(--vscode-button-background, #0e639c)',
          color: 'var(--vscode-button-foreground, #ffffff)',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Confirm add field"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setNewKey('');
          setIsAdding(false);
        }}
        className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
        style={buttonStyle}
        aria-label="Cancel add field"
      >
        Cancel
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * bt-4-7 Tasks 1-4: BrandContextSection component.
 *
 * AC-31: Renders in theme editor between Metadata and Colors.
 * AC-32: String values as textarea (>50 chars) or input.
 * AC-33: Arrays as editable lists with add/remove.
 * AC-34: Objects as key-value pairs.
 * AC-35: Nested objects as collapsible sub-cards.
 * AC-36: "Add Field" button for new top-level keys.
 * AC-37: Placeholder when brandContext is undefined/empty.
 * AC-38: All edits dispatch UPDATE_VALUE with brandContext.* paths.
 */
export function BrandContextSection({
  brandContext,
}: BrandContextSectionProps): React.JSX.Element {
  const { dispatch } = useThemeEditor();

  // bt-4-7 Task 4.2: All edits dispatch UPDATE_VALUE with brandContext.* dot-notation paths
  const handleUpdate = useCallback(
    (path: string, value: unknown) => {
      dispatch({ type: 'UPDATE_VALUE', path, value });
    },
    [dispatch],
  );

  // bt-4-7 Task 3.5: Delete a top-level key from brandContext
  const handleDeleteField = useCallback(
    (key: string) => {
      if (!brandContext) return;
      const updated = { ...brandContext };
      delete updated[key];
      dispatch({ type: 'UPDATE_VALUE', path: 'brandContext', value: updated });
    },
    [brandContext, dispatch],
  );

  // bt-4-7 Task 3.3-3.4: Add a new top-level field with empty string value
  const handleAddField = useCallback(
    (key: string) => {
      const current = brandContext || {};
      const updated = { ...current, [key]: '' };
      dispatch({ type: 'UPDATE_VALUE', path: 'brandContext', value: updated });
    },
    [brandContext, dispatch],
  );

  // bt-4-7 Task 1.3: Empty/undefined state — placeholder message (AC-37)
  if (!brandContext || Object.keys(brandContext).length === 0) {
    return (
      <div>
        <p
          className="text-sm opacity-60 mb-3"
          style={{ color: 'var(--vscode-editor-foreground)' }}
        >
          No brand context defined. Add context during brand setup or add fields manually.
        </p>
        <AddFieldButton onAdd={handleAddField} />
      </div>
    );
  }

  // bt-4-7 Tasks 2.1-2.6: Render each top-level key with appropriate renderer
  return (
    <div>
      {Object.entries(brandContext).map(([key, value]) => (
        <ValueRenderer
          key={key}
          value={value}
          path={`brandContext.${key}`}
          depth={1}
          label={key}
          onUpdate={handleUpdate}
          onDelete={() => handleDeleteField(key)}
        />
      ))}
      <AddFieldButton onAdd={handleAddField} />
    </div>
  );
}
