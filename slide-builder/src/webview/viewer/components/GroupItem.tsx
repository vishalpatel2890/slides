import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { ViewerV2AnimationGroup } from '../../../shared/types';

/**
 * Color palette for group badges (cycles through 6 colors).
 * Matches AnimationBuilder.tsx getGroupColor().
 */
export const GROUP_COLORS = [
  '#ec4899', // Pink
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
];

interface GroupItemProps {
  group: ViewerV2AnimationGroup;
  index: number;
  onDelete: (groupId: string) => void;
  /** v2-4-4: Whether this group is currently selected */
  isSelected?: boolean;
  /** v2-4-4: Handler when group row is clicked */
  onSelect?: () => void;
}

/**
 * GroupItem — individual group row in GroupPanel.
 * v2-4-3 AC-1: Numbered badge, element count, drag handle, delete button.
 * Uses @dnd-kit useSortable for drag-to-reorder.
 */
export function GroupItem({ group, index, onDelete, isSelected, onSelect }: GroupItemProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const badgeColor = GROUP_COLORS[group.colorIndex % GROUP_COLORS.length];

  // v2-4-4: Selected group styling — tinted background + left border accent
  const selectedStyle: React.CSSProperties = isSelected
    ? {
        backgroundColor: `${badgeColor}33`, // 20% opacity tint
        borderLeft: `3px solid ${badgeColor}`,
      }
    : {};

  const className = [
    'group-item',
    isDragging && 'group-item--dragging',
    isSelected && 'group-item--selected',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...selectedStyle }}
      className={className}
      role="listitem"
      onClick={onSelect}
    >
      {/* Drag handle — use div (not button) to avoid default behavior interfering with @dnd-kit */}
      <div
        className="group-item__handle"
        aria-label={`Drag to reorder group ${index + 1}`}
        role="button"
        tabIndex={0}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>

      {/* Numbered badge */}
      <span
        className="group-item__badge"
        style={{ backgroundColor: badgeColor }}
      >
        G{index + 1}
      </span>

      {/* Element count */}
      <span className="group-item__count">
        {group.elementIds.length} element{group.elementIds.length !== 1 ? 's' : ''}
      </span>

      {/* Delete button */}
      <button
        className="group-item__delete"
        onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
        aria-label={`Delete group ${index + 1}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
