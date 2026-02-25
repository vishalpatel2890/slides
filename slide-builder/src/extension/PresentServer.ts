import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as net from 'net';
import type * as vscode from 'vscode';

/**
 * MIME type map for static file serving.
 * Covers common web content types used in slide presentations and brand assets.
 * Internal to PresentServer — not exported.
 *
 * Story Reference: pd-1-1 Task 5, AC-3
 */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/** Port range constants for auto-discovery */
const PORT_RANGE_START = 52100;
const PORT_RANGE_END = 52199;

/**
 * HTTP server embedded in the VS Code extension for serving slide files
 * and brand assets over localhost. Enables correct browser rendering of
 * slides with all assets resolved over HTTP.
 *
 * Follows the singleton service pattern used by CatalogDataService,
 * FileWatcherService, and ThumbnailService.
 *
 * Architecture Reference: notes/architecture-present-deck.md
 * Story Reference: pd-1-1
 */
export class PresentServer {
  private static instance: PresentServer | null = null;

  private server: http.Server | null = null;
  private port: number | null = null;

  /**
   * Private constructor — use getInstance() to obtain the singleton.
   * @param workspaceRoot Absolute path to the VS Code workspace root
   * @param outputChannel Shared output channel for extension logging
   */
  private constructor(
    private readonly workspaceRoot: string,
    private readonly outputChannel: vscode.OutputChannel
  ) {}

  /**
   * Get the singleton PresentServer instance.
   * Creates a new instance on first call; returns existing instance thereafter.
   *
   * Story Reference: pd-1-1 Task 1, AC-7
   */
  static getInstance(workspaceRoot: string, outputChannel: vscode.OutputChannel): PresentServer {
    if (!PresentServer.instance) {
      PresentServer.instance = new PresentServer(workspaceRoot, outputChannel);
    }
    return PresentServer.instance;
  }

  /**
   * Ensure the HTTP server is running. Idempotent — if the server is already
   * running, returns the existing port without creating a new server.
   *
   * @returns The port number the server is listening on
   * Story Reference: pd-1-1 Task 1, AC-1, AC-7
   */
  async ensureRunning(): Promise<number> {
    if (this.server && this.port !== null) {
      return this.port;
    }
    return this.start();
  }

  /**
   * Static convenience method to stop the singleton server if one exists.
   * Safe to call even if no server was ever started (no-op when instance is null).
   *
   * Story Reference: pd-1-3 AC-6 (deactivate lifecycle cleanup)
   */
  static stopIfRunning(): void {
    if (PresentServer.instance) {
      PresentServer.instance.stop();
    }
  }

  /**
   * Stop the HTTP server and release the port. Clears the singleton instance
   * so a fresh server can be created on next getInstance() + ensureRunning().
   *
   * Story Reference: pd-1-1 Task 1
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.outputChannel.appendLine(`[PresentServer] Server stopped on port ${this.port}`);
      this.server = null;
      this.port = null;
    }
    PresentServer.instance = null;
  }

  /**
   * Create and start the HTTP server on an auto-discovered port.
   * Binds to 127.0.0.1 only (localhost — not accessible from other machines).
   *
   * Story Reference: pd-1-1 Task 3, AC-1
   */
  private async start(): Promise<number> {
    const port = await this.findAvailablePort(PORT_RANGE_START);

    return new Promise<number>((resolve, reject) => {
      const server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          this.outputChannel.appendLine(`[PresentServer] Unhandled error: ${err}`);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
          }
        });
      });

      server.on('error', (err) => {
        reject(err);
      });

      server.listen(port, '127.0.0.1', () => {
        this.server = server;
        this.port = port;
        this.outputChannel.appendLine(`[PresentServer] Server started on port ${port}`);
        resolve(port);
      });
    });
  }

  /**
   * Find an available port in the configured range (52100-52199).
   * Tests each port sequentially using a net.createServer() probe.
   *
   * @param startPort First port to try (default: 52100)
   * @returns The first available port in range
   * @throws Error if all 100 ports are occupied
   *
   * Story Reference: pd-1-1 Task 2, AC-1
   */
  private async findAvailablePort(startPort: number = PORT_RANGE_START): Promise<number> {
    for (let port = startPort; port <= PORT_RANGE_END; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(
      `[PresentServer] No available port found in range ${PORT_RANGE_START}-${PORT_RANGE_END}. ` +
      `All 100 ports are occupied. Close other applications using these ports and try again.`
    );
  }

  /**
   * Test if a port is available by attempting to bind a temporary server.
   * Resolves true if the port is free, false if occupied.
   *
   * Story Reference: pd-1-1 Task 2, AC-1
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const testServer = net.createServer();
      testServer.once('error', () => {
        resolve(false);
      });
      testServer.listen(port, '127.0.0.1', () => {
        testServer.close(() => {
          resolve(true);
        });
      });
    });
  }

  /**
   * Route incoming HTTP requests to the appropriate handler.
   *
   * Routes:
   * - /output/...           -> serveFile() (slide HTML, assets)
   * - /.slide-builder/...   -> serveFile() (brand assets, config)
   * - /present/{deckId}     -> getPresenterHtml() (fullscreen presenter page)
   * - All other paths       -> 404 Not Found
   *
   * Story Reference: pd-1-1 Task 3, AC-2, AC-3
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const rawUrl = req.url || '/';
    const method = req.method || 'GET';

    // Only allow GET and HEAD methods
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    // Security: reject any URL containing path traversal sequences BEFORE
    // URL normalization can strip them. Check both raw and decoded forms.
    const decodedRaw = decodeURIComponent(rawUrl);
    if (rawUrl.includes('..') || decodedRaw.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const url = new URL(rawUrl, `http://127.0.0.1:${this.port}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/output/')) {
      return this.serveFile(pathname, res, method);
    }

    if (pathname.startsWith('/.slide-builder/')) {
      return this.serveFile(pathname, res, method);
    }

    const presenterMatch = pathname.match(/^\/present\/([^/]+)\/?$/);
    if (presenterMatch) {
      const deckId = decodeURIComponent(presenterMatch[1]);
      const deckPath = url.searchParams.get('deckPath') || `output/${deckId}`;
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(this.getPresenterHtml(deckId, deckPath));
      return;
    }

    // All other paths: 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  /**
   * Generate self-contained HTML presenter page for fullscreen slide navigation.
   * Returns inline HTML/CSS/JS with no external dependencies.
   *
   * Features:
   * - iframe with 1920x1080 slide content, CSS transform scaling to viewport
   * - Keyboard navigation: ArrowRight/Left, Home, End
   * - Manifest-first slide discovery with sequential probe fallback
   * - Slide counter overlay (bottom-right, semi-transparent)
   * - Fullscreen mode button
   * - Window resize handling
   *
   * Story Reference: pd-1-2, AC-1 through AC-10
   */
  private getPresenterHtml(deckId: string, deckPath: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deckId} - Presenter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; width: 100vw; height: 100vh; display: flex; }
    #sidebar {
      width: 240px; flex-shrink: 0; background: #1a1a1a; border-right: 1px solid #2a2a2a;
      overflow-y: auto; padding: 12px;
    }
    #sidebar::-webkit-scrollbar { width: 6px; }
    #sidebar::-webkit-scrollbar-track { background: #1a1a1a; }
    #sidebar::-webkit-scrollbar-thumb { background: #2a2a2a; }
    #sidebar::-webkit-scrollbar-thumb:hover { background: #888; }
    .sidebar-item { width: 100%; margin-bottom: 10px; cursor: pointer; }
    .sidebar-thumb {
      width: 100%; aspect-ratio: 16/9; border: 2px solid transparent;
      overflow: hidden; position: relative; background: #000; transition: border-color 0.15s;
    }
    .sidebar-item:hover .sidebar-thumb { border-color: #2a2a2a; }
    .sidebar-item.active .sidebar-thumb { border-color: #d4e94c; }
    .sidebar-thumb iframe {
      width: 1000%; height: 1000%; transform: scale(0.1); transform-origin: top left;
      pointer-events: none; border: none;
    }
    .sidebar-number {
      position: absolute; bottom: 2px; right: 2px; background: rgba(10,10,10,0.8);
      color: #fff; font-size: 10px; font-weight: 600; padding: 2px 6px;
    }
    .sidebar-title {
      display: block; font-size: 10px; color: #888; padding: 4px 4px 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #main-area { flex: 1; min-width: 0; position: relative; overflow: hidden; }
    #slide-container {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }
    :fullscreen #sidebar, :-webkit-full-screen #sidebar { display: none; }
    :fullscreen #main-area, :-webkit-full-screen #main-area { width: 100%; }
    #slide-frame {
      position: absolute; width: 1920px; height: 1080px;
      border: none; background: #fff;
    }
    #counter {
      position: fixed; bottom: 20px; right: 20px; z-index: 100;
      color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.5);
      padding: 6px 14px; border-radius: 6px;
      font: 500 14px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none; user-select: none;
    }
    #fullscreen-btn {
      position: fixed; bottom: 20px; left: 20px; z-index: 100;
      color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.3); border-radius: 6px;
      padding: 6px 14px; cursor: pointer;
      font: 500 13px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity 0.2s;
    }
    #fullscreen-btn:hover { background: rgba(0,0,0,0.8); color: #fff; }
    #loading {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: rgba(255,255,255,0.5);
      font: 300 18px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #slide-not-found {
      display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 90; background: rgba(0,0,0,0.85);
      justify-content: center; align-items: center; flex-direction: column;
    }
    #slide-not-found.visible { display: flex; }
    #slide-not-found h2 {
      color: rgba(255,255,255,0.9); margin-bottom: 12px;
      font: 600 28px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #slide-not-found p {
      color: rgba(255,255,255,0.5);
      font: 400 16px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="sidebar"></div>
  <div id="main-area">
    <div id="slide-container">
      <iframe id="slide-frame" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
    <div id="counter"></div>
    <button id="fullscreen-btn" title="Enter fullscreen">&#x26F6; Fullscreen</button>
    <div id="loading">Loading slides\u2026</div>
    <div id="slide-not-found"><h2>Slide not found</h2><p>This slide may have been deleted or moved. Use arrow keys to navigate to other slides.</p></div>
  </div>
  <script>
    (function() {
      var DECK_ID = ${JSON.stringify(deckId)};
      var DECK_PATH = ${JSON.stringify(deckPath)};
      var SLIDE_W = 1920;
      var SLIDE_H = 1080;
      var slideBasePath = '/' + DECK_PATH + '/slides/';

      var iframe = document.getElementById('slide-frame');
      var container = document.getElementById('slide-container');
      var counterEl = document.getElementById('counter');
      var loadingEl = document.getElementById('loading');
      var fsBtn = document.getElementById('fullscreen-btn');

      var currentSlide = 1;
      var totalSlides = 0;
      var slideFiles = [];
      var slideTitles = [];
      var sidebarEl = document.getElementById('sidebar');
      var notFoundEl = document.getElementById('slide-not-found');

      /* === Build Animation State === */
      var slideAnimations = []; /* per-slide array of sorted animation groups */
      var currentBuildStep = 0; /* 0 = all hidden, max = all revealed */

      /* === Scaling === */
      function scaleSlide() {
        var vw = container.clientWidth;
        var vh = container.clientHeight;
        var scale = Math.min(vw / SLIDE_W, vh / SLIDE_H);
        iframe.style.width = SLIDE_W + 'px';
        iframe.style.height = SLIDE_H + 'px';
        iframe.style.transform = 'scale(' + scale + ')';
        iframe.style.transformOrigin = 'top left';
        var offsetX = (vw - SLIDE_W * scale) / 2;
        var offsetY = (vh - SLIDE_H * scale) / 2;
        iframe.style.left = offsetX + 'px';
        iframe.style.top = offsetY + 'px';
      }
      window.addEventListener('resize', scaleSlide);
      document.addEventListener('fullscreenchange', function() {
        setTimeout(scaleSlide, 50);
      });

      /* === Build Animation Helpers === */
      var BUILD_CSS = '<style id="build-animation-styles">'
        + '[data-build-id].build-hidden { opacity: 0 !important; visibility: hidden !important; }'
        + '[data-build-id].build-revealing { animation: buildFadeIn 0.4s ease-out forwards; }'
        + '[data-build-id].build-visible { opacity: 1; visibility: visible; }'
        + '@keyframes buildFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }'
        + '</style>';

      var BUILD_HANDLER_CODE = '(function() {'
        + 'function findBuild(id) { return document.querySelector("[data-build-id=" + id + "]"); }'
        + 'window.addEventListener("message", function(event) {'
        + '  if (!event.data || !event.data.type) return;'
        + '  if (event.data.type === "buildHideElements") {'
        + '    (event.data.elementIds || []).forEach(function(id) {'
        + '      var el = findBuild(id);'
        + '      if (el) { el.classList.remove("build-visible", "build-revealing"); el.classList.add("build-hidden"); }'
        + '    });'
        + '  } else if (event.data.type === "buildRevealElements") {'
        + '    (event.data.elementIds || []).forEach(function(id) {'
        + '      var el = findBuild(id);'
        + '      if (el) {'
        + '        el.classList.remove("build-hidden", "build-visible"); el.classList.add("build-revealing");'
        + '        setTimeout(function() { el.classList.remove("build-revealing"); el.classList.add("build-visible"); }, 400);'
        + '      }'
        + '    });'
        + '  } else if (event.data.type === "buildShowAll") {'
        + '    document.querySelectorAll("[data-build-id]").forEach(function(el) {'
        + '      el.classList.remove("build-hidden", "build-revealing"); el.classList.add("build-visible");'
        + '    });'
        + '  }'
        + '});'
        + '})();';

      function injectBuildSupport() {
        try {
          var doc = iframe.contentDocument;
          console.log('[PresentServer] injectBuildSupport: doc=' + !!doc + ', doc.head=' + !!(doc && doc.head) + ', doc.body=' + !!(doc && doc.body));
          if (!doc || !doc.head) { console.log('[PresentServer] injectBuildSupport: ABORT - no doc or head'); return; }
          if (doc.getElementById('build-command-handler')) { console.log('[PresentServer] injectBuildSupport: SKIP - handler already exists'); return; }
          doc.head.insertAdjacentHTML('beforeend', BUILD_CSS);
          var script = doc.createElement('script');
          script.id = 'build-command-handler';
          script.textContent = BUILD_HANDLER_CODE;
          doc.body.appendChild(script);
          console.log('[PresentServer] injectBuildSupport: SUCCESS - injected CSS + handler');
        } catch(e) { console.log('[PresentServer] injectBuildSupport: ERROR - ' + e.message); }
      }

      function getSlideGroups(n) {
        if (n < 1 || n > slideAnimations.length) return [];
        return slideAnimations[n - 1] || [];
      }

      function getTotalGroups(n) {
        return getSlideGroups(n).length;
      }

      function updateCounter() {
        var groups = getTotalGroups(currentSlide);
        if (groups > 0 && currentBuildStep < groups) {
          counterEl.textContent = currentSlide + ' / ' + totalSlides + ' [' + currentBuildStep + '/' + groups + ']';
        } else {
          counterEl.textContent = currentSlide + ' / ' + totalSlides;
        }
      }

      function sendBuildCommand(type, elementIds) {
        try {
          iframe.contentWindow.postMessage({ type: type, elementIds: elementIds || [] }, '*');
        } catch(e) { /* safety */ }
      }

      function hideAllAnimatedElements() {
        var groups = getSlideGroups(currentSlide);
        if (groups.length === 0) return;
        var allIds = [];
        groups.forEach(function(g) {
          allIds = allIds.concat(g.elementIds);
        });
        sendBuildCommand('buildHideElements', allIds);
        currentBuildStep = 0;
      }

      function showAllAnimatedElements() {
        sendBuildCommand('buildShowAll');
        currentBuildStep = getTotalGroups(currentSlide);
      }

      /* === Sidebar === */
      function renderSidebar() {
        sidebarEl.innerHTML = '';
        for (var i = 0; i < slideFiles.length; i++) {
          (function(idx) {
            var num = idx + 1;
            var item = document.createElement('div');
            item.className = 'sidebar-item' + (num === currentSlide ? ' active' : '');
            item.id = 'sidebar-' + num;
            var title = slideTitles[idx] || 'Slide ' + num;
            item.title = title;
            item.onclick = function() { goToSlide(num); };
            item.innerHTML =
              '<div class="sidebar-thumb">' +
                '<iframe src="' + slideBasePath + slideFiles[idx] + '" sandbox="allow-same-origin" loading="lazy"></iframe>' +
                '<span class="sidebar-number">' + num + '</span>' +
              '</div>' +
              '<span class="sidebar-title">' + title + '</span>';
            sidebarEl.appendChild(item);
          })(i);
        }
      }

      function updateSidebarHighlight() {
        var items = document.querySelectorAll('.sidebar-item');
        for (var i = 0; i < items.length; i++) {
          items[i].classList.remove('active');
        }
        var active = document.getElementById('sidebar-' + currentSlide);
        if (active) {
          active.classList.add('active');
          active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      /* === Navigation === */
      function goToSlide(n, showAllOnLoad) {
        if (n < 1 || n > totalSlides) return;
        currentSlide = n;
        currentBuildStep = 0;
        updateSidebarHighlight();
        counterEl.textContent = n + ' / ' + totalSlides;
        var slideUrl = slideBasePath + slideFiles[n - 1];
        fetch(slideUrl, { method: 'HEAD' })
          .then(function(res) {
            if (res.ok) {
              notFoundEl.classList.remove('visible');
              iframe.src = slideUrl;
              iframe.onload = function() {
                console.log('[PresentServer] iframe.onload fired for slide ' + currentSlide + ', url=' + slideUrl);
                injectBuildSupport();
                /* Strip contenteditable to prevent text editing blocking navigation */
                try {
                  var iDoc = iframe.contentDocument;
                  if (iDoc) {
                    iDoc.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
                      el.setAttribute('contenteditable', 'false');
                    });
                    /* Forward keyboard events from iframe to parent handler */
                    iDoc.removeEventListener('keydown', handleKeyDown);
                    iDoc.addEventListener('keydown', handleKeyDown);
                  }
                } catch(ex) { /* cross-origin safety */ }
                var groups = getTotalGroups(currentSlide);
                console.log('[PresentServer] slide ' + currentSlide + ' has ' + groups + ' animation groups, slideAnimations.length=' + slideAnimations.length);
                if (groups > 0) {
                  if (showAllOnLoad) {
                    showAllAnimatedElements();
                  } else {
                    hideAllAnimatedElements();
                  }
                  updateCounter();
                }
              };
            } else {
              iframe.src = 'about:blank';
              notFoundEl.classList.add('visible');
            }
          })
          .catch(function() {
            iframe.src = 'about:blank';
            notFoundEl.classList.add('visible');
          });
      }

      function handleKeyDown(e) {
        var groups, group;
        switch (e.key) {
          case 'ArrowRight':
          case ' ':
            e.preventDefault();
            groups = getTotalGroups(currentSlide);
            if (groups > 0 && currentBuildStep < groups) {
              /* Reveal next animation group */
              group = getSlideGroups(currentSlide)[currentBuildStep];
              sendBuildCommand('buildRevealElements', group.elementIds);
              currentBuildStep++;
              updateCounter();
            } else {
              /* All groups revealed (or no groups) -- advance slide */
              if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            groups = getTotalGroups(currentSlide);
            if (groups > 0 && currentBuildStep > 0) {
              /* Hide last revealed group */
              group = getSlideGroups(currentSlide)[currentBuildStep - 1];
              sendBuildCommand('buildHideElements', group.elementIds);
              currentBuildStep--;
              updateCounter();
            } else {
              /* All groups hidden (or no groups) -- go to previous slide with all groups revealed */
              if (currentSlide > 1) goToSlide(currentSlide - 1, true);
            }
            break;
          case 'Home':
            e.preventDefault();
            goToSlide(1, true);
            break;
          case 'End':
            e.preventDefault();
            goToSlide(totalSlides, true);
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
            }
            break;
          case 'Escape':
            e.preventDefault();
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen();
            }
            break;
          default:
            if (e.key >= '1' && e.key <= '9') {
              e.preventDefault();
              var num = parseInt(e.key);
              if (num <= totalSlides) goToSlide(num, true);
            }
        }
      }
      document.addEventListener('keydown', handleKeyDown);

      /* === Fullscreen === */
      fsBtn.addEventListener('click', function() {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      });

      /* === Click-to-advance in fullscreen === */
      container.addEventListener('click', function(e) {
        if (!document.fullscreenElement) return;
        if (e.button !== 0) return;
        if (e.target === fsBtn) return;
        e.preventDefault();
        var groups = getTotalGroups(currentSlide);
        if (groups > 0 && currentBuildStep < groups) {
          var group = getSlideGroups(currentSlide)[currentBuildStep];
          sendBuildCommand('buildRevealElements', group.elementIds);
          currentBuildStep++;
          updateCounter();
        } else {
          if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
        }
      });

      /* === Slide Discovery === */
      function discoverViaManifest() {
        return fetch(slideBasePath + 'manifest.json')
          .then(function(res) {
            if (!res.ok) throw new Error('Manifest not found');
            return res.json();
          })
          .then(function(data) {
            if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
              throw new Error('Invalid manifest');
            }
            slideFiles = data.slides.map(function(s) { return s.filename || s.file; });
            slideTitles = data.slides.map(function(s) { return s.title || 'Slide ' + s.number; });
            totalSlides = slideFiles.length;
            /* Parse animation groups per slide */
            slideAnimations = data.slides.map(function(s) {
              var groups = (s.animations && Array.isArray(s.animations.groups)) ? s.animations.groups : [];
              return groups.slice().sort(function(a, b) { return a.order - b.order; });
            });
          });
      }

      function discoverViaProbe() {
        slideFiles = [];
        slideTitles = [];
        function probeNext(n) {
          var filename = 'slide-' + n + '.html';
          return fetch(slideBasePath + filename, { method: 'HEAD' })
            .then(function(res) {
              if (res.ok) {
                slideFiles.push(filename);
                slideTitles.push('Slide ' + n);
                return probeNext(n + 1);
              }
            })
            .catch(function() { /* stop probing */ });
        }
        return probeNext(1).then(function() {
          totalSlides = slideFiles.length;
          if (totalSlides === 0) throw new Error('No slides found');
        });
      }

      function init() {
        discoverViaManifest()
          .catch(function() { return discoverViaProbe(); })
          .then(function() {
            loadingEl.style.display = 'none';
            renderSidebar();
            scaleSlide();
            goToSlide(1);
          })
          .catch(function(err) {
            loadingEl.textContent = 'Error: No slides found for deck "' + DECK_ID + '"';
          });
      }

      init();
    })();
  </script>
</body>
</html>`;
  }

  /**
   * Serve a static file from the workspace, with path traversal protection.
   *
   * Security: resolves the full path and verifies it starts with workspaceRoot
   * to prevent directory traversal attacks (../ escaping workspace boundary).
   *
   * Sets Cache-Control: no-store on all responses to support the live-refresh
   * workflow where users rebuild slides and refresh the browser.
   *
   * Story Reference: pd-1-1 Task 4, AC-2, AC-3, AC-4, AC-5, AC-6
   */
  private async serveFile(pathname: string, res: http.ServerResponse, method: string = 'GET'): Promise<void> {
    // Resolve the full filesystem path
    const filePath = path.join(this.workspaceRoot, pathname);
    const resolved = path.resolve(filePath);

    // Security: containment check — path must stay within workspace root
    const normalizedRoot = path.resolve(this.workspaceRoot);
    if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHead = method === 'HEAD';

    try {
      if (isHead) {
        // HEAD: stat only — return headers without reading file body
        const stat = await fs.stat(resolved);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Cache-Control': 'no-store',
        });
        res.end();
        return;
      }

      const data = await fs.readFile(resolved);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      });
      res.end(data);
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(isHead ? undefined : 'Not Found');
      } else {
        this.outputChannel.appendLine(
          `[PresentServer] File read error for ${pathname}: ${error.message}`
        );
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(isHead ? undefined : 'Internal Server Error');
      }
    }
  }
}
