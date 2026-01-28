#!/usr/bin/env node
/**
 * Regenerate viewer index.html from template
 * Usage: node scripts/regenerate-viewer.js [deck-slug]
 *
 * If no deck-slug provided, reads from .slide-builder/status.yaml
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

function extractTitle(htmlContent, slideNum) {
    // Try h1 first
    const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    // Try title tag
    const titleMatch = htmlContent.match(/<title>Slide \d+:\s*([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    return `Slide ${slideNum}`;
}

function main() {
    // Get deck slug from arg or status.yaml
    let deckSlug = process.argv[2];

    if (!deckSlug) {
        const statusPath = path.join(PROJECT_ROOT, '.slide-builder', 'status.yaml');
        if (!fs.existsSync(statusPath)) {
            console.error('Error: No deck slug provided and no status.yaml found');
            process.exit(1);
        }
        const status = readYaml(statusPath);
        deckSlug = status.current_deck_slug || status.deck_slug;
        if (!deckSlug) {
            console.error('Error: No deck_slug found in status.yaml');
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

    // Build slide list
    const slideList = slideFiles.map(filename => {
        const num = parseInt(filename.match(/\d+/)[0]);
        const htmlContent = fs.readFileSync(path.join(slidesFolder, filename), 'utf-8');
        const title = extractTitle(htmlContent, num);
        return { number: num, filename, title };
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

    // Generate manifest.json first
    const manifestPath = path.join(slidesFolder, 'manifest.json');
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
