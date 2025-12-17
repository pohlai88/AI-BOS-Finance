#!/usr/bin/env node
/**
 * Bundle Size Analyzer for BioSkin
 *
 * Validates all 10 optimization levers by measuring actual bundle sizes.
 * Uses esbuild to bundle each entry point and measures raw + gzip sizes.
 *
 * Usage:
 *   node scripts/analyze-bundle.mjs
 *   node scripts/analyze-bundle.mjs --ci  # Fails if over budget
 *
 * @see OPTIMIZATION_LEVERS.md for the complete optimization guide
 */

import * as esbuild from 'esbuild';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, '.bundle-analysis');

// ============================================================
// SIZE BUDGETS (in KB, gzipped)
// 
// These are STANDALONE bundle sizes including dependencies.
// Actual consumer bundle sizes will be smaller due to:
// - Shared dependencies (motion, date-fns deduped)
// - Tree-shaking of unused code
// - Next.js chunking
// ============================================================

const BUDGETS = {
  // Core (minimal, no motion)
  'atoms': 10,          // Btn, Surface, Txt, Field + tailwind-merge + clsx

  // Molecules (include motion)
  'spinner': 50,        // Spinner + motion dependency

  // Heavy components (include their deps)
  'table': 80,          // BioTable + TanStack + motion
  'chart': 50,          // BioChart + motion
  'kanban': 75,         // BioKanban + DnD-kit + motion
  'calendar': 15,       // BioCalendar + date-fns (lean!)
  'gantt': 50,          // BioGantt + date-fns + motion
  'form': 65,           // BioForm + react-hook-form + motion
  'layout': 70,         // AppShell + cmdk + sonner + motion

  // Full bundle (reference)
  'full': 160,
};

// ============================================================
// ENTRY POINTS TO TEST
// ============================================================

const ENTRY_POINTS = {
  'atoms': `
    import { Btn, Surface, Txt, Field, cn } from '@aibos/bioskin/atoms';
    export { Btn, Surface, Txt, Field, cn };
  `,
  'spinner': `
    import { Spinner } from '@aibos/bioskin';
    export { Spinner };
  `,
  'table': `
    import { BioTable, BioTableVirtual } from '@aibos/bioskin/table';
    export { BioTable, BioTableVirtual };
  `,
  'chart': `
    import { BioChart } from '@aibos/bioskin/chart';
    export { BioChart };
  `,
  'kanban': `
    import { BioKanban } from '@aibos/bioskin/kanban';
    export { BioKanban };
  `,
  'calendar': `
    import { BioCalendar } from '@aibos/bioskin/calendar';
    export { BioCalendar };
  `,
  'gantt': `
    import { BioGantt } from '@aibos/bioskin/gantt';
    export { BioGantt };
  `,
  'form': `
    import { BioForm } from '@aibos/bioskin/form';
    export { BioForm };
  `,
  'layout': `
    import { BioAppShell, BioSidebar, BioNavbar, BioCommandPalette } from '@aibos/bioskin/layout';
    export { BioAppShell, BioSidebar, BioNavbar, BioCommandPalette };
  `,
  'full': `
    export * from '@aibos/bioskin';
  `,
};

// ============================================================
// BUNDLE ANALYSIS
// ============================================================

async function analyzeEntry(name, code) {
  const entryFile = join(DIST, `entry-${name}.tsx`);
  const outFile = join(DIST, `bundle-${name}.js`);

  // Write entry file
  writeFileSync(entryFile, code);

  try {
    // Bundle with esbuild
    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      treeShaking: true,
      metafile: true,
      external: [
        // Peer dependencies (not bundled)
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'zod',
        'lucide-react',
        // Server-only
        'server-only',
      ],
      alias: {
        '@aibos/bioskin': join(ROOT, 'src/index.ts'),
        '@aibos/bioskin/table': join(ROOT, 'src/table.ts'),
        '@aibos/bioskin/chart': join(ROOT, 'src/chart.ts'),
        '@aibos/bioskin/kanban': join(ROOT, 'src/kanban.ts'),
        '@aibos/bioskin/calendar': join(ROOT, 'src/calendar.ts'),
        '@aibos/bioskin/gantt': join(ROOT, 'src/gantt.ts'),
        '@aibos/bioskin/form': join(ROOT, 'src/form.ts'),
        '@aibos/bioskin/layout': join(ROOT, 'src/layout.ts'),
        '@aibos/bioskin/server': join(ROOT, 'src/server.ts'),
        '@aibos/bioskin/atoms': join(ROOT, 'src/atoms.ts'),
      },
      logLevel: 'silent',
    });

    // Read output
    const bundleContent = readFileSync(outFile);
    const rawSize = bundleContent.length;
    const gzipSize = gzipSync(bundleContent).length;
    const brotliSize = brotliCompressSync(bundleContent).length;

    // Count modules in metafile
    const moduleCount = Object.keys(result.metafile?.inputs || {}).length;

    return {
      name,
      rawSize,
      gzipSize,
      brotliSize,
      moduleCount,
      budget: BUDGETS[name] || null,
      overBudget: BUDGETS[name] ? gzipSize / 1024 > BUDGETS[name] : false,
    };
  } catch (error) {
    return {
      name,
      error: error.message,
      rawSize: 0,
      gzipSize: 0,
      brotliSize: 0,
      moduleCount: 0,
      budget: BUDGETS[name] || null,
      overBudget: false,
    };
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function main() {
  const isCI = process.argv.includes('--ci');
  const results = [];

  console.log('\n📦 BioSkin Bundle Size Analysis\n');
  console.log('='.repeat(80));

  // Create dist directory
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true });
  }
  mkdirSync(DIST, { recursive: true });

  // Analyze each entry point
  for (const [name, code] of Object.entries(ENTRY_POINTS)) {
    const result = await analyzeEntry(name, code);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${name.padEnd(15)} ERROR: ${result.error}`);
    } else {
      const status = result.overBudget ? '❌' : '✅';
      const budgetInfo = result.budget
        ? ` (budget: ${result.budget}KB)`
        : '';
      console.log(
        `${status} ${name.padEnd(15)} ` +
        `raw: ${formatSize(result.rawSize).padEnd(12)} ` +
        `gzip: ${formatSize(result.gzipSize).padEnd(12)} ` +
        `brotli: ${formatSize(result.brotliSize).padEnd(12)} ` +
        `modules: ${result.moduleCount}` +
        budgetInfo
      );
    }
  }

  console.log('='.repeat(80));

  // Summary
  const overBudget = results.filter(r => r.overBudget);
  const hasErrors = results.filter(r => r.error);

  if (overBudget.length > 0) {
    console.log('\n⚠️  OVER BUDGET:');
    for (const r of overBudget) {
      const actual = (r.gzipSize / 1024).toFixed(2);
      console.log(`   - ${r.name}: ${actual}KB > ${r.budget}KB`);
    }
  }

  if (hasErrors.length > 0) {
    console.log('\n❌ ERRORS:');
    for (const r of hasErrors) {
      console.log(`   - ${r.name}: ${r.error}`);
    }
  }

  // Tree-shaking validation
  console.log('\n📊 Tree-Shaking Validation:');
  const atomsResult = results.find(r => r.name === 'atoms');
  const calendarResult = results.find(r => r.name === 'calendar');
  const fullResult = results.find(r => r.name === 'full');

  if (atomsResult && fullResult && !atomsResult.error && !fullResult.error) {
    const reduction = ((1 - atomsResult.gzipSize / fullResult.gzipSize) * 100).toFixed(1);
    console.log(`   - atoms is ${reduction}% smaller than full bundle`);

    if (atomsResult.gzipSize < fullResult.gzipSize * 0.05) {
      console.log('   ✅ Tree-shaking is working! Atoms are < 5% of full bundle.');
    } else if (atomsResult.gzipSize < fullResult.gzipSize * 0.1) {
      console.log('   ✅ Tree-shaking is working! Atoms are < 10% of full bundle.');
    } else {
      console.log('   ⚠️  Tree-shaking may not be optimal.');
    }
  }

  if (calendarResult && fullResult && !calendarResult.error && !fullResult.error) {
    const reduction = ((1 - calendarResult.gzipSize / fullResult.gzipSize) * 100).toFixed(1);
    console.log(`   - calendar is ${reduction}% smaller than full bundle (lightest heavy component)`);
  }

  // Write results to JSON
  const reportPath = join(DIST, 'bundle-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report: ${reportPath}`);

  // CI mode: exit with error if over budget
  if (isCI && (overBudget.length > 0 || hasErrors.length > 0)) {
    console.log('\n❌ CI check failed: bundle size over budget or errors');
    process.exit(1);
  }

  console.log('\n✅ Bundle analysis complete!\n');
}

main().catch(console.error);
