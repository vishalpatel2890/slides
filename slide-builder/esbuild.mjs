import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import * as fs from 'fs';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').Plugin} */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      console.log('[watch] build finished');
    });
  }
};

/**
 * Creates a Tailwind CSS plugin for a specific webview entry.
 * @param {string} inputCss - Path to the CSS entry file
 * @param {string} outputCss - Path to the CSS output file
 */
function createTailwindPlugin(inputCss, outputCss) {
  return {
    name: `tailwind-css-${outputCss}`,
    setup(build) {
      build.onEnd(async () => {
        try {
          execSync(`npx @tailwindcss/cli -i ${inputCss} -o ${outputCss} --minify`, {
            stdio: 'inherit'
          });
        } catch (error) {
          console.error(`Tailwind CSS build failed for ${outputCss}:`, error.message);
        }
      });
    }
  };
}

// Extension host build configuration (Node.js)
async function buildExtension() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode', 'puppeteer'],
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Plan webview build configuration (Browser)
async function buildPlanWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/plan/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'dist/plan-webview.js',
    jsx: 'automatic',
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin,
      createTailwindPlugin('./src/webview/plan/styles/index.css', './dist/plan-webview.css')
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Catalog webview build configuration (Browser)
async function buildCatalogWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/catalog/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'dist/catalog-webview.js',
    jsx: 'automatic',
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin,
      createTailwindPlugin('./src/webview/catalog/styles/index.css', './dist/catalog-webview.css')
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Viewer webview build configuration (Browser) - scaffold only
async function buildViewerWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/viewer/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'dist/viewer-webview.js',
    jsx: 'automatic',
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin,
      createTailwindPlugin('./src/webview/viewer/styles/index.css', './dist/viewer-webview.css')
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Deck Template Editor webview build configuration (Browser)
async function buildDeckTemplateEditorWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/deck-template-editor/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'dist/deck-template-editor.js',
    jsx: 'automatic',
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin,
      createTailwindPlugin('./src/webview/deck-template-editor/editor.css', './dist/deck-template-editor.css')
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Theme Editor webview build configuration (Browser)
// Story Reference: bt-2-1 Task 5 — AC-5, follows buildCatalogWebview() pattern
async function buildThemeEditorWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/theme-editor/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'dist/theme-editor-webview.js',
    jsx: 'automatic',
    logLevel: 'warning',
    plugins: [
      esbuildProblemMatcherPlugin,
      createTailwindPlugin('./src/webview/theme-editor/styles/index.css', './dist/theme-editor-webview.css')
    ]
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Run all builds
Promise.all([buildExtension(), buildPlanWebview(), buildCatalogWebview(), buildViewerWebview(), buildDeckTemplateEditorWebview(), buildThemeEditorWebview()])
  .then(() => {
    if (!watch) {
      console.log('Build completed successfully');
    }
  })
  .catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
