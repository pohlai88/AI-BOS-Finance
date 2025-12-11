#!/usr/bin/env tsx
/**
 * TOOL_18: Validate Canon Compliance Across Entire Codebase
 * 
 * Validates that all files follow Canon Identity guidelines OR framework conventions:
 * - Framework-specific files (Next.js routing, configs) use default naming per CONT_01 Section 3.7
 * - Next.js App Router files (page.tsx, layout.tsx, route.ts, etc.) are allowed with default naming
 * - Next.js Server Actions (*.actions.ts) are allowed with default naming per ADR_001
 * - Canon-governed files follow Canon patterns (TOOL_XX, REF_XXX, etc.)
 * - Documents are in correct Canon planes
 * 
 * Framework Files Allowed (per CONT_01 Section 3.7):
 * - Next.js App Router: page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, etc.
 * - Next.js Pages Router: _app.tsx, _document.tsx, index.tsx, etc.
 * - Next.js Root: middleware.ts, next-env.d.ts
 * - Server Actions: *.actions.ts (per ADR_001)
 * - Config files: package.json, tsconfig.json, next.config.js, etc.
 * - Generic utilities: utils.ts, helpers.ts, constants.ts, etc.
 * 
 * Usage:
 *   npm run canon:validate-compliance
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, basename, dirname, extname } from 'path';

const ROOT = process.cwd();

// Framework-specific file patterns (excluded from Canon governance per CONT_01 Section 3.7)
const FRAMEWORK_PATTERNS = {
  // Next.js App Router conventions (Next.js 14+)
  nextjsAppRouter: [
    /^page\.tsx?$/,           // app/**/page.tsx - route pages
    /^layout\.tsx?$/,         // app/**/layout.tsx - shared layouts
    /^route\.tsx?$/,          // app/**/route.ts - API route handlers
    /^loading\.tsx?$/,        // app/**/loading.tsx - loading UI
    /^error\.tsx?$/,          // app/**/error.tsx - error boundaries
    /^global-error\.tsx?$/,  // app/global-error.tsx - global error boundary
    /^not-found\.tsx?$/,      // app/**/not-found.tsx - 404 pages
    /^template\.tsx?$/,       // app/**/template.tsx - template layouts
    /^default\.tsx?$/,        // app/**/default.tsx - parallel routes default
    /^head\.tsx?$/,           // app/**/head.tsx - custom head (deprecated in App Router)
    /^metadata\.tsx?$/,       // app/**/metadata.tsx - metadata exports
    /^opengraph-image\.(tsx?|png|jpg|jpeg|svg)$/,  // app/**/opengraph-image.*
    /^icon\.(tsx?|png|jpg|jpeg|svg|ico)$/,         // app/**/icon.*
    /^apple-icon\.(tsx?|png|jpg|jpeg)$/,      // app/**/apple-icon.*
    /^twitter-image\.(tsx?|png|jpg|jpeg)$/,   // app/**/twitter-image.*
    /^manifest\.(tsx?|json)$/,                // app/**/manifest.*
    /^sitemap\.(tsx?|xml)$/,                  // app/**/sitemap.*
    /^robots\.(tsx?|txt)$/,                   // app/**/robots.*
    /^favicon\.ico$/,                         // app/favicon.ico
    /^\[.*\]\.tsx?$/,                         // app/**/[param]/page.tsx - dynamic routes
    /^\[\.\.\..*\]\.tsx?$/,                   // app/**/[...slug]/page.tsx - catch-all routes
    /^\(.*\)$/,                               // app/(group)/ - route groups (directories)
  ],
  // Next.js Pages Router conventions
  nextjsPagesRouter: [
    /^_app\.tsx?$/,           // pages/_app.tsx
    /^_document\.tsx?$/,       // pages/_document.tsx
    /^_error\.tsx?$/,          // pages/_error.tsx
    /^index\.tsx?$/,           // pages/index.tsx or pages/**/index.tsx
    /^\[.*\]\.tsx?$/,          // pages/**/[param].tsx - dynamic routes
    /^\[\.\.\..*\]\.tsx?$/,    // pages/**/[...slug].tsx - catch-all routes
  ],
  // Next.js root-level files
  nextjsRoot: [
    /^middleware\.tsx?$/,     // middleware.ts - Next.js middleware
    /^next-env\.d\.ts$/,      // next-env.d.ts - Next.js type definitions
  ],
  // Framework config files (CONT_01 Section 3.7)
  frameworkConfigs: [
    /^package\.json$/,
    /^package-lock\.json$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    /^eslint\.config\.(js|ts|mjs|cjs)$/,
    /^\.eslintrc(\.(js|json|yaml|yml))?$/,
    /^tsconfig\.json$/,
    /^next\.config\.(js|ts|mjs)$/,
    /^vite\.config\.(ts|js)$/,
    /^tailwind\.config\.(ts|js)$/,
    /^postcss\.config\.(js|ts)$/,
    /^turbo\.json$/,
    /^\.prettierrc(\.(js|json|yaml|yml))?$/,
    /^\.prettierignore$/,
    /^\.gitignore$/,
    /^\.env(\.(local|development|production|test))?$/,
    /^\.cursorrules$/,
    /^mcp\.json$/,
  ],
  // Generic utilities (CONT_01 Section 3.7)
  genericUtilities: [
    /^utils?\.tsx?$/,
    /^helpers?\.tsx?$/,
    /^constants?\.tsx?$/,
    /^types?\.tsx?$/,
    /^lib\.tsx?$/,
    /^formatDate\.tsx?$/,
    /^stringUtils?\.tsx?$/,
    /^logger\.tsx?$/,
  ],
  // Next.js Server Actions (per ADR_001)
  nextjsServerActions: [
    /^.*\.actions\.tsx?$/,  // *.actions.ts - Server Actions files
  ],
};

// Canon patterns
const CANON_PATTERNS = {
  TOOL: /^TOOL_\d{2,3}_[A-Za-z0-9_]+\.(ts|js)$/,
  CONT: /^CONT_\d{2,3}_[A-Za-z0-9_]+\.md$/,
  ADR: /^ADR_\d{3}_[A-Za-z0-9_]+\.md$/,
  REF: /^REF_\d{3}_[A-Za-z0-9_]+\.md$/,
  SPEC: /^SPEC_\d{3}_[A-Za-z0-9_]+\.md$/,
  PAGE: /^(PAGE_)?[A-Z]+_\d{2}_[A-Za-z0-9_]+\.tsx?$/,  // META_02_*, PAGE_META_02_*
  COMP: /^(COMP_)?[A-Z0-9]+_[A-Za-z0-9_]+\.tsx?$/,     // TBLM01_*, COMP_TBLM01_*
  ENT: /^ENT_\d{3}_[A-Za-z0-9_]+\.(ts|yaml|yml)$/,
  SCH: /^SCH_\d{3}_[A-Za-z0-9_]+\.(ts|yaml|yml)$/,
  POLY: /^POLY_\d{2,3}_[A-Za-z0-9_]+\.(ts|yaml|yml)$/,
  CONST: /^CONST_\d{2,3}_[A-Za-z0-9_]+\.(ts|yaml|yml)$/,
  MIG: /^MIG_\d{8}_[A-Za-z0-9_]+\.(sql|ts|js)$/,
  INFRA: /^INFRA_\d{2,3}_[A-Za-z0-9_]+\.(tf|yaml|yml|json)$/,
};

interface FileValidation {
  path: string;
  filename: string;
  isValid: boolean;
  category: 'FRAMEWORK' | 'CANON' | 'UTILITY' | 'INVALID' | 'UNKNOWN';
  reason: string;
  issues: string[];
  recommendation?: string;
}

function isFrameworkFile(filepath: string, filename: string): boolean {
  const relativePath = relative(ROOT, filepath);
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize Windows paths
  
  // Check Next.js root-level files (middleware, next-env.d.ts)
  for (const pattern of FRAMEWORK_PATTERNS.nextjsRoot) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  
  // Check if in Next.js app directory
  if (normalizedPath.includes('/app/') || normalizedPath.startsWith('app/')) {
    // Check Next.js App Router patterns
    for (const pattern of FRAMEWORK_PATTERNS.nextjsAppRouter) {
      if (pattern.test(filename)) {
        return true;
      }
    }
    
    // Also check for route groups: (group)/page.tsx
    // Route groups are directories wrapped in parentheses
    if (/^\([^)]+\)$/.test(basename(dirname(filepath)))) {
      // If parent directory is a route group, allow standard App Router files
      for (const pattern of FRAMEWORK_PATTERNS.nextjsAppRouter) {
        if (pattern.test(filename)) {
          return true;
        }
      }
    }
  }
  
  // Check if in Next.js pages directory
  if (normalizedPath.includes('/pages/') || normalizedPath.startsWith('pages/')) {
    // Check Next.js Pages Router patterns
    for (const pattern of FRAMEWORK_PATTERNS.nextjsPagesRouter) {
      if (pattern.test(filename)) {
        return true;
      }
    }
  }
  
  // Check framework configs (anywhere in repo)
  for (const pattern of FRAMEWORK_PATTERNS.frameworkConfigs) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  
  // Check generic utilities (anywhere in repo)
  for (const pattern of FRAMEWORK_PATTERNS.genericUtilities) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  
  // Check Next.js Server Actions (anywhere in repo, per ADR_001)
  for (const pattern of FRAMEWORK_PATTERNS.nextjsServerActions) {
    if (pattern.test(filename)) {
      return true;
    }
  }
  
  return false;
}

function isCanonFile(filename: string): { isValid: boolean; pattern: string; code?: string } {
  for (const [patternName, pattern] of Object.entries(CANON_PATTERNS)) {
    if (pattern.test(filename)) {
      const codeMatch = filename.match(/^([A-Z]+_\d+)/);
      return {
        isValid: true,
        pattern: patternName,
        code: codeMatch ? codeMatch[1] : undefined
      };
    }
  }
  return { isValid: false, pattern: 'NONE' };
}

function validateFile(filepath: string): FileValidation {
  const filename = basename(filepath);
  const relativePath = relative(ROOT, filepath);
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize for cross-platform compatibility
  const issues: string[] = [];
  let category: FileValidation['category'] = 'UNKNOWN';
  let reason = '';
  let recommendation: string | undefined;
  
  // Skip certain directories
  if (normalizedPath.includes('node_modules/') ||
      normalizedPath.includes('.git/') ||
      normalizedPath.includes('.next/') ||
      normalizedPath.includes('dist/') ||
      normalizedPath.includes('build/') ||
      normalizedPath.includes('.turbo/') ||
      normalizedPath.includes('coverage/') ||
      (normalizedPath.startsWith('.') && !normalizedPath.startsWith('./') && 
       !normalizedPath.startsWith('.cursor/') && !normalizedPath.startsWith('.figma/') && 
       !normalizedPath.startsWith('.github/'))) {
    return {
      path: relativePath,
      filename,
      isValid: true,
      category: 'FRAMEWORK',
      reason: 'Excluded directory',
      issues: []
    };
  }
  
  // Check if it's a framework file (allowed with default naming)
  if (isFrameworkFile(filepath, filename)) {
    category = 'FRAMEWORK';
    // Provide more specific reason based on file type
    if (normalizedPath.includes('/app/') || normalizedPath.startsWith('app/')) {
      reason = 'Next.js App Router file - allowed with default naming per CONT_01 Section 3.7';
    } else if (normalizedPath.includes('/pages/') || normalizedPath.startsWith('pages/')) {
      reason = 'Next.js Pages Router file - allowed with default naming per CONT_01 Section 3.7';
    } else if (filename === 'middleware.ts' || filename === 'middleware.tsx') {
      reason = 'Next.js middleware file - allowed with default naming per CONT_01 Section 3.7';
    } else if (filename.endsWith('.actions.ts') || filename.endsWith('.actions.tsx')) {
      reason = 'Next.js Server Actions file - allowed with default naming per ADR_001 and CONT_01 Section 3.7';
    } else {
      reason = 'Framework-specific file (config/utility) - allowed with default naming per CONT_01 Section 3.7';
    }
    return { path: relativePath, filename, isValid: true, category, reason, issues };
  }
  
  // Check if it's a README (allowed in any directory)
  if (filename === 'README.md') {
    category = 'FRAMEWORK';
    reason = 'README file - standard documentation';
    return { path: relativePath, filename, isValid: true, category, reason, issues };
  }
  
  // Check if it's in a Canon directory (use normalized path for cross-platform compatibility)
  if (normalizedPath.startsWith('canon/')) {
    const canonCheck = isCanonFile(filename);
    if (canonCheck.isValid) {
      category = 'CANON';
      reason = `Canon file following ${canonCheck.pattern} pattern`;
      return { path: relativePath, filename, isValid: true, category, reason, issues, recommendation: canonCheck.code };
    } else {
      // In Canon directory but doesn't follow pattern
      category = 'INVALID';
      reason = 'File in Canon directory must follow Canon naming pattern';
      issues.push(`Expected pattern: TOOL_XX_*, CONT_XX_*, ADR_XXX_*, REF_XXX_*, etc.`);
      
      // Provide specific recommendation based on directory (use normalized path)
      if (normalizedPath.includes('/D-TOOL/')) {
        recommendation = `Rename to: TOOL_XX_${filename.replace(/\.(ts|js)$/, '')}.ts`;
      } else if (normalizedPath.includes('/E-REF/')) {
        recommendation = `Rename to: REF_XXX_${filename.replace('.md', '')}.md`;
      } else if (normalizedPath.includes('/E-SPEC/')) {
        recommendation = `Rename to: SPEC_XXX_${filename.replace('.md', '')}.md`;
      }
      
      return { path: relativePath, filename, isValid: false, category, reason, issues, recommendation };
    }
  }
  
  // Check if it's a Canon-governed file outside Canon directory
  const canonCheck = isCanonFile(filename);
  if (canonCheck.isValid) {
    category = 'CANON';
    reason = `Canon file (${canonCheck.pattern}) but outside canon/ directory`;
    issues.push(`Should be moved to appropriate Canon plane directory`);
    
    // Suggest correct location
    if (canonCheck.pattern === 'TOOL') {
      recommendation = 'Move to: canon/D-Operations/D-TOOL/';
    } else if (canonCheck.pattern === 'REF') {
      recommendation = 'Move to: canon/E-Knowledge/E-REF/';
    } else if (canonCheck.pattern === 'SPEC') {
      recommendation = 'Move to: canon/E-Knowledge/E-SPEC/';
    }
    
    return { path: relativePath, filename, isValid: false, category, reason, issues, recommendation };
  }
  
  // Unknown file - might be valid utility or needs review
  category = 'UNKNOWN';
  reason = 'File does not match Canon or framework patterns';
  issues.push('Review if this should have Canon ID or is a valid utility');
  
  return { path: relativePath, filename, isValid: true, category, reason, issues };
}

function scanDirectory(dirPath: string, results: FileValidation[]): void {
  if (!existsSync(dirPath)) return;
  
  const entries = readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    // Skip certain directories
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') && entry.name !== '.cursor' && entry.name !== '.figma' && entry.name !== '.github') {
        continue;
      }
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      scanDirectory(fullPath, results);
    } else if (entry.isFile()) {
      // Only check relevant file types
      const ext = extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx', '.md', '.yaml', '.yml', '.json', '.sql', '.tf'].includes(ext) ||
          entry.name === 'package.json' || entry.name === '.gitignore' || entry.name === '.cursorrules') {
        results.push(validateFile(fullPath));
      }
    }
  }
}

async function main() {
  console.log('🔍 TOOL_18: Validate Canon Compliance Across Codebase\n');
  console.log('Validating files against Canon Identity guidelines (CONT_01)...\n');
  console.log('Framework files (Next.js routing/configs) are allowed with default naming.\n');
  console.log('Canon-governed files must follow Canon patterns.\n');
  
  const results: FileValidation[] = [];
  
  // Scan key directories
  const scanDirs = [
    join(ROOT, 'canon'),
    join(ROOT, 'src'),
    join(ROOT, 'apps'),
    join(ROOT, 'packages'),
  ];
  
  for (const dir of scanDirs) {
    if (existsSync(dir)) {
      scanDirectory(dir, results);
    }
  }
  
  // Also check root level files
  const rootFiles = readdirSync(ROOT)
    .filter(f => {
      const fullPath = join(ROOT, f);
      const stat = statSync(fullPath);
      return stat.isFile() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.md') || f === 'package.json');
    });
  
  for (const file of rootFiles) {
    results.push(validateFile(join(ROOT, file)));
  }
  
  // Categorize results
  const framework = results.filter(r => r.category === 'FRAMEWORK');
  const canon = results.filter(r => r.category === 'CANON' && r.isValid);
  const invalid = results.filter(r => !r.isValid);
  const unknown = results.filter(r => r.category === 'UNKNOWN');
  
  console.log('📋 Validation Results:\n');
  
  // Show invalid files first
  if (invalid.length > 0) {
    console.log('❌ Invalid Files (Must Fix):\n');
    invalid.forEach(r => {
      console.log(`  ${r.path}`);
      r.issues.forEach(issue => console.log(`    └─ ${issue}`));
      if (r.recommendation) {
        console.log(`    💡 ${r.recommendation}`);
      }
    });
    console.log('');
  }
  
  // Show summary
  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Framework files (allowed): ${framework.length}`);
  console.log(`   ✅ Canon files (valid): ${canon.length}`);
  console.log(`   ⚠️  Unknown files (review): ${unknown.length}`);
  console.log(`   ❌ Invalid files: ${invalid.length}`);
  console.log(`   📄 Total files scanned: ${results.length}`);
  
  if (invalid.length > 0) {
    console.log('\n🚫 FAILED: Some files do not comply with Canon Identity guidelines.');
    console.log('\n📝 Rules:');
    console.log('   - Framework files (Next.js routing/configs) use default naming');
    console.log('   - Canon files must follow Canon patterns (TOOL_XX, REF_XXX, etc.)');
    console.log('   - Files in canon/ directory MUST follow Canon patterns');
    process.exit(1);
  } else {
    console.log('\n✨ PASSED: All files comply with Canon Identity or framework conventions.');
    
    if (unknown.length > 0) {
      console.log('\n💡 Files to review (may be valid utilities):');
      unknown.slice(0, 10).forEach(r => {
        console.log(`   - ${r.path}`);
      });
      if (unknown.length > 10) {
        console.log(`   ... and ${unknown.length - 10} more`);
      }
    }
  }
}

main().catch(console.error);

// ============================================================================
// DEVELOPER NOTES
// ============================================================================
//
// VALIDATION LOGIC OVERVIEW:
// ---------------------------
// This tool validates files against two sets of rules:
// 1. Framework conventions (Next.js, configs, utilities) - allowed with default naming
// 2. Canon Identity patterns (TOOL_XX, REF_XXX, etc.) - required for Canon-governed files
//
// PATH NORMALIZATION:
// -------------------
// All paths are normalized to use forward slashes (/) for cross-platform compatibility.
// Windows paths (canon\D-TOOL\...) are converted to Unix-style (canon/D-TOOL/...).
// This ensures pattern matching works consistently on all platforms.
//
// FRAMEWORK FILE DETECTION:
// -------------------------
// Framework files are identified by:
// - Location (app/, pages/, root level)
// - Filename pattern (page.tsx, route.ts, middleware.ts, etc.)
// - File extension and naming conventions
//
// Next.js App Router files are only valid when inside app/ directory.
// Next.js Pages Router files are only valid when inside pages/ directory.
// Server Actions (*.actions.ts) are valid anywhere (per ADR_001).
//
// CANON FILE DETECTION:
// ---------------------
// Canon files are identified by:
// - Filename pattern matching CANON_PATTERNS regex
// - Location validation (must be in appropriate canon/ subdirectory)
//
// Files in canon/ directory MUST follow Canon patterns.
// Files with Canon patterns outside canon/ are flagged for relocation.
//
// ADDING NEW FRAMEWORK PATTERNS:
// ------------------------------
// To add support for new framework conventions:
// 1. Add pattern to appropriate FRAMEWORK_PATTERNS array
// 2. Update isFrameworkFile() if location-specific logic is needed
// 3. Update reason message in validateFile() for better error messages
//
// Example:
//   nextjsAppRouter: [
//     /^new-convention\.tsx?$/,  // Add new pattern
//   ],
//
// ADDING NEW CANON PATTERNS:
// --------------------------
// To add support for new Canon code types:
// 1. Add pattern to CANON_PATTERNS object
// 2. Update recommendation logic in validateFile() if needed
//
// Example:
//   NEW_TYPE: /^NEW_\d{3}_[A-Za-z0-9_]+\.(ts|md)$/,
//
// COMMON ISSUES & FIXES:
// ----------------------
// 1. "File in Canon directory must follow Canon naming pattern"
//    → Rename file to match appropriate Canon pattern (TOOL_XX, REF_XXX, etc.)
//
// 2. "Canon file but outside canon/ directory"
//    → Move file to appropriate canon/ subdirectory
//
// 3. False positives for valid utilities
//    → Add pattern to genericUtilities array if it's a common utility pattern
//
// 4. Windows path issues
//    → All paths are normalized, but ensure relative() is used consistently
//
// TESTING:
// --------
// Run validation: npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
// Or via npm: npm run canon:validate-compliance
//
// DEBUGGING:
// ----------
// To debug specific files, add console.log() in validateFile() before return statements.
// Check normalizedPath vs relativePath to identify path normalization issues.
//
// PERFORMANCE:
// ------------
// This tool scans all files in key directories (canon/, src/, apps/, packages/).
// For large codebases, consider:
// - Adding more specific directory exclusions
// - Implementing file type filtering earlier in the scan
// - Caching results for unchanged files
//
// RELATED DOCUMENTATION:
// ---------------------
// - CONT_01: Canon Identity Contract (Section 3.7 - Framework Files)
// - ADR_001: Next.js App Router Adoption
// - ADR_002: Canon Security (Server-Side Verification)
//
// ============================================================================
// NEXT.JS BEST PRACTICES: MAINTAINING CONSISTENCY & AVOIDING DRIFT
// ============================================================================
//
// WORKFLOW CHECKPOINTS & DOCUMENTATION:
// -------------------------------------
// When stopping work on Next.js files, document:
//
// 1. **Current State Summary:**
//    - Which files were modified (app/**/page.tsx, route.ts, *.actions.ts)
//    - What Canon codes are involved (PAGE_XXX, COMP_XXX, etc.)
//    - Which routes/pages were affected
//
// 2. **Next Steps Checklist:**
//    - [ ] Run validation: npm run canon:validate-compliance
//    - [ ] Verify thin wrapper pattern (app/**/page.tsx → canon-pages/)
//    - [ ] Check Server Actions are in *.actions.ts files
//    - [ ] Ensure route handlers follow security patterns (ADR_002)
//    - [ ] Update registry YAML if new pages/components added
//
// 3. **Consistency Markers:**
//    - File naming: Framework files use Next.js conventions, Canon files use Canon patterns
//    - Location: app/ for routes, canon-pages/ for business logic
//    - Exports: PAGE_META for pages, COMPONENT_META for components
//
// THIN WRAPPER PATTERN (ADR_001):
// --------------------------------
// ✅ CORRECT:
//   app/canon/page.tsx (thin wrapper)
//   → imports from canon-pages/META/META_02_CanonLandingPage.tsx
//   → re-exports metadata
//
// ❌ AVOID:
//   - Business logic in app/**/page.tsx
//   - Canon codes in app/ directory filenames
//   - Mixing framework routing with Canon governance
//
// FILE ORGANIZATION BEST PRACTICES:
// ---------------------------------
// 1. **Next.js Routes (app/ directory):**
//    - Use default Next.js naming: page.tsx, layout.tsx, route.ts
//    - Keep thin - only routing and metadata re-exports
//    - Import from canon-pages/ for actual implementation
//
// 2. **Canon Pages (canon-pages/ directory):**
//    - Use Canon naming: PAGE_XXX_Description.tsx
//    - Export PAGE_META constant
//    - Contains all business logic
//
// 3. **Server Actions (*.actions.ts):**
//    - Co-locate with page: META_02_CanonLandingPage.actions.ts
//    - Use 'use server' directive
//    - Follow security patterns from ADR_002
//
// 4. **Route Handlers (app/api/**/route.ts):**
//    - Use default Next.js naming: route.ts
//    - Act as BFF layer (per ADR_001)
//    - Always verify CanonContext server-side (ADR_002)
//
// CONTINUING WORK - AVOIDING DRIFT:
// ----------------------------------
// When resuming work:
//
// 1. **Check Current State:**
//    - Run: npm run canon:validate-compliance
//    - Review any validation errors
//    - Check git status for uncommitted changes
//
// 2. **Verify Patterns:**
//    - Are new files following thin wrapper pattern?
//    - Are Server Actions in *.actions.ts files?
//    - Are Canon codes exported correctly?
//
// 3. **Update Documentation:**
//    - Update registry YAML if new pages/components
//    - Document any new patterns or conventions
//    - Update ADR if architectural decisions changed
//
// 4. **Validation Before Commit:**
//    - Run: npm run canon:validate-compliance
//    - Fix any INVALID file errors
//    - Review UNKNOWN files (may need Canon IDs)
//
// COMMON DRIFT PATTERNS TO WATCH:
// --------------------------------
// 1. **Business Logic in app/**/page.tsx**
//    → Move to canon-pages/ and import
//
// 2. **Canon Codes in app/ Directory**
//    → app/**/page.tsx should NOT have Canon codes in filename
//    → Canon codes belong in canon-pages/ directory
//
// 3. **Missing PAGE_META Exports**
//    → All Canon pages must export PAGE_META constant
//
// 4. **Server Actions Not in *.actions.ts**
//    → Server Actions must be in separate *.actions.ts files
//    → Use 'use server' directive
//
// 5. **Route Handlers Without Security Checks**
//    → Always verify CanonContext server-side (ADR_002)
//    → Never trust client-provided CanonContext
//
// VALIDATION AS CONTINUITY CHECK:
// --------------------------------
// Run this tool regularly to catch drift:
// - Before starting new features
// - After major refactoring
// - Before creating PRs
// - In CI/CD pipeline
//
// The tool will catch:
// - Files that should have Canon IDs but don't
// - Canon files in wrong locations
// - Framework files using incorrect naming
// - Missing or incorrect patterns
//
// REMARKING WORK SESSIONS:
// ------------------------
// When documenting where work stopped, include:
//
// ```markdown
// ## Work Session Summary
// 
// **Date:** YYYY-MM-DD
// **Files Modified:**
// - app/canon/page.tsx (thin wrapper for META_02)
// - canon-pages/META/META_02_CanonLandingPage.tsx (business logic)
// 
// **Canon Codes Involved:**
// - PAGE_META_02 (Canon Landing Page)
// 
// **Validation Status:**
// - ✅ All files pass validation
// - ✅ Thin wrapper pattern maintained
// - ✅ PAGE_META exported correctly
// 
// **Next Steps:**
// - [ ] Add route handler for META_02 API
// - [ ] Update registry YAML
// - [ ] Add Server Actions if needed
// ```
//
// This ensures:
// - Clear context for next developer/AI
// - Validation status is known
// - Patterns are documented
// - Continuity is maintained
//
// ============================================================================
