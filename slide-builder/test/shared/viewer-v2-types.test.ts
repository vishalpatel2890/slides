import { describe, it, expect } from 'vitest';
import {
  isViewerV2ExtensionMessage,
  isViewerV2WebviewMessage,
  type ViewerV2ExtensionMessage,
  type ViewerV2WebviewMessage,
} from '../../src/shared/types';

/**
 * Unit tests for V2 viewer message type guards.
 * Story Reference: v2-1-1 Task 8.1
 */
describe('isViewerV2ExtensionMessage', () => {
  it('returns true for v2-deck-loaded message', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-deck-loaded',
      deck: {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slides: [],
        manifest: {
          deckId: 'test-deck',
          deckName: 'Test Deck',
          slideCount: 0,
          slides: [],
          generatedAt: '2026-02-18',
        },
        planPath: '/path/to/plan.yaml',
      },
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns true for v2-slide-updated message', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-slide-updated',
      slideNumber: 1,
      html: '<div>Updated</div>',
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns true for v2-error message', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-error',
      message: 'Something went wrong',
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns true for v2-rebuilding message', () => {
    const msg: ViewerV2ExtensionMessage = { type: 'v2-rebuilding' };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns true for v2-refreshed message', () => {
    const msg: ViewerV2ExtensionMessage = { type: 'v2-refreshed' };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns false for V1 message types', () => {
    const v1Msg = { type: 'deck-loaded', deck: {} };
    expect(isViewerV2ExtensionMessage(v1Msg)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isViewerV2ExtensionMessage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isViewerV2ExtensionMessage(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isViewerV2ExtensionMessage('v2-deck-loaded')).toBe(false);
  });

  it('returns false for object without type', () => {
    expect(isViewerV2ExtensionMessage({ deck: {} })).toBe(false);
  });

  it('returns false for unknown type', () => {
    expect(isViewerV2ExtensionMessage({ type: 'unknown-type' })).toBe(false);
  });

  // ae-1-1: v2-edit-started message type
  it('returns true for v2-edit-started message', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-edit-started',
      success: true,
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  it('returns true for v2-edit-started message with error', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-edit-started',
      success: false,
      error: 'Failed to start edit',
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });

  // tm-3-5: v2-template-context message type
  it('returns true for v2-template-context message', () => {
    const msg: ViewerV2ExtensionMessage = {
      type: 'v2-template-context',
      context: {
        templateId: 'my-template',
        slideFile: 'slides/slide-1.html',
        slideName: 'slide-1.html',
      },
    };
    expect(isViewerV2ExtensionMessage(msg)).toBe(true);
  });
});

describe('isViewerV2WebviewMessage', () => {
  it('returns true for v2-ready message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-ready' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-navigate message', () => {
    const msg: ViewerV2WebviewMessage = {
      type: 'v2-navigate',
      slideNumber: 3,
    };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-open-plan-editor message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-open-plan-editor' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-rebuild message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-rebuild' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-present message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-present' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-save-slide message', () => {
    const msg: ViewerV2WebviewMessage = {
      type: 'v2-save-slide',
      slideNumber: 2,
      html: '<div>Content</div>',
    };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-toggle-sidebar message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-toggle-sidebar' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns true for v2-toggle-fullscreen message', () => {
    const msg: ViewerV2WebviewMessage = { type: 'v2-toggle-fullscreen' };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  it('returns false for V1 message types', () => {
    const v1Msg = { type: 'ready' };
    expect(isViewerV2WebviewMessage(v1Msg)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isViewerV2WebviewMessage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isViewerV2WebviewMessage(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isViewerV2WebviewMessage('v2-ready')).toBe(false);
  });

  it('returns false for object without type', () => {
    expect(isViewerV2WebviewMessage({ slideNumber: 1 })).toBe(false);
  });

  it('returns false for unknown type', () => {
    expect(isViewerV2WebviewMessage({ type: 'unknown' })).toBe(false);
  });

  // ae-1-1: v2-edit-with-ai message type
  it('returns true for v2-edit-with-ai message', () => {
    const msg: ViewerV2WebviewMessage = {
      type: 'v2-edit-with-ai',
      instruction: 'make two columns',
      slideNumber: 1,
    };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });

  // tm-3-5: v2-submit-edit-form message type
  it('returns true for v2-submit-edit-form message', () => {
    const msg: ViewerV2WebviewMessage = {
      type: 'v2-submit-edit-form',
      operation: 'sb-manage:edit-deck-template',
      data: { changes: 'make header larger', templateId: 'my-template', slideFile: 'slides/slide-1.html' },
    };
    expect(isViewerV2WebviewMessage(msg)).toBe(true);
  });
});
