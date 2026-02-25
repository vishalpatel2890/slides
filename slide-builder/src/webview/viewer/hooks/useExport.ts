import { useCallback, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from './useVsCodeApi';
import type { ExportProgress, CaptureOptions, PdfQualityPreset } from '../../../shared/types';
import { PDF_QUALITY_PRESETS } from '../../../shared/types';

/**
 * Return type for the useExport hook.
 * Manages export capture pipeline for PNG and PDF.
 */
export interface UseExportReturn {
  exportCurrentPng: () => Promise<void>;
  exportAllPng: () => Promise<void>;
  exportPdf: (preset?: PdfQualityPreset) => Promise<void>;
  isExporting: boolean;
  exportProgress: ExportProgress | null;
}

/** Capture request timeout (ms) */
const CAPTURE_TIMEOUT_MS = 30_000;

/** Auto-incrementing request ID counter */
let requestIdCounter = 0;

/**
 * Wait for folder selection response from the extension host.
 * Resolves true if a folder was selected, false if cancelled.
 */
function waitForFolderSelection(): Promise<boolean> {
  return new Promise((resolve) => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string') return;
      if (msg.type === 'v2-export-folder-ready') {
        window.removeEventListener('message', handleMessage);
        resolve(true);
      } else if (msg.type === 'v2-export-cancelled') {
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }
    }
    window.addEventListener('message', handleMessage);
  });
}

/**
 * Adapt slide CSS for export capture.
 * No longer used in the main capture path (Puppeteer renders natively),
 * but kept as an exported utility for API compatibility and tests.
 */
export function adaptCssForExport(html: string): string {
  return html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_match, openTag: string, cssContent: string, closeTag: string) => {
      let adapted = cssContent;

      // v2-5-2: Handle compound selectors - "html, body {" or "body, html {"
      adapted = adapted.replace(/\bhtml\s*,\s*body\s*\{/g, '.export-root {');
      adapted = adapted.replace(/\bbody\s*,\s*html\s*\{/g, '.export-root {');

      // v2-5-2: Handle descendant selectors - "html body {" or "html > body {"
      adapted = adapted.replace(/\bhtml\s+body\s*\{/g, '.export-root {');
      adapted = adapted.replace(/\bhtml\s*>\s*body\s*\{/g, '.export-root {');

      // v2-5-2: Handle :root body patterns
      adapted = adapted.replace(/:root\s+body\s*\{/g, '.export-root {');
      adapted = adapted.replace(/:root\s*>\s*body\s*\{/g, '.export-root {');

      // v2-5-2: Handle :root for CSS custom properties (CRITICAL for formatting!)
      adapted = adapted.replace(/:root\s*\{/g, '.export-root {');

      // v2-5-2: Handle body with descendants - "body > " or "body ."
      adapted = adapted.replace(/\bbody\s*>\s*/g, '.export-root > ');
      adapted = adapted.replace(/\bbody\s+\./g, '.export-root .');
      adapted = adapted.replace(/\bbody\s+#/g, '.export-root #');

      // v2-5-2: Handle html with descendants - "html > " or "html ."
      adapted = adapted.replace(/\bhtml\s*>\s*(?!body)/g, '.export-root > ');
      adapted = adapted.replace(/\bhtml\s+\.(?!export-root)/g, '.export-root .');
      adapted = adapted.replace(/\bhtml\s+#/g, '.export-root #');

      // Original simple selectors (must come last to avoid double-rewriting)
      adapted = adapted.replace(/\bhtml\s*\{/g, '.export-root {');
      // v2-5-2: Match viewer's adaptCssForShadowDom - body styles must go to .slide element
      // (same as viewer uses: body → .slide, [data-slide-id])
      // Also keep .export-root for background coverage on the container
      adapted = adapted.replace(/\bbody\s*\{/g, '.export-root, .export-root .slide, .export-root [data-slide-id] {');

      return openTag + adapted + closeTag;
    }
  );
}

/**
 * Request the extension host to capture a slide via Puppeteer (headless Chromium).
 * Sends the HTML, waits for a v2-capture-result or v2-capture-error response.
 *
 * This replaces all client-side capture approaches (html2canvas, html-to-image)
 * which couldn't reliably handle CSS custom properties and web fonts in the
 * VSCode webview's sandboxed CSP environment.
 *
 * @param html - Complete HTML document string for the slide
 * @param postMessageFn - Function to send messages to the extension host
 * @param captureOptions - Optional format/quality options (story-1.1 AC-1,3)
 * @returns Promise resolving to image data URI (PNG or JPEG)
 */
function requestCaptureFromHost(
  html: string,
  postMessageFn: (msg: Record<string, unknown>) => void,
  captureOptions?: CaptureOptions
): Promise<string> {
  const requestId = `capture-${++requestIdCounter}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error(`Capture timed out after ${CAPTURE_TIMEOUT_MS}ms`));
    }, CAPTURE_TIMEOUT_MS);

    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'v2-capture-result' && msg.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        resolve(msg.dataUri);
      } else if (msg.type === 'v2-capture-error' && msg.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        reject(new Error(msg.error || 'Capture failed'));
      }
    }

    window.addEventListener('message', handleMessage);
    postMessageFn({ type: 'v2-capture-slide', requestId, html, ...(captureOptions ? { captureOptions } : {}) });
  });
}

/**
 * Hook managing export capture logic for PNG and PDF.
 * Delegates slide capture to the extension host (Puppeteer/headless Chromium)
 * for pixel-perfect rendering. jsPDF assembles multi-page PDFs client-side.
 *
 * Architecture References:
 * - ADR-004: Puppeteer server-side capture + jsPDF client-side PDF assembly
 * - ADR-005: All slide content in memory (no additional file reads needed)
 * - ADR-008: v2- message prefix convention
 */
export function useExport(): UseExportReturn {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();
  const [isExporting, setIsExporting] = useState(false);
  const isExportingRef = useRef(false);

  /**
   * Capture a single slide as image data URI (PNG or JPEG).
   * story-1.1 AC-1,3: Sends HTML with optional captureOptions to extension host.
   */
  const captureSlide = useCallback(async (html: string, captureOptions?: CaptureOptions): Promise<string> => {
    return requestCaptureFromHost(html, postMessage, captureOptions);
  }, [postMessage]);

  /**
   * Export current slide as PNG.
   * v2-5-1 AC-2,3,4: Single slide capture at 1920x1080, sent to extension for save dialog.
   * v2-5-2 AC-4: Include deckId for default save path.
   */
  const exportCurrentPng = useCallback(async () => {
    if (isExportingRef.current || state.mode !== 'presentation') return;
    const currentSlideData = state.slides[state.currentSlide - 1];
    if (!currentSlideData) return;

    isExportingRef.current = true;
    setIsExporting(true);

    try {
      const dataUri = await captureSlide(currentSlideData.html);
      postMessage({
        type: 'v2-export-file',
        format: 'png',
        data: dataUri,
        fileName: `slide-${state.currentSlide}.png`,
        deckId: state.deckId ?? undefined,
      });
    } catch (error) {
      console.error('[V2 Export] Single PNG capture failed:', error);
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [state.slides, state.currentSlide, state.mode, state.deckId, captureSlide, postMessage]);

  /**
   * Export all slides as individual PNGs to a user-selected folder.
   * v2-5-1 AC-5,6,7,8: Folder picker first (handshake), then batch capture with progress.
   */
  const exportAllPng = useCallback(async () => {
    if (isExportingRef.current || state.mode !== 'presentation') return;
    if (state.slides.length === 0) return;

    isExportingRef.current = true;
    setIsExporting(true);

    try {
      // Step 1: Request folder selection from extension and wait for response
      postMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: `batch-${state.slides.length}`,
      });

      const folderSelected = await waitForFolderSelection();
      if (!folderSelected) {
        return;
      }

      // Step 2: Capture and send each slide to the selected folder
      let errorCount = 0;

      for (let i = 0; i < state.slides.length; i++) {
        const slide = state.slides[i];
        const progress: ExportProgress = {
          current: i + 1,
          total: state.slides.length,
          format: 'png',
        };
        dispatch({ type: 'SET_EXPORT_PROGRESS', progress });

        try {
          const dataUri = await captureSlide(slide.html);
          postMessage({
            type: 'v2-export-file',
            format: 'png',
            data: dataUri,
            fileName: `slide-${i + 1}.png`,
          });
        } catch (error) {
          console.error(`[V2 Export] Batch PNG: skipped slide-${i + 1}:`, error);
          errorCount++;
        }
      }

      // v2-5-3: Signal batch complete to extension host so it clears batchExportFolder
      postMessage({
        type: 'v2-batch-complete',
        total: state.slides.length,
        errorCount,
      });

      if (errorCount > 0) {
        console.warn(`[V2 Export] Batch PNG: exported ${state.slides.length - errorCount} of ${state.slides.length} (${errorCount} failed)`);
      }
    } finally {
      dispatch({ type: 'CLEAR_EXPORT_PROGRESS' });
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [state.slides, state.mode, captureSlide, dispatch, postMessage]);

  /**
   * Export all slides as a single multi-page PDF.
   * v2-5-1 AC-9,10,11: Landscape PDF at 1920x1080 per page via jsPDF.
   * v2-5-4: Fixed error handling to skip failed slides (no blank pages).
   * story-1.1 AC-1,5,6: JPEG capture support with compression and dynamic format.
   */
  const exportPdf = useCallback(async (preset?: PdfQualityPreset) => {
    if (isExportingRef.current || state.mode !== 'presentation') return;
    if (state.slides.length === 0) return;

    isExportingRef.current = true;
    setIsExporting(true);

    // story-1.1 AC-1,6: Resolve preset to capture options
    const presetConfig = preset ? PDF_QUALITY_PRESETS[preset] : undefined;
    const captureOptions: CaptureOptions | undefined = presetConfig
      ? { format: presetConfig.format, ...(presetConfig.quality != null ? { quality: presetConfig.quality } : {}) }
      : undefined;
    // story-1.1 AC-6: Determine addImage format based on capture options
    const imageFormat = captureOptions?.format === 'jpeg' ? 'JPEG' : 'PNG';

    try {
      // v2-5-4: Track successful captures and errors separately
      const capturedDataUris: string[] = [];
      let errorCount = 0;

      // Step 1: Capture all slides via Puppeteer, collect successful results
      for (let i = 0; i < state.slides.length; i++) {
        const slide = state.slides[i];
        const progress: ExportProgress = {
          current: i + 1,
          total: state.slides.length,
          format: 'pdf',
          preset,
        };
        dispatch({ type: 'SET_EXPORT_PROGRESS', progress });

        try {
          const dataUri = await captureSlide(slide.html, captureOptions);
          capturedDataUris.push(dataUri);
        } catch (error) {
          // v2-5-4 AC-8: Skip failed slides but continue with remaining
          console.error(`[V2 Export] PDF: skipped slide-${i + 1}:`, error);
          errorCount++;
        }
      }

      // Step 2: Assemble PDF from successfully captured slides only
      // story-1.1 AC-5: Enable deflate compression in jsPDF constructor
      // v2-5-4 AC-4,9: addPage() only between slides, not before first or after last
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
        compress: true,
      });

      for (let i = 0; i < capturedDataUris.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        // story-1.1 AC-6: Use dynamic format based on capture options
        pdf.addImage(capturedDataUris[i], imageFormat, 0, 0, 1920, 1080);
      }

      const pdfDataUri = pdf.output('datauristring');
      const deckName = state.deckName || 'deck';
      postMessage({
        type: 'v2-export-file',
        format: 'pdf',
        data: pdfDataUri,
        fileName: `${deckName}.pdf`,
      });

      // v2-5-4 AC-8: Log error count for transparency
      if (errorCount > 0) {
        console.warn(`[V2 Export] PDF: exported ${capturedDataUris.length} of ${state.slides.length} slides (${errorCount} failed)`);
      }
    } catch (error) {
      console.error('[V2 Export] PDF generation failed:', error);
    } finally {
      dispatch({ type: 'CLEAR_EXPORT_PROGRESS' });
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [state.slides, state.mode, state.deckName, captureSlide, dispatch, postMessage]);

  return {
    exportCurrentPng,
    exportAllPng,
    exportPdf,
    isExporting,
    exportProgress: state.exportProgress,
  };
}
