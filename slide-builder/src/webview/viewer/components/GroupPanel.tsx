import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus } from 'lucide-react';
import type { ViewerV2AnimationGroup } from '../../../shared/types';
import { GroupItem } from './GroupItem';

interface GroupPanelProps {
  groups: ViewerV2AnimationGroup[];
  onDeleteGroup: (groupId: string) => void;
  onReorderGroups: (reorderedGroups: ViewerV2AnimationGroup[]) => void;
  /** v2-4-2: Number of currently selected elements */
  selectedCount: number;
  /** v2-4-2: Handler to create group from selected elements */
  onCreateGroup: () => void;
  /** v2-4-4: Currently selected group ID for color coding */
  selectedGroupId?: string | null;
  /** v2-4-4: Handler when a group is clicked (toggle selection) */
  onSelectGroup?: (groupId: string) => void;
}

/**
 * GroupPanel — right-side panel listing animation groups.
 * v2-4-3 AC-1: 240px panel with group list (badge, count, drag handle, delete)
 * v2-4-3 AC-2,3: Delete with Radix Dialog confirmation
 * v2-4-3 AC-4: Drag-to-reorder groups via @dnd-kit
 * v2-4-3 AC-6: Empty state message
 * v2-4-3 AC-7: Responsive bottom sheet at <600px
 * v2-4-3 AC-8: ARIA role="complementary" + aria-label
 */
export function GroupPanel({
  groups,
  onDeleteGroup,
  onReorderGroups,
  selectedCount,
  onCreateGroup,
  selectedGroupId,
  onSelectGroup,
}: GroupPanelProps): React.ReactElement {
  const [deleteTarget, setDeleteTarget] = useState<ViewerV2AnimationGroup | null>(null);
  const [isBottomSheet, setIsBottomSheet] = useState(false);

  // Responsive: check if viewer width < 600px
  useEffect(() => {
    const checkWidth = () => {
      setIsBottomSheet(window.innerWidth < 600);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // @dnd-kit sensors — separate from ThumbnailSidebar (Risk R7)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable IDs prefixed with "group-" to avoid collision with sidebar's "slide-" IDs
  const sortableIds = groups.map((g) => `group-${g.id}`);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove([...groups], oldIndex, newIndex).map(
        (group, idx) => ({
          ...group,
          order: idx + 1,
          colorIndex: idx % 6,
        })
      );

      onReorderGroups(reordered);
    },
    [groups, sortableIds, onReorderGroups]
  );

  const handleDeleteClick = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) setDeleteTarget(group);
  }, [groups]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDeleteGroup(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteGroup]);

  const deleteTargetIndex = deleteTarget
    ? groups.findIndex((g) => g.id === deleteTarget.id) + 1
    : 0;

  return (
    <aside
      className={`group-panel${isBottomSheet ? ' group-panel--bottom-sheet' : ''}`}
      role="complementary"
      aria-label="Animation groups"
    >
      {/* v2-4-2: Header with title and selection count */}
      <div className="group-panel__header">
        <h3 className="group-panel__title">Animation Builder</h3>
        <span className="group-panel__selection-count">
          {selectedCount} selected
        </span>
      </div>

      {/* v2-4-2: Create Group button */}
      <div className="group-panel__create-section">
        <button
          type="button"
          className="group-panel__create-button"
          onClick={onCreateGroup}
          disabled={selectedCount === 0}
          aria-label={`Create animation group with ${selectedCount} elements`}
        >
          <Plus size={16} />
          Create Group
        </button>
        <p className="group-panel__hint">
          Press <kbd>Tab</kbd> to navigate, <kbd>Space</kbd> to select,{' '}
          <kbd>Enter</kbd> to create group
        </p>
      </div>

      {/* Divider */}
      <div className="group-panel__divider" />

      {/* Groups section header */}
      <div className="group-panel__section-header">
        <span className="group-panel__section-title">Groups</span>
        <span className="group-panel__count">{groups.length}</span>
      </div>

      {groups.length === 0 ? (
        /* AC-6: Empty state */
        <p className="group-panel__empty">
          No animation groups. Select elements and click Create Group.
        </p>
      ) : (
        /* Group list with DnD reorder */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="group-panel__list" role="list">
              {groups.map((group, index) => (
                <GroupItem
                  key={group.id}
                  group={group}
                  index={index}
                  onDelete={handleDeleteClick}
                  isSelected={selectedGroupId === group.id}
                  onSelect={onSelectGroup ? () => onSelectGroup(group.id) : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* AC-2: Delete confirmation dialog */}
      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="group-panel__dialog-overlay" />
          <Dialog.Content className="group-panel__dialog">
            <Dialog.Title className="group-panel__dialog-title">
              Delete Group {deleteTargetIndex}?
            </Dialog.Title>
            <Dialog.Description className="group-panel__dialog-description">
              {deleteTarget
                ? `${deleteTarget.elementIds.length} element${deleteTarget.elementIds.length !== 1 ? 's' : ''} will no longer animate.`
                : ''}
            </Dialog.Description>
            <div className="group-panel__dialog-actions">
              <Dialog.Close asChild>
                <button
                  className="group-panel__dialog-cancel"
                  autoFocus
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="group-panel__dialog-delete"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  );
}
