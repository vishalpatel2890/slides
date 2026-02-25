/**
 * Tests for shared menu item configuration.
 * Story Reference: v3-2-2 Task 1 — Shared menu config (ADR-V3-002)
 */

import { describe, it, expect } from 'vitest';
import {
  deckMenuItems,
  folderMenuItems,
  templateMenuItems,
  isSeparator,
  type MenuItem,
  type MenuSeparator,
  type MenuEntry,
} from '../../src/webview/catalog/components/menuItems';

describe('menuItems', () => {
  describe('isSeparator', () => {
    it('returns true for separator entries', () => {
      const sep: MenuSeparator = { type: 'separator' };
      expect(isSeparator(sep)).toBe(true);
    });

    it('returns false for menu item entries', () => {
      const item: MenuItem = { label: 'Open', icon: 'Eye', action: 'open' };
      expect(isSeparator(item)).toBe(false);
    });
  });

  describe('deckMenuItems', () => {
    it('contains Open, Edit Plan, Present, Duplicate, Rename, Move to Folder, Delete', () => {
      const labels = deckMenuItems.filter((e) => !isSeparator(e)).map((e) => (e as MenuItem).label);
      expect(labels).toEqual([
        'Open',
        'Edit Plan',
        'Present',
        'Duplicate',
        'Rename',
        'Move to Folder…',
        'Delete',
      ]);
    });

    it('has Present marked as disabled', () => {
      const present = deckMenuItems.find(
        (e) => !isSeparator(e) && (e as MenuItem).label === 'Present',
      ) as MenuItem;
      expect(present.disabled).toBe(true);
    });

    it('has Delete marked as destructive', () => {
      const del = deckMenuItems.find(
        (e) => !isSeparator(e) && (e as MenuItem).label === 'Delete',
      ) as MenuItem;
      expect(del.variant).toBe('destructive');
    });

    it('has Move to Folder marked as conditional', () => {
      const move = deckMenuItems.find(
        (e) => !isSeparator(e) && (e as MenuItem).label === 'Move to Folder…',
      ) as MenuItem;
      expect(move.conditional).toBe(true);
    });

    it('contains at least one separator', () => {
      expect(deckMenuItems.some(isSeparator)).toBe(true);
    });
  });

  describe('folderMenuItems', () => {
    it('contains Open, Rename, Delete Folder', () => {
      const labels = folderMenuItems
        .filter((e) => !isSeparator(e))
        .map((e) => (e as MenuItem).label);
      expect(labels).toEqual(['Open', 'Rename', 'Delete Folder']);
    });

    it('has Delete Folder marked as destructive', () => {
      const del = folderMenuItems.find(
        (e) => !isSeparator(e) && (e as MenuItem).label === 'Delete Folder',
      ) as MenuItem;
      expect(del.variant).toBe('destructive');
    });
  });

  describe('templateMenuItems', () => {
    it('contains Preview, Edit Template, and Use Template (AC v3-2-3)', () => {
      const labels = templateMenuItems
        .filter((e) => !isSeparator(e))
        .map((e) => (e as MenuItem).label);
      expect(labels).toEqual(['Preview', 'Edit Template', 'Use Template']);
    });

    it('has Edit Template with Settings icon and edit-template action (v3-2-3 AC-1, AC-2)', () => {
      const editItem = templateMenuItems.find(
        (e) => !isSeparator(e) && (e as MenuItem).label === 'Edit Template',
      ) as MenuItem;
      expect(editItem).toBeDefined();
      expect(editItem.icon).toBe('Settings');
      expect(editItem.action).toBe('edit-template');
    });
  });
});
