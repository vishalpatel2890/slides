#!/usr/bin/env node
/**
 * Backfill data-slide-id attributes on existing slides
 * One-time migration script
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');

function generateSlideId() {
    // Generate a short, URL-safe ID (8 chars)
    return crypto.randomBytes(4).toString('hex');
}

function backfillDeck(deckSlug) {
    const slidesDir = path.join(OUTPUT_DIR, deckSlug, 'slides');
    if (!fs.existsSync(slidesDir)) {
        console.log(`  Skipping ${deckSlug} - no slides folder`);
        return 0;
    }

    const slideFiles = fs.readdirSync(slidesDir)
        .filter(f => /^slide-\d+\.html$/.test(f));

    let updated = 0;
    for (const filename of slideFiles) {
        const filePath = path.join(slidesDir, filename);
        let html = fs.readFileSync(filePath, 'utf-8');

        // Check if has a proper hex ID (8+ chars) - skip those
        const existingMatch = html.match(/data-slide-id="([^"]+)"/);
        if (existingMatch && /^[a-f0-9]{8,}$/.test(existingMatch[1])) {
            continue; // Already has a proper random ID
        }

        const slideId = generateSlideId();

        // Replace existing numeric or short ID
        if (existingMatch) {
            html = html.replace(
                /data-slide-id="[^"]+"/g,
                `data-slide-id="${slideId}"`
            );
            console.log(`  ${filename}: ${existingMatch[1]} → ${slideId}`);
        } else {
            // Add new data-slide-id to the .slide div
            html = html.replace(
                /<div class="slide"([^>]*)>/,
                `<div class="slide" data-slide-id="${slideId}"$1>`
            );
            console.log(`  ${filename} → ${slideId}`);
        }

        fs.writeFileSync(filePath, html);
        updated++;
    }

    return updated;
}

function main() {
    console.log('Backfilling data-slide-id attributes...\n');

    const decks = fs.readdirSync(OUTPUT_DIR)
        .filter(d => {
            const fullPath = path.join(OUTPUT_DIR, d);
            return fs.statSync(fullPath).isDirectory() &&
                   fs.existsSync(path.join(fullPath, 'slides'));
        });

    let totalUpdated = 0;
    for (const deck of decks) {
        console.log(`Deck: ${deck}`);
        const count = backfillDeck(deck);
        totalUpdated += count;
        if (count === 0) {
            console.log('  All slides already have IDs');
        }
    }

    console.log(`\n✅ Backfill complete. Updated ${totalUpdated} slides.`);
}

main();
