import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as http from 'http';
import * as net from 'net';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock vscode module (resolved via vitest alias)
vi.mock('vscode', () => ({
  default: {},
}));

// We need to import after mocks are set up
import { PresentServer } from '../../src/extension/PresentServer';

/** Helper: create a mock OutputChannel */
function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    name: 'Slide Builder',
    replace: vi.fn(),
  } as any;
}

/** Helper: make an HTTP GET request and return status, headers, body */
function httpGet(port: number, urlPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode!, headers: res.headers, body });
      });
    });
    req.on('error', reject);
  });
}

/**
 * Helper: send a raw HTTP request without client-side URL normalization.
 * Node's http.get() normalizes ../ segments before sending, so we use raw TCP
 * to test path traversal prevention at the server level.
 */
function httpGetRaw(port: number, rawPath: string): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect(port, '127.0.0.1', () => {
      socket.write(`GET ${rawPath} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`);
    });
    let data = '';
    socket.on('data', (chunk) => { data += chunk.toString(); });
    socket.on('end', () => {
      const [headerSection, ...bodyParts] = data.split('\r\n\r\n');
      const body = bodyParts.join('\r\n\r\n');
      const headerLines = headerSection.split('\r\n');
      const statusLine = headerLines[0];
      const statusMatch = statusLine.match(/HTTP\/\d\.\d (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      const headers: Record<string, string> = {};
      for (let i = 1; i < headerLines.length; i++) {
        const [key, ...val] = headerLines[i].split(': ');
        if (key) headers[key.toLowerCase()] = val.join(': ');
      }
      resolve({ status, headers, body });
    });
    socket.on('error', reject);
  });
}

/** Helper: occupy a port by binding a net server */
function occupyPort(port: number): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

/** Helper: close a net server */
function closeServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

describe('PresentServer', () => {
  const workspaceRoot = path.resolve(__dirname, '../../test-fixtures/present-server');
  let outputChannel: ReturnType<typeof createMockOutputChannel>;
  let serverInstance: PresentServer | null = null;

  beforeEach(async () => {
    outputChannel = createMockOutputChannel();
    // Reset singleton between tests
    // Access private static to clear it
    (PresentServer as any).instance = null;

    // Create test fixture directory structure
    await fs.mkdir(path.join(workspaceRoot, 'output', 'test-deck', 'slides'), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets'), { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(workspaceRoot, 'output', 'test-deck', 'slides', 'slide-1.html'),
      '<html><body><h1>Slide 1</h1></body></html>'
    );
    await fs.writeFile(
      path.join(workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets', 'logo.png'),
      Buffer.from('fake-png-data')
    );
    await fs.writeFile(
      path.join(workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets', 'icon.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'
    );
  });

  afterEach(async () => {
    // Stop server if running
    if (serverInstance) {
      serverInstance.stop();
      serverInstance = null;
    }
    // Clean up test fixtures
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  // =========================================================================
  // AC-1: Server startup and port discovery
  // =========================================================================
  describe('AC-1: Server startup and port discovery', () => {
    it('should start server on a port in range 52100-52199', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      expect(port).toBeGreaterThanOrEqual(52100);
      expect(port).toBeLessThanOrEqual(52199);
    });

    it('should bind to 127.0.0.1 (localhost only)', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      // Verify we can connect on localhost
      const response = await httpGet(port, '/');
      expect(response.status).toBeDefined();
    });

    it('should log server start message to output channel', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      expect(outputChannel.appendLine).toHaveBeenCalledWith(
        `[PresentServer] Server started on port ${port}`
      );
    });

    it('should skip occupied ports and find next available', async () => {
      // Occupy port 52100
      const blocker = await occupyPort(52100);

      try {
        serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
        const port = await serverInstance.ensureRunning();

        expect(port).toBeGreaterThanOrEqual(52101);
        expect(port).toBeLessThanOrEqual(52199);
      } finally {
        await closeServer(blocker);
      }
    });
  });

  // =========================================================================
  // AC-2: Slide file serving
  // =========================================================================
  describe('AC-2: Slide file serving', () => {
    it('should serve slide HTML with correct Content-Type and Cache-Control', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/slide-1.html');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.body).toContain('<h1>Slide 1</h1>');
    });
  });

  // =========================================================================
  // AC-3: Brand asset serving
  // =========================================================================
  describe('AC-3: Brand asset serving', () => {
    it('should serve PNG brand assets with correct MIME type', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/.slide-builder/config/catalog/brand-assets/logo.png');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('should serve SVG brand assets with correct MIME type', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/.slide-builder/config/catalog/brand-assets/icon.svg');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/svg+xml');
      expect(response.body).toContain('<svg');
    });
  });

  // =========================================================================
  // AC-4: Path traversal prevention
  // =========================================================================
  describe('AC-4: Path traversal prevention', () => {
    it('should return 403 for ../ path traversal attempt', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      // Use raw TCP to bypass Node HTTP client URL normalization
      const response = await httpGetRaw(port, '/output/../../etc/passwd');

      expect(response.status).toBe(403);
      expect(response.body).toContain('Forbidden');
    });

    it('should return 403 for encoded path traversal attempt', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      // %2e%2e = .. (raw TCP preserves encoding without client normalization)
      const response = await httpGetRaw(port, '/output/%2e%2e/%2e%2e/etc/passwd');

      expect(response.status).toBe(403);
      expect(response.body).toContain('Forbidden');
    });

    it('should return 403 for deeply nested traversal', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGetRaw(port, '/output/test-deck/slides/../../../../../../../etc/passwd');

      expect(response.status).toBe(403);
      expect(response.body).toContain('Forbidden');
    });
  });

  // =========================================================================
  // AC-5: File not found
  // =========================================================================
  describe('AC-5: File not found', () => {
    it('should return 404 for non-existent file', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/nonexistent.html');

      expect(response.status).toBe(404);
      expect(response.body).toBe('Not Found');
    });

    it('should return 404 for paths not under /output/ or /.slide-builder/', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/some/random/path');

      expect(response.status).toBe(404);
      expect(response.body).toBe('Not Found');
    });

    it('should return 404 for root path', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/');

      expect(response.status).toBe(404);
      expect(response.body).toBe('Not Found');
    });
  });

  // =========================================================================
  // AC-6: File read error
  // =========================================================================
  describe('AC-6: File read error', () => {
    it('should return 500 and log error for non-ENOENT read errors', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      // Create a directory where a file is expected — reading a directory
      // produces an EISDIR error, not ENOENT
      const dirPath = path.join(workspaceRoot, 'output', 'test-deck', 'slides', 'not-a-file.html');
      await fs.mkdir(dirPath, { recursive: true });

      const response = await httpGet(port, '/output/test-deck/slides/not-a-file.html');

      expect(response.status).toBe(500);
      expect(response.body).toBe('Internal Server Error');
      expect(outputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[PresentServer] File read error')
      );
    });
  });

  // =========================================================================
  // AC-7: Singleton idempotency
  // =========================================================================
  describe('AC-7: Singleton idempotency', () => {
    it('should return same instance from getInstance()', () => {
      const instance1 = PresentServer.getInstance(workspaceRoot, outputChannel);
      const instance2 = PresentServer.getInstance(workspaceRoot, outputChannel);

      expect(instance1).toBe(instance2);
    });

    it('should return same port on repeated ensureRunning() calls', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port1 = await serverInstance.ensureRunning();
      const port2 = await serverInstance.ensureRunning();

      expect(port1).toBe(port2);
    });

    it('should not create duplicate servers', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      await serverInstance.ensureRunning();
      await serverInstance.ensureRunning();

      // Should only log one "Server started" message
      const startMessages = (outputChannel.appendLine as any).mock.calls.filter(
        (call: any[]) => call[0].includes('Server started')
      );
      expect(startMessages).toHaveLength(1);
    });
  });

  // =========================================================================
  // Additional: MIME type coverage
  // =========================================================================
  describe('MIME type mapping', () => {
    it('should serve CSS files with correct MIME type', async () => {
      await fs.writeFile(
        path.join(workspaceRoot, 'output', 'test-deck', 'slides', 'style.css'),
        'body { color: red; }'
      );

      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/style.css');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/css; charset=utf-8');
    });

    it('should serve JS files with correct MIME type', async () => {
      await fs.writeFile(
        path.join(workspaceRoot, 'output', 'test-deck', 'slides', 'script.js'),
        'console.log("test");'
      );

      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/script.js');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/javascript; charset=utf-8');
    });

    it('should default to application/octet-stream for unknown extensions', async () => {
      await fs.writeFile(
        path.join(workspaceRoot, 'output', 'test-deck', 'slides', 'data.xyz'),
        'binary-data'
      );

      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/data.xyz');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/octet-stream');
    });
  });

  // =========================================================================
  // Additional: Server stop and cleanup
  // =========================================================================
  describe('Server stop and cleanup', () => {
    it('should stop server and release port', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      serverInstance.stop();

      // Verify port is released — we should be able to bind to it
      const testServer = net.createServer();
      await new Promise<void>((resolve, reject) => {
        testServer.on('error', reject);
        testServer.listen(port, '127.0.0.1', () => {
          testServer.close(() => resolve());
        });
      });

      expect(outputChannel.appendLine).toHaveBeenCalledWith(
        `[PresentServer] Server stopped on port ${port}`
      );

      serverInstance = null; // Already stopped
    });

    it('should clear singleton on stop, allowing new instance creation', async () => {
      const instance1 = PresentServer.getInstance(workspaceRoot, outputChannel);
      await instance1.ensureRunning();
      instance1.stop();

      const instance2 = PresentServer.getInstance(workspaceRoot, outputChannel);
      expect(instance2).not.toBe(instance1);

      // Clean up
      serverInstance = instance2;
    });
  });

  // =========================================================================
  // Presenter page (pd-1-2): Route, HTML content, and structure
  // =========================================================================
  describe('Presenter page (pd-1-2)', () => {
    it('should return 200 with HTML content-type and no-store caching for /present/{deckId}', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('should include deckId in the HTML title', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/my-sales-deck');

      expect(response.body).toContain('<title>my-sales-deck - Presenter</title>');
    });

    it('should contain an iframe with sandbox="allow-same-origin allow-scripts"', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('<iframe');
      expect(response.body).toContain('sandbox="allow-same-origin allow-scripts"');
    });

    it('should contain scaleSlide function with transform scaling logic', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('scaleSlide');
      expect(response.body).toContain('Math.min');
      expect(response.body).toContain('transform');
      expect(response.body).toContain('1920');
      expect(response.body).toContain('1080');
    });

    it('should contain keyboard navigation handling for arrow keys, Home, End', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('ArrowRight');
      expect(response.body).toContain('ArrowLeft');
      expect(response.body).toContain("'Home'");
      expect(response.body).toContain("'End'");
      expect(response.body).toContain('keydown');
    });

    it('should contain manifest.json fetch URL with correct deckId', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('manifest.json');
      expect(response.body).toContain('DECK_PATH');
      expect(response.body).toContain('"output/test-deck"');
    });

    it('should contain sequential probe fallback logic', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('discoverViaProbe');
      expect(response.body).toContain('HEAD');
    });

    it('should contain a slide counter element', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('id="counter"');
    });

    it('should contain a fullscreen button', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('fullscreen-btn');
      expect(response.body).toContain('requestFullscreen');
    });

    it('should contain resize event listener', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain("addEventListener('resize'");
    });

    it('should produce HTML under 50KB', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      const sizeInBytes = Buffer.byteLength(response.body, 'utf-8');
      expect(sizeInBytes).toBeLessThan(50 * 1024);
    });

    it('should have black background styling', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('background: #000');
    });

    it('should handle /present/{deckId}/ with trailing slash', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.body).toContain('test-deck');
    });

    it('should properly escape deckId to prevent XSS', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      // JSON.stringify will escape quotes and special chars
      const response = await httpGet(port, '/present/deck-with-quotes');

      // The deckId in the JS should be JSON-escaped
      expect(response.body).toContain('"deck-with-quotes"');
    });

    it('should not affect existing /output/ route', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/test-deck/slides/slide-1.html');

      expect(response.status).toBe(200);
      expect(response.body).toContain('<h1>Slide 1</h1>');
    });

    it('should not affect existing /.slide-builder/ route', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/.slide-builder/config/catalog/brand-assets/icon.svg');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/svg+xml');
    });

    it('should contain goToSlide function with clamping logic', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('goToSlide');
      expect(response.body).toContain('totalSlides');
      expect(response.body).toContain('currentSlide');
    });

    it('should listen for fullscreenchange event', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('fullscreenchange');
    });

    it('should contain counter styling with semi-transparent background', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('rgba(255,255,255,0.7)');
      expect(response.body).toContain('rgba(0,0,0,0.5)');
    });
  });

  // =========================================================================
  // pd-1-3 AC-5: Missing slide error overlay
  // =========================================================================
  describe('pd-1-3 AC-5: Missing slide error overlay', () => {
    it('should contain slide-not-found overlay div in presenter HTML', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('id="slide-not-found"');
      expect(response.body).toContain('Slide not found');
    });

    it('should contain styled overlay with dark semi-transparent background', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('rgba(0,0,0,0.85)');
      expect(response.body).toContain('#slide-not-found.visible');
      expect(response.body).toContain('display: flex');
    });

    it('should contain helpful message text in the overlay', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain('This slide may have been deleted or moved');
      expect(response.body).toContain('arrow keys to navigate');
    });

    it('should use fetch HEAD request in goToSlide before setting iframe src', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      // goToSlide should do fetch HEAD check
      expect(response.body).toContain("fetch(slideUrl, { method: 'HEAD' })");
    });

    it('should show overlay on 404 and hide overlay on successful load', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      // On success: remove visible class
      expect(response.body).toContain("notFoundEl.classList.remove('visible')");
      // On 404: add visible class
      expect(response.body).toContain("notFoundEl.classList.add('visible')");
    });

    it('should set iframe to about:blank when slide is not found', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      expect(response.body).toContain("iframe.src = 'about:blank'");
    });

    it('should keep overlay hidden by default (display: none)', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      // The #slide-not-found base style should have display: none
      expect(response.body).toMatch(/#slide-not-found\s*\{[^}]*display:\s*none/);
    });

    it('should still produce HTML under 50KB with error overlay added', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/test-deck');

      const sizeInBytes = Buffer.byteLength(response.body, 'utf-8');
      expect(sizeInBytes).toBeLessThan(50 * 1024);
    });
  });

  // =========================================================================
  // Nested deck path support (deckPath query param)
  // =========================================================================
  describe('Nested deck path support', () => {
    it('should use deckPath query param for slideBasePath when provided', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/my-deck?deckPath=output/MyFolder/my-deck');

      expect(response.status).toBe(200);
      // DECK_PATH should be the provided deckPath value
      expect(response.body).toContain('"output/MyFolder/my-deck"');
    });

    it('should fall back to output/{deckId} when no deckPath param', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/my-deck');

      // DECK_PATH should fall back to output/{deckId}
      expect(response.body).toContain('"output/my-deck"');
    });

    it('should still use deckId for the page title', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/present/my-deck?deckPath=output/Folder/my-deck');

      expect(response.body).toContain('<title>my-deck - Presenter</title>');
    });

    it('should serve files with spaces in folder names', async () => {
      await fs.mkdir(path.join(workspaceRoot, 'output', 'My Folder', 'nested-deck', 'slides'), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, 'output', 'My Folder', 'nested-deck', 'slides', 'slide-1.html'),
        '<html><body>Nested Slide</body></html>'
      );

      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpGet(port, '/output/My%20Folder/nested-deck/slides/slide-1.html');
      expect(response.status).toBe(200);
      expect(response.body).toContain('Nested Slide');
    });
  });

  // =========================================================================
  // HEAD request support
  // =========================================================================
  describe('HEAD request support', () => {
    /** Helper: make an HTTP HEAD request */
    function httpHead(port: number, urlPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
      return new Promise((resolve, reject) => {
        const req = http.request(`http://127.0.0.1:${port}${urlPath}`, { method: 'HEAD' }, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            resolve({ status: res.statusCode!, headers: res.headers, body });
          });
        });
        req.on('error', reject);
        req.end();
      });
    }

    it('should return 200 with headers but no body for existing file', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpHead(port, '/output/test-deck/slides/slide-1.html');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBe('');
    });

    it('should return 404 for non-existent file on HEAD', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await httpHead(port, '/output/test-deck/slides/nonexistent.html');
      expect(response.status).toBe(404);
      expect(response.body).toBe('');
    });

    it('should reject unsupported HTTP methods', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      const response = await new Promise<{ status: number }>((resolve, reject) => {
        const req = http.request(`http://127.0.0.1:${port}/output/test-deck/slides/slide-1.html`, { method: 'POST' }, (res) => {
          res.resume();
          res.on('end', () => resolve({ status: res.statusCode! }));
        });
        req.on('error', reject);
        req.end();
      });
      expect(response.status).toBe(405);
    });
  });

  // =========================================================================
  // pd-1-3 AC-6: stopIfRunning static method
  // =========================================================================
  describe('pd-1-3 AC-6: stopIfRunning static method', () => {
    it('should stop running server when called', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();

      PresentServer.stopIfRunning();

      // Verify port is released
      const testServer = net.createServer();
      await new Promise<void>((resolve, reject) => {
        testServer.on('error', reject);
        testServer.listen(port, '127.0.0.1', () => {
          testServer.close(() => resolve());
        });
      });

      expect(outputChannel.appendLine).toHaveBeenCalledWith(
        `[PresentServer] Server stopped on port ${port}`
      );

      serverInstance = null; // Already stopped
    });

    it('should be a no-op when no server instance exists', () => {
      // Ensure no instance
      (PresentServer as any).instance = null;

      // Should not throw
      expect(() => PresentServer.stopIfRunning()).not.toThrow();
    });

    it('should clear singleton so new instance can be created after stopIfRunning', async () => {
      const instance1 = PresentServer.getInstance(workspaceRoot, outputChannel);
      await instance1.ensureRunning();

      PresentServer.stopIfRunning();

      const instance2 = PresentServer.getInstance(workspaceRoot, outputChannel);
      expect(instance2).not.toBe(instance1);

      // Clean up
      serverInstance = instance2;
    });
  });

  // =========================================================================
  // pd-1-4: Build Animation Playback
  // =========================================================================
  describe('pd-1-4: Build animation playback', () => {
    /** Helper: get presenter HTML body for a test deck */
    async function getPresenterBody(port: number, deckId: string = 'test-deck'): Promise<string> {
      const response = await httpGet(port, `/present/${deckId}`);
      return response.body;
    }

    // --- AC1: Build CSS injection code ---
    it('should contain build-hidden CSS class definition', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('build-hidden');
      expect(body).toContain('opacity: 0 !important');
      expect(body).toContain('visibility: hidden !important');
    });

    it('should contain build-revealing CSS class with buildFadeIn animation', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('build-revealing');
      expect(body).toContain('buildFadeIn');
      expect(body).toContain('0.4s ease-out forwards');
    });

    it('should contain build-visible CSS class', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('build-visible');
    });

    it('should contain @keyframes buildFadeIn with translateY transition', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('@keyframes buildFadeIn');
      expect(body).toContain('translateY(10px)');
      expect(body).toContain('translateY(0)');
    });

    // --- AC1: PostMessage handler injection ---
    it('should contain postMessage listener for buildHideElements command', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('buildHideElements');
    });

    it('should contain postMessage listener for buildRevealElements command', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('buildRevealElements');
    });

    it('should contain postMessage listener for buildShowAll command', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('buildShowAll');
    });

    // --- AC1/AC7: Animation groups parsing from manifest ---
    it('should parse animations.groups from manifest slide data', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('s.animations');
      expect(body).toContain('animations.groups');
      expect(body).toContain('slideAnimations');
    });

    it('should sort animation groups by order field', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('a.order - b.order');
    });

    it('should store empty array for slides without animations.groups', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      // The ternary falls back to empty array when no animations.groups
      expect(body).toContain('s.animations && Array.isArray(s.animations.groups)');
    });

    // --- AC7: Non-animated slides skip build stepping ---
    it('should check getTotalGroups before applying build logic', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('getTotalGroups');
      // Non-animated slides (groups.length === 0) skip all build stepping
      expect(body).toContain('if (groups > 0');
    });

    // --- AC2: Forward build stepping ---
    it('should handle Space key same as ArrowRight for build stepping', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      // Space and ArrowRight should be in the same case block
      expect(body).toContain("case ' ':");
      expect(body).toContain("case 'ArrowRight':");
    });

    it('should send buildRevealElements when stepping forward', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain("sendBuildCommand('buildRevealElements'");
    });

    it('should increment currentBuildStep when revealing', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('currentBuildStep++');
    });

    // --- AC4: Reverse build stepping ---
    it('should send buildHideElements when stepping backward', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain("sendBuildCommand('buildHideElements'");
    });

    it('should decrement currentBuildStep when hiding', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('currentBuildStep--');
    });

    // --- AC5: Back to previous slide with all groups revealed ---
    it('should go to previous slide with showAllOnLoad when at build step 0', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('goToSlide(currentSlide - 1, true)');
    });

    // --- AC6: Home/End with full reveal ---
    it('should pass showAllOnLoad=true for Home key navigation', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('goToSlide(1, true)');
    });

    it('should pass showAllOnLoad=true for End key navigation', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('goToSlide(totalSlides, true)');
    });

    it('should call showAllAnimatedElements when showAllOnLoad is set', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('showAllAnimatedElements');
      expect(body).toContain('if (showAllOnLoad)');
    });

    // --- AC2/AC4: Counter format includes build step indicator ---
    it('should display counter with build step indicator format [step/groups]', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      // Counter update includes build step: "N / Total [step/groups]"
      expect(body).toContain("' [' + currentBuildStep + '/' + groups + ']'");
    });

    it('should hide build step indicator when all groups are revealed', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      // When currentBuildStep === groups, counter just shows "N / Total"
      expect(body).toContain('currentBuildStep < groups');
    });

    // --- AC1: Initial hide on slide load ---
    it('should call hideAllAnimatedElements after iframe load for normal navigation', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('hideAllAnimatedElements');
      expect(body).toContain('iframe.onload');
      expect(body).toContain('injectBuildSupport');
    });

    // --- AC1: iframe contentDocument injection ---
    it('should inject build CSS and handler into iframe contentDocument', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('iframe.contentDocument');
      expect(body).toContain('build-animation-styles');
      expect(body).toContain('build-command-handler');
      expect(body).toContain('insertAdjacentHTML');
      expect(body).toContain('createElement');
      expect(body).toContain('appendChild');
    });

    // --- PostMessage communication pattern ---
    it('should use iframe.contentWindow.postMessage for build commands', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('iframe.contentWindow.postMessage');
    });

    // --- Size check: still under 50KB with animation code ---
    it('should still produce HTML under 50KB with build animation code added', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      const sizeInBytes = Buffer.byteLength(body, 'utf-8');
      expect(sizeInBytes).toBeLessThan(50 * 1024);
    });

    // --- Build state variables ---
    it('should declare slideAnimations and currentBuildStep state variables', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('var slideAnimations = []');
      expect(body).toContain('var currentBuildStep = 0');
    });
  });

  // =========================================================================
  // Sidebar: Thumbnail navigation sidebar (story-presenter-sidebar-1)
  // =========================================================================
  describe('Sidebar: Thumbnail navigation sidebar', () => {
    /** Helper: get presenter HTML body for a test deck */
    async function getPresenterBody(port: number, deckId: string = 'test-deck'): Promise<string> {
      const response = await httpGet(port, `/present/${deckId}`);
      return response.body;
    }

    it('should contain id="sidebar" and id="main-area" elements', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('id="sidebar"');
      expect(body).toContain('id="main-area"');
    });

    it('should have sidebar CSS with width: 240px, #d4e94c highlight, and #1a1a1a background', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('width: 240px');
      expect(body).toContain('#d4e94c');
      expect(body).toContain('#1a1a1a');
    });

    it('should contain renderSidebar and updateSidebarHighlight functions', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('function renderSidebar()');
      expect(body).toContain('function updateSidebarHighlight()');
    });

    it('should have fullscreen sidebar hide rule', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain(':fullscreen #sidebar');
      expect(body).toContain(':-webkit-full-screen #sidebar');
      expect(body).toContain('display: none');
    });

    it('should have body with display: flex', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('display: flex');
    });

    it('should use sandbox="allow-same-origin" in sidebar thumbnails', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('sandbox="allow-same-origin" loading="lazy"');
    });

    it('should declare slideTitles variable', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('var slideTitles = []');
    });

    it('should call renderSidebar in init flow', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain('renderSidebar()');
    });

    it('should call updateSidebarHighlight in goToSlide', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      // updateSidebarHighlight should be called inside goToSlide
      expect(body).toContain('updateSidebarHighlight()');
    });

    it('should populate slideTitles from manifest data', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain("s.title || 'Slide ' + s.number");
    });

    it('should use scrollIntoView for auto-scrolling active sidebar item', async () => {
      serverInstance = PresentServer.getInstance(workspaceRoot, outputChannel);
      const port = await serverInstance.ensureRunning();
      const body = await getPresenterBody(port);

      expect(body).toContain("scrollIntoView({ behavior: 'smooth', block: 'nearest' })");
    });
  });
});
