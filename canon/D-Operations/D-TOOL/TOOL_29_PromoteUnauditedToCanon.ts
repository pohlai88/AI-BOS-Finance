#!/usr/bin/env tsx
/**
 * TOOL_29: Promote Staging Files to Canon
 * 
 * Moves files from .staging-docs/ to canon/ directory after review.
 * Automatically updates canon/registry.ts with the new file.
 * 
 * Usage:
 *   npm run canon:promote <file-path>
 *   Example: npm run canon:promote .staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
 */

import * as fs from 'fs';
import * as path from 'path';

const STAGING_DIR = path.join(process.cwd(), '.staging-docs');
const CANON_DIR = path.join(process.cwd(), 'canon');
const REGISTRY_PATH = path.join(CANON_DIR, 'registry.ts');

interface PromotionResult {
  success: boolean;
  message: string;
  newPath?: string;
  registryUpdated?: boolean;
}

/**
 * Validate file path is in staging directory
 */
function validateStagingPath(filePath: string): { valid: boolean; error?: string } {
  const fullPath = path.resolve(process.cwd(), filePath);
  const stagingFullPath = path.resolve(STAGING_DIR);

  if (!fullPath.startsWith(stagingFullPath)) {
    return {
      valid: false,
      error: `File must be in .staging-docs/ directory. Got: ${filePath}`
    };
  }

  if (!fs.existsSync(fullPath)) {
    return {
      valid: false,
      error: `File does not exist: ${filePath}`
    };
  }

  return { valid: true };
}

/**
 * Determine target path in canon directory
 */
function getCanonTargetPath(stagingPath: string): string {
  const relativePath = path.relative(STAGING_DIR, stagingPath);
  // Remove 'canon/' prefix if present (e.g., 'canon/A-Governance/...' -> 'A-Governance/...')
  const canonRelativePath = relativePath.replace(/^canon[\/\\]/, '');
  return path.join(CANON_DIR, canonRelativePath);
}

/**
 * Validate file follows Canon naming conventions
 */
function validateCanonNaming(filePath: string, fileName: string): { valid: boolean; error?: string } {
  // Check for Canon ID pattern (e.g., ADR_001, CONT_01, TOOL_29)
  const canonIdPattern = /^(ADR|CONT|COMP|CELL|PAGE|CONST|ENT|POLY|SCH|TOOL|REF|SPEC)_\d+/i;

  // Extract potential Canon ID from filename
  const baseName = path.basename(fileName, path.extname(fileName));

  if (!canonIdPattern.test(baseName)) {
    return {
      valid: false,
      error: `File name must follow Canon ID pattern (e.g., ADR_001_Name.md). Got: ${fileName}`
    };
  }

  // Check directory structure matches plane
  const dirName = path.dirname(filePath);
  const planeMatch = dirName.match(/[A-E]-[A-Za-z]+/);

  if (!planeMatch) {
    return {
      valid: false,
      error: `File must be in a valid plane directory (A-Governance, B-Functional, etc.)`
    };
  }

  return { valid: true };
}

/**
 * Update canon/registry.ts with new file entry
 */
function updateRegistry(filePath: string, canonPath: string): boolean {
  try {
    let registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    // Extract file info
    const fileName = path.basename(canonPath);
    const relativePath = path.relative(CANON_DIR, canonPath).replace(/\\/g, '/');
    const baseName = path.basename(fileName, path.extname(fileName));

    // Determine type from directory structure
    const typeMap: Record<string, string> = {
      'A-ADR': 'ADR',
      'A-CONT': 'CONT',
      'B-COMP': 'COMP',
      'B-CELL': 'CELL',
      'B-PAGE': 'PAGE',
      'C-CONST': 'CONST',
      'C-ENT': 'ENT',
      'C-POLY': 'POLY',
      'C-SCH': 'SCH',
      'D-TOOL': 'TOOL',
      'E-REF': 'REF',
      'E-SPEC': 'SPEC',
    };

    const dirParts = relativePath.split('/');
    const typeDir = dirParts.find(part => typeMap[part]);
    const type = typeDir ? typeMap[typeDir] : 'REF';

    // Extract ID (e.g., ADR_001 from ADR_001_NextJsAppRouter.md)
    const idMatch = baseName.match(/^([A-Z]+_\d+)/);
    const id = idMatch ? idMatch[1] : baseName.toUpperCase();

    // Extract title (e.g., "NextJsAppRouter" from "ADR_001_NextJsAppRouter")
    const titleMatch = baseName.match(/^[A-Z]+_\d+_(.+)$/);
    const title = titleMatch
      ? titleMatch[1].replace(/([A-Z])/g, ' $1').trim()
      : baseName;

    // Check if entry already exists
    const entryPattern = new RegExp(`'${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':`, 'g');
    if (entryPattern.test(registryContent)) {
      console.log('⚠️  Entry already exists in registry, skipping update');
      return false;
    }

    // Find insertion point (before closing brace of CANON_FILES)
    const insertPattern = /(\s+)(\/\/ E-Knowledge.*?\n\s+[^}]+?)(\n\};)/s;
    const match = registryContent.match(insertPattern);

    if (match) {
      const indent = match[1];
      const lastEntry = match[2];
      const closing = match[3];

      // Create new entry
      const newEntry = `  '${relativePath}': {
    path: '${relativePath}',
    type: '${type}',
    id: '${id}',
    title: '${title}',
    status: 'ACTIVE',
  },`;

      // Insert before closing brace
      registryContent = registryContent.replace(
        insertPattern,
        `${match[1]}${lastEntry}\n${newEntry}${closing}`
      );
    } else {
      // Fallback: append before closing brace
      const closingBraceIndex = registryContent.lastIndexOf('};');
      if (closingBraceIndex !== -1) {
        const newEntry = `  '${relativePath}': {
    path: '${relativePath}',
    type: '${type}',
    id: '${id}',
    title: '${title}',
    status: 'ACTIVE',
  },\n\n`;
        registryContent = registryContent.slice(0, closingBraceIndex) + newEntry + registryContent.slice(closingBraceIndex);
      }
    }

    fs.writeFileSync(REGISTRY_PATH, registryContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error updating registry:', error);
    return false;
  }
}

/**
 * Promote file from unaudited to canon
 */
function promoteFile(filePath: string): PromotionResult {
  // Validate path
  const pathValidation = validateStagingPath(filePath);
  if (!pathValidation.valid) {
    return {
      success: false,
      message: pathValidation.error || 'Invalid path'
    };
  }

  const fullStagingPath = path.resolve(process.cwd(), filePath);
  const fileName = path.basename(fullStagingPath);

  // Validate naming
  const namingValidation = validateCanonNaming(filePath, fileName);
  if (!namingValidation.valid) {
    return {
      success: false,
      message: namingValidation.error || 'Invalid naming convention'
    };
  }

  // Get target path
  const canonTargetPath = getCanonTargetPath(fullStagingPath);
  const canonTargetDir = path.dirname(canonTargetPath);

  // Create target directory if needed
  if (!fs.existsSync(canonTargetDir)) {
    fs.mkdirSync(canonTargetDir, { recursive: true });
  }

  // Check if target already exists
  if (fs.existsSync(canonTargetPath)) {
    return {
      success: false,
      message: `Target file already exists: ${canonTargetPath}`
    };
  }

  // Move file
  try {
    fs.copyFileSync(fullStagingPath, canonTargetPath);
    fs.unlinkSync(fullStagingPath);

    // Update registry
    const registryUpdated = updateRegistry(filePath, canonTargetPath);

    return {
      success: true,
      message: `✅ File promoted successfully`,
      newPath: path.relative(process.cwd(), canonTargetPath),
      registryUpdated
    };
  } catch (error) {
    return {
      success: false,
      message: `Error moving file: ${error}`
    };
  }
}

/**
 * List all staging files
 */
function listStagingFiles(): string[] {
  const files: string[] = [];

  function scanDir(dir: string, baseDir: string = STAGING_DIR): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        scanDir(fullPath, baseDir);
      } else if (entry.isFile() && !entry.name.startsWith('.')) {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }
  }

  scanDir(STAGING_DIR);
  return files;
}

// Main execution
// ES module: Run main if executed directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('TOOL_29_PromoteUnauditedToCanon.ts') ||
  process.argv[1].includes('TOOL_29_PromoteUnauditedToCanon')
);

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 Staging Files:');
    const files = listStagingFiles();
    if (files.length === 0) {
      console.log('  (no staging files)');
    } else {
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    console.log('\nUsage: npm run canon:promote <file-path>');
    process.exit(0);
  }

  const filePath = args[0];
  const result = promoteFile(filePath);

  if (result.success) {
    console.log(`\n${result.message}`);
    console.log(`📁 Moved to: ${result.newPath}`);
    if (result.registryUpdated) {
      console.log('📝 Registry updated');
    }
    console.log('\n✅ File is now part of Canon governance system');
  } else {
    console.error(`\n❌ Error: ${result.message}`);
    process.exit(1);
  }
}

export { promoteFile, listStagingFiles, validateStagingPath, validateCanonNaming };
