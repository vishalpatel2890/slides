#!/usr/bin/env node
/**
 * Universal save server for all slide decks
 * - Handles saves for ANY deck via path: /{deck-slug}/slides/...
 * - Does NOT serve files - open index.html directly or via VS Code Live Server
 * - Run once, works for all decks
 *
 * Usage: node scripts/save-server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const REGENERATE_SCRIPT = path.join(__dirname, 'regenerate-viewer.js');
const port = parseInt(process.argv[2]) || 3000;

/**
 * Regenerate viewer index.html after manifest save
 * Runs async so it doesn't block the response
 */
function regenerateViewer(deckSlug) {
    execFile('node', [REGENERATE_SCRIPT, deckSlug], (err, stdout, stderr) => {
        if (err) {
            console.error(`⚠️  [${deckSlug}] Viewer regeneration failed:`, err.message);
            return;
        }
        console.log(`🔄 [${deckSlug}] Viewer regenerated`);
    });
}

function findDecks() {
    if (!fs.existsSync(OUTPUT_DIR)) return [];

    return fs.readdirSync(OUTPUT_DIR)
        .filter(d => {
            const fullPath = path.join(OUTPUT_DIR, d);
            const planPath = path.join(fullPath, 'plan.yaml');
            return fs.statSync(fullPath).isDirectory() && fs.existsSync(planPath);
        });
}

const server = http.createServer((req, res) => {
    // CORS headers - allow requests from file:// and any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle GET /status (connection check + list decks)
    if (req.method === 'GET' && req.url === '/status') {
        const decks = findDecks();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'connected', decks, editable: true }));
        return;
    }

    // Parse path: /{deck-slug}/slides/{file}
    const match = req.url.match(/^\/([^/]+)\/slides\/(manifest\.json|slide-\d+\.html)$/);

    if (!match) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid path. Use: /{deck-slug}/slides/{file}' }));
        return;
    }

    const [, deckSlug, fileName] = match;
    const deckFolder = path.join(OUTPUT_DIR, deckSlug);

    // Verify deck exists
    if (!fs.existsSync(deckFolder)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Deck not found: ${deckSlug}` }));
        return;
    }

    // Handle PUT requests (save)
    if (req.method === 'PUT') {
        const isManifest = fileName === 'manifest.json';
        const expectedContentType = isManifest ? 'application/json' : 'text/html';
        const contentType = req.headers['content-type'] || '';

        if (!contentType.includes(expectedContentType.split('/')[1])) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Content-Type must be ${expectedContentType}` }));
            return;
        }

        let body = '';
        let bodySize = 0;
        const MAX_SIZE = 5 * 1024 * 1024;

        req.on('data', chunk => {
            bodySize += chunk.length;
            if (bodySize > MAX_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Payload too large (max 5MB)' }));
                req.destroy();
                return;
            }
            body += chunk;
        });

        req.on('end', () => {
            if (bodySize > MAX_SIZE) return;

            try {
                const filePath = path.join(deckFolder, 'slides', fileName);
                const tmpPath = filePath + '.tmp';

                // Atomic write
                fs.writeFileSync(tmpPath, body);
                fs.renameSync(tmpPath, filePath);

                console.log(`✅ [${deckSlug}] Saved ${fileName}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    deck: deckSlug,
                    path: `slides/${fileName}`,
                    timestamp: new Date().toISOString()
                }));

                // Regenerate viewer so FALLBACK_SLIDES stays in sync
                if (isManifest) {
                    regenerateViewer(deckSlug);
                }
            } catch (e) {
                console.error(`❌ [${deckSlug}] Failed to save ${fileName}:`, e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // Handle GET requests (read file - useful for debugging)
    if (req.method === 'GET') {
        const filePath = path.join(deckFolder, 'slides', fileName);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const contentType = fileName.endsWith('.json') ? 'application/json' : 'text/html';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (e) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
});

server.listen(port, () => {
    const decks = findDecks();
    console.log(`\n💾 Universal Save Server`);
    console.log(`🔗 http://localhost:${port}`);
    console.log(`\n📂 Available decks (${decks.length}):`);
    decks.forEach(d => {
        console.log(`   • ${d}`);
        console.log(`     file://${path.join(OUTPUT_DIR, d, 'index.html')}`);
    });
    console.log(`\n📝 API:`);
    console.log(`   GET  /status`);
    console.log(`   PUT  /{deck}/slides/slide-N.html`);
    console.log(`   PUT  /{deck}/slides/manifest.json`);
    console.log(`\nPress Ctrl+C to stop\n`);
});
