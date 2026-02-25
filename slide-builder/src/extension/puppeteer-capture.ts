import type { Browser } from 'puppeteer';
import type { CaptureOptions } from '../shared/types';

/**
 * Puppeteer-based slide capture for pixel-perfect PNG/JPEG export.
 *
 * Uses a real Chromium renderer (via Puppeteer) to capture slides, avoiding
 * the CSS variable and font rendering limitations of client-side libraries
 * like html2canvas and html-to-image in the VSCode webview context.
 *
 * Browser instance is lazy-initialized on first capture and disposed after
 * an idle timeout to balance startup latency with resource usage.
 */

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;
const IDLE_TIMEOUT_MS = 60_000; // Dispose browser after 60s idle

let browser: Browser | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get or launch a Puppeteer browser instance.
 * Reuses the existing instance if still active.
 */
async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    resetIdleTimer();
    return browser;
  }

  // Dynamic import so require('puppeteer') is resolved at runtime (external in esbuild)
  const puppeteer = await import('puppeteer');
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none', // Consistent font rendering
    ],
  });

  resetIdleTimer();
  return browser;
}

/**
 * Reset the idle timer. Browser is disposed after IDLE_TIMEOUT_MS of inactivity.
 */
function resetIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  idleTimer = setTimeout(() => {
    disposeBrowser();
  }, IDLE_TIMEOUT_MS);
}

/**
 * Capture a single slide HTML as a PNG or JPEG buffer.
 * story-1.1 AC-1,2: Supports format/quality options with PNG default.
 *
 * @param html - Complete HTML document string for the slide
 * @param options - Capture format and quality options (defaults to PNG)
 * @returns Image buffer in the requested format
 */
export async function captureSlide(html: string, options?: CaptureOptions): Promise<Buffer> {
  const format = options?.format ?? 'png';
  const instance = await getBrowser();
  const page = await instance.newPage();

  try {
    await page.setViewport({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT });

    // Load the slide HTML directly — no file I/O needed
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for fonts to load (Google Fonts fetched via <link> in the HTML)
    await page.evaluate(() => document.fonts.ready);

    // Small settle time for any final layout reflow
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture the .slide element if it exists, otherwise full page
    const slideElement = await page.$('.slide');
    const target = slideElement ?? page;

    const screenshot = await target.screenshot({
      type: format,
      ...(format === 'jpeg' && options?.quality != null ? { quality: options.quality } : {}),
      clip: slideElement ? undefined : { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

/** Backward-compatible alias for captureSlide with PNG defaults. story-1.1 AC-2 */
export const captureSlideAsPng = (html: string): Promise<Buffer> => captureSlide(html);

/**
 * Dispose the browser instance and clean up resources.
 * Called on idle timeout and extension deactivation.
 */
export async function disposeBrowser(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (browser) {
    try {
      await browser.close();
    } catch {
      // Browser may already be closed
    }
    browser = null;
  }
}
