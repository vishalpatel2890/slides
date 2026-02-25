/**
 * Shared menu item configuration arrays for Grid/List view parity.
 *
 * Story Reference: v3-2-2 Task 1 — Shared menu config (ADR-V3-002)
 *
 * Both Grid and List views consume these arrays so that new items
 * automatically appear in both views.
 */

export interface MenuItem {
  label: string;
  icon: string; // Lucide icon name
  action: string;
  variant?: 'destructive';
  disabled?: boolean;
  /** If true, item is only shown when condition is met */
  conditional?: boolean;
}

export interface MenuSeparator {
  type: 'separator';
}

export type MenuEntry = MenuItem | MenuSeparator;

export function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return 'type' in entry && entry.type === 'separator';
}

/**
 * Deck context menu items (matches DeckCard.tsx inline menu).
 * Note: "Move to Folder..." is conditional on folder availability.
 */
export const deckMenuItems: MenuEntry[] = [
  { label: 'Open', icon: 'MousePointerClick', action: 'open' },
  { label: 'Edit Plan', icon: 'FileEdit', action: 'edit-plan' },
  { type: 'separator' },
  { label: 'Present', icon: 'Play', action: 'present', disabled: true },
  { label: 'Duplicate', icon: 'Copy', action: 'duplicate' },
  { label: 'Rename', icon: 'Pencil', action: 'rename' },
  { label: 'Move to Folder…', icon: 'FolderInput', action: 'move-to-folder', conditional: true },
  { label: 'Delete', icon: 'Trash2', action: 'delete', variant: 'destructive' },
];

/**
 * Folder context menu items (matches FolderCard.tsx inline menu).
 */
export const folderMenuItems: MenuEntry[] = [
  { label: 'Open', icon: 'FolderOpen', action: 'open' },
  { label: 'Rename', icon: 'Pencil', action: 'rename' },
  { type: 'separator' },
  { label: 'Delete Folder', icon: 'Trash2', action: 'delete', variant: 'destructive' },
];

/**
 * Template context menu items.
 * Story v3-2-3: Added "Edit Template" for metadata editing (ADR-V3-002).
 */
export const templateMenuItems: MenuEntry[] = [
  { label: 'Preview', icon: 'Eye', action: 'preview' },
  { label: 'Edit Template', icon: 'Settings', action: 'edit-template' },
  { label: 'Use Template', icon: 'Plus', action: 'use-template' },
];
