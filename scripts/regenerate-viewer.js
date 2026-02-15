#!/usr/bin/env node
/**
 * Regenerate viewer index.html from template
 * Usage: node scripts/regenerate-viewer.js [deck-slug]
 *
 * If no deck-slug provided, auto-detects from output/ directory.
 * - One deck: auto-selects it
 * - Multiple decks: lists them and exits with usage message
 */

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

function extractSlideId(htmlContent) {
    // Extract data-slide-id from the .slide div
    const match = htmlContent.match(/<div[^>]*class="slide"[^>]*data-slide-id="([^"]+)"/i) ||
                  htmlContent.match(/data-slide-id="([^"]+)"[^>]*class="slide"/i);
    return match ? match[1] : null;
}

function extractTitle(htmlContent, slideNum) {
    // Try h1 first (handle nested HTML by capturing all content then stripping tags)
    const h1Match = htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        const stripped = h1Match[1].replace(/<[^>]+>/g, '').trim();
        if (stripped) return stripped;
    }

    // Try title tag
    const titleMatch = htmlContent.match(/<title>Slide \d+:\s*([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    return `Slide ${slideNum}`;
}

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
            decks.forEach(d => console.error(`  node scripts/regenerate-viewer.js ${d.slug}`));
            console.error('');
            process.exit(1);
        }
    }

    console.log(`Regenerating viewer for deck: ${deckSlug}`);

    // Paths
    const outputFolder = path.join(PROJECT_ROOT, 'output', deckSlug);
    const slidesFolder = path.join(outputFolder, 'slides');
    const templatePath = path.join(PROJECT_ROOT, '.slide-builder', 'templates', 'viewer-template.html');
    const planPath = path.join(outputFolder, 'plan.yaml');
    const outputPath = path.join(outputFolder, 'index.html');

    // Verify paths exist
    if (!fs.existsSync(slidesFolder)) {
        console.error(`Error: Slides folder not found: ${slidesFolder}`);
        process.exit(1);
    }
    if (!fs.existsSync(templatePath)) {
        console.error(`Error: Viewer template not found: ${templatePath}`);
        process.exit(1);
    }

    // Discover slides
    const slideFiles = fs.readdirSync(slidesFolder)
        .filter(f => /^slide-\d+\.html$/.test(f))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });

    if (slideFiles.length === 0) {
        console.error('Error: No slides found in', slidesFolder);
        process.exit(1);
    }

    console.log(`Found ${slideFiles.length} slides`);

    // Load existing manifest to preserve animations by data-slide-id (stable identity)
    // Falls back to title matching for backwards compatibility
    const manifestPath = path.join(slidesFolder, 'manifest.json');
    let existingAnimationsById = {};
    let existingAnimationsByTitle = {};
    if (fs.existsSync(manifestPath)) {
        try {
            const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            if (existingManifest.slides) {
                existingManifest.slides.forEach(slide => {
                    if (slide.animations) {
                        if (slide.slideId) {
                            existingAnimationsById[slide.slideId] = slide.animations;
                        }
                        if (slide.title) {
                            existingAnimationsByTitle[slide.title] = slide.animations;
                        }
                    }
                });
                const idCount = Object.keys(existingAnimationsById).length;
                const titleCount = Object.keys(existingAnimationsByTitle).length;
                if (idCount > 0) {
                    console.log(`Preserving animations for ${idCount} slides (matched by data-slide-id)`);
                } else if (titleCount > 0) {
                    console.log(`Preserving animations for ${titleCount} slides (matched by title, legacy)`);
                }
            }
        } catch (e) {
            console.warn('Warning: Could not parse existing manifest');
        }
    }

    // Build slide list (preserving animations by slideId, falling back to title)
    const slideList = slideFiles.map(filename => {
        const num = parseInt(filename.match(/\d+/)[0]);
        const htmlContent = fs.readFileSync(path.join(slidesFolder, filename), 'utf-8');
        const slideId = extractSlideId(htmlContent);
        const title = extractTitle(htmlContent, num);
        const slide = { number: num, filename, title };
        if (slideId) {
            slide.slideId = slideId;
        }
        // Prefer slideId match, fall back to title match
        if (slideId && existingAnimationsById[slideId]) {
            slide.animations = existingAnimationsById[slideId];
        } else if (existingAnimationsByTitle[title]) {
            slide.animations = existingAnimationsByTitle[title];
        }
        return slide;
    });

    // Build separate HTML content map for export (base64 encoded to avoid JSON escaping issues)
    const slideHtmlContent = slideFiles.map(filename => {
        const htmlContent = fs.readFileSync(path.join(slidesFolder, filename), 'utf-8');
        return Buffer.from(htmlContent).toString('base64');
    });

    // Get deck name from plan.yaml if exists
    let deckName = deckSlug;
    if (fs.existsSync(planPath)) {
        const plan = readYaml(planPath);
        deckName = plan.deck_name || deckSlug;
    }

    // Generate manifest.json (manifestPath already defined above)
    const manifest = {
        deckName: deckName,
        generatedAt: new Date().toISOString(),
        slides: slideList
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Manifest generated: ${manifestPath}`);

    // Load and populate template
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template.replace(/\{\{DECK_NAME\}\}/g, deckName);
    template = template.replace(/\{\{DECK_SLUG\}\}/g, deckSlug);
    template = template.replace(/\{\{TOTAL_SLIDES\}\}/g, slideList.length.toString());
    template = template.replace(/\{\{SLIDE_LIST\}\}/g, JSON.stringify(slideList, null, 2));
    template = template.replace(/\{\{SLIDE_HTML_BASE64\}\}/g, JSON.stringify(slideHtmlContent));

    // Write viewer
    fs.writeFileSync(outputPath, template);

    console.log(`✅ Viewer regenerated: ${outputPath}`);
    console.log(`   Slides: ${slideList.length}`);
    console.log(`   Deck: ${deckName}`);
}

main();
