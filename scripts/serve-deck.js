#!/usr/bin/env node
/**
 * Local development server for slide decks
 * - Serves static files from output/{deck}/
 * - Accepts PUT to slides/manifest.json to save animations
 *
 * Usage: node scripts/serve-deck.js [deck-slug] [port]
 *
 * If no deck-slug provided, auto-detects from output/ directory.
 * - One deck: auto-selects it
 * - Multiple decks: lists them and exits with usage message
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

function readYaml(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
            result[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
    });
    return result;
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function findDecks() {
    const outputDir = path.join(PROJECT_ROOT, 'output');
    if (!fs.existsSync(outputDir)) return [];

    return fs.readdirSync(outputDir)
        .filter(d => {
            const fullPath = path.join(outputDir, d);
            const planPath = path.join(fullPath, 'plan.yaml');
            return fs.statSync(fullPath).isDirectory() && fs.existsSync(planPath);
        })
        .map(d => ({
            slug: d,
            mtime: fs.statSync(path.join(outputDir, d)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime);
}

function main() {
    // Get deck slug from arg or auto-detect from output/
    let deckSlug = process.argv[2];
    const port = parseInt(process.argv[3]) || 3000;

    if (!deckSlug) {
        const decks = findDecks();
        if (decks.length === 0) {
            console.error('Error: No decks found in output/ directory.');
            console.error('Run /sb:plan-deck to create a deck first.');
            process.exit(1);
        } else if (decks.length === 1) {
            deckSlug = decks[0].slug;
        } else {
            console.error('Multiple decks found. Please specify which deck:\n');
            decks.forEach(d => console.error(`  node scripts/serve-deck.js ${d.slug}`));
            console.error('');
            process.exit(1);
        }
    }

    const outputFolder = path.join(PROJECT_ROOT, 'output', deckSlug);
    if (!fs.existsSync(outputFolder)) {
        console.error(`Error: Output folder not found: ${outputFolder}`);
        process.exit(1);
    }

    const server = http.createServer((req, res) => {
        // CORS headers for all responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Handle GET /status (connection check)
        if (req.method === 'GET' && req.url === '/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'connected', deck: deckSlug, editable: true }));
            return;
        }

        // Handle PUT to manifest.json (save animations)
        if (req.method === 'PUT' && req.url === '/slides/manifest.json') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const manifestPath = path.join(outputFolder, 'slides', 'manifest.json');
                    fs.writeFileSync(manifestPath, body);
                    console.log('✅ Saved animations to manifest.json');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    console.error('Failed to save manifest:', e.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // Handle PUT to slide HTML files (save edits)
        const slideMatch = req.url.match(/^\/slides\/(slide-\d+\.html)$/);
        if (req.method === 'PUT' && slideMatch) {
            const slideFile = slideMatch[1];
            const contentType = req.headers['content-type'] || '';

            // Validate content type
            if (!contentType.includes('text/html')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Content-Type must be text/html' }));
                return;
            }

            let body = '';
            let bodySize = 0;
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit

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
                if (bodySize > MAX_SIZE) return; // Already handled

                try {
                    const slidePath = path.join(outputFolder, 'slides', slideFile);
                    const tmpPath = slidePath + '.tmp';

                    // Atomic write: write to .tmp file first, then rename
                    fs.writeFileSync(tmpPath, body);
                    fs.renameSync(tmpPath, slidePath);

                    console.log(`✅ Saved ${slideFile}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        path: `slides/${slideFile}`,
                        timestamp: new Date().toISOString()
                    }));
                } catch (e) {
                    console.error(`❌ Failed to save ${slideFile}:`, e.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
            return;
        }

        // Handle GET requests (serve static files)
        let filePath = req.url.split('?')[0]; // Remove query string
        if (filePath === '/') filePath = '/index.html';

        const fullPath = path.join(outputFolder, filePath);

        // Security: prevent directory traversal
        if (!fullPath.startsWith(outputFolder)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(fullPath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not found');
                } else {
                    res.writeHead(500);
                    res.end('Server error');
                }
                return;
            }

            const ext = path.extname(fullPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    server.listen(port, () => {
        console.log(`\n🎯 Serving deck: ${deckSlug}`);
        console.log(`📁 From: ${outputFolder}`);
        console.log(`\n🌐 Open: http://localhost:${port}`);
        console.log(`\n💾 Slide edits and animations will auto-save to disk`);
        console.log(`\nPress Ctrl+C to stop\n`);
    });
}

main();
