/**
 * Tests for Viewer type guards.
 *
 * Story Reference: cv-2-1 Task 1.5
 */

import { describe, it, expect } from 'vitest';
import {
  isViewerExtensionMessage,
  isViewerWebviewMessage,
} from '../../src/shared/types';

describe('isViewerExtensionMessage', () => {
  it('returns true for deck-loaded message', () => {
    expect(
      isViewerExtensionMessage({
        type: 'deck-loaded',
        deck: { deckId: 'test', deckName: 'Test', slideCount: 3, viewerHtmlUri: '', slides: [], planPath: '' },
      })
    ).toBe(true);
  });

  it('returns true for error message', () => {
    expect(
      isViewerExtensionMessage({ type: 'error', message: 'something failed' })
    ).toBe(true);
  });

  it('returns false for non-viewer message types', () => {
    expect(isViewerExtensionMessage({ type: 'plan-updated' })).toBe(false);
    expect(isViewerExtensionMessage({ type: 'catalog-data' })).toBe(false);
  });

  it('returns false for null, undefined, primitives', () => {
    expect(isViewerExtensionMessage(null)).toBe(false);
    expect(isViewerExtensionMessage(undefined)).toBe(false);
    expect(isViewerExtensionMessage('deck-loaded')).toBe(false);
    expect(isViewerExtensionMessage(42)).toBe(false);
  });

  it('returns false for objects without type', () => {
    expect(isViewerExtensionMessage({})).toBe(false);
    expect(isViewerExtensionMessage({ data: 'test' })).toBe(false);
  });
});

describe('isViewerWebviewMessage', () => {
  it('returns true for ready message', () => {
    expect(isViewerWebviewMessage({ type: 'ready' })).toBe(true);
  });

  it('returns true for navigate message', () => {
    expect(
      isViewerWebviewMessage({ type: 'navigate', slideNumber: 3 })
    ).toBe(true);
  });

  it('returns true for open-plan-editor message', () => {
    expect(isViewerWebviewMessage({ type: 'open-plan-editor' })).toBe(true);
  });

  it('returns true for present message', () => {
    expect(isViewerWebviewMessage({ type: 'present' })).toBe(true);
  });

  it('returns true for rebuild message', () => {
    expect(isViewerWebviewMessage({ type: 'rebuild' })).toBe(true);
  });

  it('returns false for non-viewer message types', () => {
    expect(isViewerWebviewMessage({ type: 'edit-slide' })).toBe(false);
    expect(isViewerWebviewMessage({ type: 'add-slide' })).toBe(false);
  });

  it('returns false for null, undefined, primitives', () => {
    expect(isViewerWebviewMessage(null)).toBe(false);
    expect(isViewerWebviewMessage(undefined)).toBe(false);
    expect(isViewerWebviewMessage('ready')).toBe(false);
  });
});
