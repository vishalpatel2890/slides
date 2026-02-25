/**
 * KeyPointsEditor - Inline editable bullet list for slide key points.
 *
 * Story Reference: 20-3 - Key Points Inline Editor
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 *
 * Behaves like a Notion/Docs bullet list:
 * - Click text → inline edit
 * - Enter → save + create new point below + focus it
 * - Enter on empty → remove empty point, stop editing
 * - Escape → cancel edit
 * - Blur → save
 * - Alt+↑/↓ → reorder
 * - Delete key → remove point
 *
 * Uses optimistic local state for instant UI feedback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

// =============================================================================
// Props Interface
// =============================================================================

export interface KeyPointsEditorProps {
  /** Array of key point strings */
  points: string[];
  /** Callback when points array changes (full array replacement) */
  onChange: (points: string[]) => void;
}

// =============================================================================
// KeyPointsEditor Component
// =============================================================================

export function KeyPointsEditor({
  points,
  onChange,
}: KeyPointsEditorProps): React.ReactElement {
  // Optimistic local state — renders immediately, syncs from prop on slide switch
  const [localPoints, setLocalPoints] = useState<string[]>(points);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Guard against double-save from Enter (keydown) + blur firing on same edit
  const savePendingRef = useRef(false);

  // Sync from prop only when the points identity changes (slide switch, YAML round-trip)
  useEffect(() => {
    setLocalPoints(points);
  }, [points]);

  // Auto-focus input when editingIndex changes
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);

  // Helper: update local state optimistically AND notify parent
  const commitPoints = useCallback(
    (newPoints: string[]) => {
      setLocalPoints(newPoints);
      onChange(newPoints);
    },
    [onChange]
  );

  // Enter inline edit mode
  const startEditing = useCallback(
    (index: number) => {
      savePendingRef.current = false;
      setEditingIndex(index);
      setEditValue(localPoints[index] ?? '');
    },
    [localPoints]
  );

  // Core save logic — returns the new points array
  const doSave = useCallback((): string[] | null => {
    if (editingIndex === null) return null;
    if (savePendingRef.current) return null;
    savePendingRef.current = true;

    const trimmed = editValue.trim();
    const newPoints = [...localPoints];

    if (trimmed === '') {
      newPoints.splice(editingIndex, 1);
    } else {
      newPoints[editingIndex] = trimmed;
    }

    return newPoints;
  }, [editingIndex, editValue, localPoints]);

  // Save on blur (just save, don't advance)
  const handleBlur = useCallback(() => {
    const newPoints = doSave();
    if (newPoints === null) return;
    setEditingIndex(null);
    setEditValue('');
    commitPoints(newPoints);
    // Reset guard after React processes the batch
    requestAnimationFrame(() => { savePendingRef.current = false; });
  }, [doSave, commitPoints]);

  // Handle keyboard in edit input
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newPoints = doSave();
        if (newPoints === null) return;

        const trimmed = editValue.trim();
        if (trimmed === '') {
          // Enter on empty: remove the empty point, exit editing
          setEditingIndex(null);
          setEditValue('');
          commitPoints(newPoints);
        } else {
          // Enter with text: save, insert new empty below, edit it
          const insertIndex = editingIndex! + 1;
          newPoints.splice(insertIndex, 0, '');
          setLocalPoints(newPoints);
          onChange(newPoints);
          setEditingIndex(insertIndex);
          setEditValue('');
        }
        requestAnimationFrame(() => { savePendingRef.current = false; });
      } else if (e.key === 'Escape') {
        savePendingRef.current = true; // Prevent blur from saving
        setEditingIndex(null);
        setEditValue('');
        requestAnimationFrame(() => { savePendingRef.current = false; });
      } else if (e.key === 'Backspace' && editValue === '' && editingIndex !== null) {
        // Backspace on empty: remove point, edit previous
        e.preventDefault();
        const newPoints = [...localPoints];
        newPoints.splice(editingIndex, 1);
        savePendingRef.current = true;

        if (editingIndex > 0 && newPoints.length > 0) {
          // Edit previous point
          const prevIndex = editingIndex - 1;
          setLocalPoints(newPoints);
          onChange(newPoints);
          setEditingIndex(prevIndex);
          setEditValue(newPoints[prevIndex]);
        } else {
          // No previous point, just remove and exit
          setEditingIndex(null);
          setEditValue('');
          commitPoints(newPoints);
        }
        requestAnimationFrame(() => { savePendingRef.current = false; });
      }
    },
    [doSave, editValue, editingIndex, localPoints, onChange, commitPoints]
  );

  // Add new key point
  const addKeyPoint = useCallback(() => {
    const newPoints = [...localPoints, ''];
    setLocalPoints(newPoints);
    onChange(newPoints);
    setEditingIndex(newPoints.length - 1);
    setEditValue('');
  }, [localPoints, onChange]);

  // Move up
  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newPoints = [...localPoints];
      [newPoints[index - 1], newPoints[index]] = [newPoints[index], newPoints[index - 1]];
      commitPoints(newPoints);
      requestAnimationFrame(() => {
        itemRefs.current[index - 1]?.focus();
      });
    },
    [localPoints, commitPoints]
  );

  // Move down
  const moveDown = useCallback(
    (index: number) => {
      if (index >= localPoints.length - 1) return;
      const newPoints = [...localPoints];
      [newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]];
      commitPoints(newPoints);
      requestAnimationFrame(() => {
        itemRefs.current[index + 1]?.focus();
      });
    },
    [localPoints, commitPoints]
  );

  // Remove point
  const removePoint = useCallback(
    (index: number) => {
      const newPoints = localPoints.filter((_, i) => i !== index);
      commitPoints(newPoints);
    },
    [localPoints, commitPoints]
  );

  // Keyboard shortcuts on list items (not in edit mode)
  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        moveUp(index);
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        moveDown(index);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        removePoint(index);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(index);
      }
    },
    [moveUp, moveDown, removePoint, startEditing]
  );

  // =============================================================================
  // Empty State
  // =============================================================================

  if (localPoints.length === 0 && editingIndex === null) {
    return (
      <div
        className={cn(
          'border border-dashed border-[var(--border)]',
          'rounded-[var(--radius-sm)]',
          'p-4 text-center'
        )}
      >
        <button
          type="button"
          onClick={addKeyPoint}
          className={cn(
            'text-[13px] text-[var(--fg-muted)]',
            'hover:text-[var(--primary)]',
            'transition-colors duration-150',
            'cursor-pointer'
          )}
        >
          Add key point
        </button>
      </div>
    );
  }

  // =============================================================================
  // Key Points List
  // =============================================================================

  return (
    <div className="flex flex-col gap-1">
      {localPoints.map((point, index) => (
        <div
          key={index}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          tabIndex={editingIndex === index ? -1 : 0}
          onKeyDown={editingIndex === index ? undefined : (e) => handleItemKeyDown(e, index)}
          className={cn(
            'group flex items-center gap-2',
            'rounded-[var(--radius-sm)]',
            'py-1 px-1.5',
            'hover:bg-[var(--surface)]',
            'transition-colors duration-100',
            editingIndex !== index && 'focus:outline-none focus:ring-1 focus:ring-[var(--primary)]'
          )}
          aria-label={`Key point ${index + 1}: ${point}`}
        >
          {/* Bullet indicator */}
          <span
            className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)]"
            aria-hidden="true"
          />

          {/* Text content or edit input */}
          {editingIndex === index ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleEditKeyDown}
              className={cn(
                'flex-1 min-w-0',
                'text-[13px] text-[var(--fg)]',
                'bg-[var(--bg)] border border-[var(--border)]',
                'rounded-[var(--radius-sm)]',
                'px-2 py-0.5',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                'transition-shadow duration-150'
              )}
              placeholder="Type a key point..."
              aria-label={`Edit key point ${index + 1}`}
            />
          ) : (
            <span
              className={cn(
                'flex-1 min-w-0',
                'text-[13px] text-[var(--fg-secondary)]',
                'cursor-text',
                'truncate'
              )}
              onClick={() => startEditing(index)}
              role="button"
              tabIndex={-1}
              aria-label={`Click to edit key point ${index + 1}`}
            >
              {point}
            </span>
          )}

          {/* Hover action buttons */}
          {editingIndex !== index && (
            <div
              className={cn(
                'flex items-center gap-0.5',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-100'
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveUp(index);
                }}
                disabled={index === 0}
                className={cn(
                  'p-0.5 rounded',
                  'text-[var(--fg-muted)]',
                  'hover:text-[var(--fg)] hover:bg-[var(--bg)]',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'transition-colors duration-100'
                )}
                aria-label="Move up"
                title="Move up (Alt+↑)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveDown(index);
                }}
                disabled={index === localPoints.length - 1}
                className={cn(
                  'p-0.5 rounded',
                  'text-[var(--fg-muted)]',
                  'hover:text-[var(--fg)] hover:bg-[var(--bg)]',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'transition-colors duration-100'
                )}
                aria-label="Move down"
                title="Move down (Alt+↓)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePoint(index);
                }}
                className={cn(
                  'p-0.5 rounded',
                  'text-[var(--fg-muted)]',
                  'hover:text-red-500 hover:bg-[var(--bg)]',
                  'transition-colors duration-100'
                )}
                aria-label="Remove"
                title="Remove (Delete)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add key point button */}
      <button
        type="button"
        onClick={addKeyPoint}
        className={cn(
          'flex items-center gap-1.5',
          'mt-1 py-1.5 px-1.5',
          'text-[12px] text-[var(--fg-muted)]',
          'hover:text-[var(--primary)]',
          'rounded-[var(--radius-sm)]',
          'transition-colors duration-150',
          'cursor-pointer'
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        Add key point
      </button>
    </div>
  );
}
