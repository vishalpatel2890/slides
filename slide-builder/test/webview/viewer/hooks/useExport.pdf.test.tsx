/**
 * Tests for useExport PDF export functionality.
 * Story Reference: v2-5-4 AC-1 through AC-9, story-1.1 AC-1 through AC-8
 *
 * Tests the webview side of PDF export:
 * - Puppeteer pipeline integration (v2-capture-slide messages)
 * - jsPDF assembly with addImage/addPage
 * - Error handling (skip failed slides)
 * - Single-slide edge case
 * - State management (isExporting, exportProgress)
 * - story-1.1: JPEG capture with quality presets, compress flag, dynamic addImage format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useExport } from '../../../../src/webview/viewer/hooks/useExport';
import { ViewerProvider, useViewerDispatch } from '../../../../src/webview/viewer/context/ViewerContext';
import type { ViewerV2DeckContent } from '../../../../src/shared/types';

// Mock jsPDF
const mockAddPage = vi.fn();
const mockAddImage = vi.fn();
const mockOutput = vi.fn().mockReturnValue('data:application/pdf;base64,mockPdfData');

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addPage: mockAddPage,
    addImage: mockAddImage,
    output: mockOutput,
  })),
}));

// Mock VS Code API
const mockPostMessage = vi.fn();
vi.mock('../../../../src/webview/viewer/hooks/useVsCodeApi', () => ({
  useVsCodeApi: () => ({
    postMessage: mockPostMessage,
  }),
}));

// Create deck content for tests
function createMockDeck(slideCount: number, deckName = 'test-deck'): ViewerV2DeckContent {
  const slides = Array.from({ length: slideCount }, (_, i) => ({
    number: i + 1,
    html: `<html>Slide ${i + 1}</html>`,
    fileName: `slide-${i + 1}.html`,
    slideId: `slide-${i + 1}`,
    title: `Slide ${i + 1}`,
  }));

  return {
    deckId: 'test-deck',
    deckName,
    slides,
    manifest: {
      deckId: 'test-deck',
      deckName,
      slideCount,
      slides: slides.map((s) => ({ number: s.number, fileName: s.fileName, title: s.title })),
      generatedAt: '2026-02-20',
    },
    planPath: '/path/to/plan.yaml',
  };
}

// Wrapper component that sets up state via dispatch
function TestWrapper({
  children,
  deck,
}: {
  children: React.ReactNode;
  deck: ViewerV2DeckContent;
}) {
  return (
    <ViewerProvider>
      <StateSetup deck={deck}>{children}</StateSetup>
    </ViewerProvider>
  );
}

// Helper component to set up state via useEffect
function StateSetup({
  children,
  deck,
}: {
  children: React.ReactNode;
  deck: ViewerV2DeckContent;
}) {
  const dispatch = useViewerDispatch();
  React.useEffect(() => {
    dispatch({ type: 'SET_DECK_CONTENT', deck });
  }, [dispatch, deck]);
  return <>{children}</>;
}

// Simulate v2-capture-result message from extension
function simulateCaptureResult(requestId: string, dataUri: string, delay = 5) {
  setTimeout(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'v2-capture-result',
          requestId,
          dataUri,
        },
      })
    );
  }, delay);
}

// Simulate v2-capture-error message from extension
function simulateCaptureError(requestId: string, error: string, delay = 5) {
  setTimeout(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'v2-capture-error',
          requestId,
          error,
        },
      })
    );
  }, delay);
}

describe('useExport PDF export (v2-5-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock to intercept v2-capture-slide and auto-respond
    mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
      if (msg.type === 'v2-capture-slide' && msg.requestId) {
        simulateCaptureResult(msg.requestId as string, `data:image/png;base64,mockPng-${msg.requestId}`);
      }
    });
  });

  afterEach(() => {
    // Use clearAllMocks instead of restoreAllMocks to preserve vi.mock() factory implementations
    vi.clearAllMocks();
  });

  describe('Puppeteer pipeline integration (AC-1, AC-3)', () => {
    it('should send v2-capture-slide messages for each slide sequentially', async () => {
      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      // Wait for state setup
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      // Should have sent 3 capture requests (one per slide)
      const captureMessages = mockPostMessage.mock.calls.filter(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-capture-slide'
      );
      expect(captureMessages.length).toBe(3);

      // Each should have unique requestId
      const requestIds = captureMessages.map(([msg]: [Record<string, unknown>]) => msg.requestId);
      expect(new Set(requestIds).size).toBe(3); // All unique
    });

    it('should not export when slides array is empty', async () => {
      const deck = createMockDeck(0);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      // No capture messages should be sent for empty deck
      const captureMessages = mockPostMessage.mock.calls.filter(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-capture-slide'
      );
      expect(captureMessages.length).toBe(0);
    });
  });

  describe('jsPDF assembly (AC-4)', () => {
    it('should create jsPDF with landscape orientation and 1920x1080 format', async () => {
      const { jsPDF } = await import('jspdf');
      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      // story-1.1 AC-5: compress: true always set
      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
        compress: true,
      });
    });

    it('should call addImage for each captured slide', async () => {
      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mockAddImage).toHaveBeenCalledTimes(3);
      // Each call should use PNG format and full dimensions
      mockAddImage.mock.calls.forEach(([dataUri, format, x, y, w, h]) => {
        expect(dataUri).toContain('data:image/png;base64,');
        expect(format).toBe('PNG');
        expect(x).toBe(0);
        expect(y).toBe(0);
        expect(w).toBe(1920);
        expect(h).toBe(1080);
      });
    });

    it('should call addPage between slides but not before first', async () => {
      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      // 3 slides = 2 addPage calls (between slides 1-2 and 2-3)
      expect(mockAddPage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Single-slide edge case (AC-9)', () => {
    it('should not call addPage for single-slide deck', async () => {
      const deck = createMockDeck(1);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mockAddPage).not.toHaveBeenCalled();
      expect(mockAddImage).toHaveBeenCalledTimes(1);
    });
  });

  describe('File export message (AC-5)', () => {
    it('should send v2-export-file with format pdf and deckName.pdf filename', async () => {
      const deck = createMockDeck(2, 'my-presentation');
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      const exportMessage = mockPostMessage.mock.calls.find(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-export-file'
      );
      expect(exportMessage).toBeDefined();
      expect(exportMessage![0]).toMatchObject({
        type: 'v2-export-file',
        format: 'pdf',
        fileName: 'my-presentation.pdf',
      });
    });
  });

  describe('Error handling (AC-8)', () => {
    it('should skip failed slides and continue with remaining', async () => {
      // Make second slide capture fail
      let captureCount = 0;
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          captureCount++;
          if (captureCount === 2) {
            simulateCaptureError(msg.requestId as string, 'Capture failed');
          } else {
            simulateCaptureResult(msg.requestId as string, `data:image/png;base64,mockPng-${captureCount}`);
          }
        }
      });

      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      // Should still send export message
      const exportMessage = mockPostMessage.mock.calls.find(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-export-file'
      );
      expect(exportMessage).toBeDefined();

      // Should only have 2 images (slide 1 and 3, skipping failed slide 2)
      expect(mockAddImage).toHaveBeenCalledTimes(2);
      // Should only have 1 addPage (between the 2 successful slides)
      expect(mockAddPage).toHaveBeenCalledTimes(1);
    });

    it('should log error count when slides fail', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Make first slide fail
      let captureCount = 0;
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          captureCount++;
          if (captureCount === 1) {
            simulateCaptureError(msg.requestId as string, 'First slide failed');
          } else {
            simulateCaptureResult(msg.requestId as string, `data:image/png;base64,mockPng`);
          }
        }
      });

      const deck = createMockDeck(3);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exported 2 of 3 slides (1 failed)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('State management (AC-2, AC-7)', () => {
    it('should reset isExporting after export completes', async () => {
      const deck = createMockDeck(2);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(result.current.isExporting).toBe(false);

      await act(async () => {
        await result.current.exportPdf();
      });

      // Should be done
      expect(result.current.isExporting).toBe(false);
    });

    it('should reset isExporting on error', async () => {
      // Make all captures fail
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          simulateCaptureError(msg.requestId as string, 'All failed');
        }
      });

      const deck = createMockDeck(2);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(result.current.isExporting).toBe(false);
    });
  });

  // ==========================================================================
  // story-1.1: JPEG capture and PDF compression tests
  // ==========================================================================

  describe('JPEG capture with standard preset (story-1.1 AC-1, AC-3)', () => {
    it('should send captureOptions with jpeg format and quality 82 for standard preset', async () => {
      const deck = createMockDeck(2);
      // Respond to capture messages with JPEG data URIs
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          simulateCaptureResult(msg.requestId as string, `data:image/jpeg;base64,mockJpeg-${msg.requestId}`);
        }
      });

      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf('standard');
      });

      // Verify captureOptions passed in messages
      const captureMessages = mockPostMessage.mock.calls.filter(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-capture-slide'
      );
      expect(captureMessages.length).toBe(2);
      captureMessages.forEach(([msg]: [Record<string, unknown>]) => {
        expect(msg.captureOptions).toEqual({ format: 'jpeg', quality: 82 });
      });
    });
  });

  describe('JPEG addImage format (story-1.1 AC-6)', () => {
    it('should use JPEG format in addImage when standard preset is used', async () => {
      const deck = createMockDeck(2);
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          simulateCaptureResult(msg.requestId as string, `data:image/jpeg;base64,mockJpeg-${msg.requestId}`);
        }
      });

      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf('standard');
      });

      // addImage should use 'JPEG' format
      expect(mockAddImage).toHaveBeenCalledTimes(2);
      mockAddImage.mock.calls.forEach(([_dataUri, format]: [string, string]) => {
        expect(format).toBe('JPEG');
      });
    });

    it('should use PNG format in addImage when best preset is used', async () => {
      const deck = createMockDeck(2);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf('best');
      });

      // addImage should use 'PNG' format for best preset
      expect(mockAddImage).toHaveBeenCalledTimes(2);
      mockAddImage.mock.calls.forEach(([_dataUri, format]: [string, string]) => {
        expect(format).toBe('PNG');
      });
    });
  });

  describe('PNG backward compatibility with no preset (story-1.1 AC-2, AC-4)', () => {
    it('should not include captureOptions when no preset is provided', async () => {
      const deck = createMockDeck(2);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      const captureMessages = mockPostMessage.mock.calls.filter(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-capture-slide'
      );
      captureMessages.forEach(([msg]: [Record<string, unknown>]) => {
        expect(msg.captureOptions).toBeUndefined();
      });
    });

    it('should use PNG format in addImage when no preset is provided', async () => {
      const deck = createMockDeck(2);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf();
      });

      mockAddImage.mock.calls.forEach(([_dataUri, format]: [string, string]) => {
        expect(format).toBe('PNG');
      });
    });
  });

  describe('jsPDF compression (story-1.1 AC-5)', () => {
    it('should always set compress: true in jsPDF constructor', async () => {
      const { jsPDF } = await import('jspdf');
      const deck = createMockDeck(1);
      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf('standard');
      });

      expect(jsPDF).toHaveBeenCalledWith(
        expect.objectContaining({ compress: true })
      );
    });
  });

  describe('Compact preset (story-1.1 AC-1)', () => {
    it('should send captureOptions with jpeg format and quality 65 for compact preset', async () => {
      const deck = createMockDeck(1);
      mockPostMessage.mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'v2-capture-slide' && msg.requestId) {
          simulateCaptureResult(msg.requestId as string, `data:image/jpeg;base64,mockJpeg`);
        }
      });

      const { result } = renderHook(() => useExport(), {
        wrapper: ({ children }) => <TestWrapper deck={deck}>{children}</TestWrapper>,
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.exportPdf('compact');
      });

      const captureMessages = mockPostMessage.mock.calls.filter(
        ([msg]: [Record<string, unknown>]) => msg.type === 'v2-capture-slide'
      );
      expect(captureMessages[0][0].captureOptions).toEqual({ format: 'jpeg', quality: 65 });
    });
  });
});
