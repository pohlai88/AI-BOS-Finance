#!/usr/bin/env node
/**
 * Figma Sync Script
 * 
 * Automatically synchronizes design information from Figma/FigJam boards
 * to the codebase. Supports both manual runs and CI/CD integration.
 * 
 * Usage:
 *   npm run figma:sync
 *   npm run figma:sync -- --file-key=w0bI6UKGtkTUwzhMGMhs93
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FigmaSyncConfig {
  fileKey: string;
  nodeId?: string;
  outputDir: string;
  outputFormat: 'json' | 'typescript' | 'both';
  includeImages: boolean;
  includeMetadata: boolean;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  [key: string]: any;
}

class FigmaSync {
  private apiToken: string;
  private config: FigmaSyncConfig;

  constructor(config: FigmaSyncConfig) {
    this.apiToken = process.env.FIGMA_API_TOKEN || '';
    if (!this.apiToken) {
      throw new Error('FIGMA_API_TOKEN environment variable is required');
    }
    this.config = config;
  }

  /**
   * Fetch file metadata from Figma API
   */
  async fetchFileMetadata(): Promise<any> {
    const url = `https://api.figma.com/v1/files/${this.config.fileKey}`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.apiToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch FigJam board content
   */
  async fetchFigJamContent(): Promise<any> {
    const url = `https://api.figma.com/v1/files/${this.config.fileKey}`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.apiToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Extract structured data from Figma nodes
   */
  extractStructuredData(nodes: any[]): any {
    const structure: any = {
      metadata: {
        extractedAt: new Date().toISOString(),
        fileKey: this.config.fileKey,
        nodeCount: 0,
      },
      architecture: {
        principleLayer: [],
        processLayer: [],
        kernelLayer: [],
        domainMolecules: [],
        atomicCells: [],
      },
      flows: [],
      patterns: [],
    };

    const traverse = (node: any, path: string[] = []): void => {
      if (!node) return;

      structure.metadata.nodeCount++;

      const nodeName = node.name || node.id;
      const currentPath = [...path, nodeName];

      // Categorize nodes based on naming patterns
      if (nodeName.includes('Atomic Cell') || nodeName.includes('Cell')) {
        structure.architecture.atomicCells.push({
          id: node.id,
          name: nodeName,
          path: currentPath,
          type: node.type,
        });
      } else if (nodeName.includes('Molecule')) {
        structure.architecture.domainMolecules.push({
          id: node.id,
          name: nodeName,
          path: currentPath,
          type: node.type,
        });
      } else if (nodeName.includes('Flow') || nodeName.includes('Process')) {
        structure.flows.push({
          id: node.id,
          name: nodeName,
          path: currentPath,
          type: node.type,
        });
      } else if (nodeName.includes('Kernel') || nodeName.includes('Hexagon')) {
        structure.architecture.kernelLayer.push({
          id: node.id,
          name: nodeName,
          path: currentPath,
          type: node.type,
        });
      }

      // Recursively process children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverse(child, currentPath));
      }
    };

    nodes.forEach((node) => traverse(node));

    return structure;
  }

  /**
   * Save data to file system
   */
  async saveData(data: any, filename: string): Promise<void> {
    const outputPath = join(__dirname, '..', this.config.outputDir);
    
    // Ensure output directory exists
    if (!existsSync(outputPath)) {
      await mkdir(outputPath, { recursive: true });
    }

    if (this.config.outputFormat === 'json' || this.config.outputFormat === 'both') {
      const jsonPath = join(outputPath, `${filename}.json`);
      await writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Saved JSON: ${jsonPath}`);
    }

    if (this.config.outputFormat === 'typescript' || this.config.outputFormat === 'both') {
      const tsPath = join(outputPath, `${filename}.ts`);
      const tsContent = `// Auto-generated from Figma sync at ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - This file is synchronized from Figma

export const ${filename} = ${JSON.stringify(data, null, 2)} as const;

export type ${filename.charAt(0).toUpperCase() + filename.slice(1)}Type = typeof ${filename};
`;
      await writeFile(tsPath, tsContent, 'utf-8');
      console.log(`✅ Saved TypeScript: ${tsPath}`);
    }
  }

  /**
   * Main sync process
   */
  async sync(): Promise<void> {
    console.log('🔄 Starting Figma sync...');
    console.log(`📁 File Key: ${this.config.fileKey}`);
    console.log(`📂 Output Directory: ${this.config.outputDir}`);

    try {
      // Fetch FigJam content
      const fileData = await this.fetchFigJamContent();
      
      // Extract document structure
      const document = fileData.document;
      const structuredData = this.extractStructuredData([document]);

      // Add raw metadata if requested
      if (this.config.includeMetadata) {
        structuredData.rawMetadata = {
          name: fileData.name,
          lastModified: fileData.lastModified,
          version: fileData.version,
          thumbnailUrl: fileData.thumbnailUrl,
        };
      }

      // Save structured data
      await this.saveData(structuredData, 'figma-architecture');

      // Save raw file data for reference
      if (this.config.includeMetadata) {
        await this.saveData(fileData, 'figma-raw');
      }

      console.log('✅ Figma sync completed successfully!');
      console.log(`📊 Extracted ${structuredData.metadata.nodeCount} nodes`);
      console.log(`🧩 Found ${structuredData.architecture.atomicCells.length} atomic cells`);
      console.log(`🔬 Found ${structuredData.architecture.domainMolecules.length} domain molecules`);
      console.log(`⚙️  Found ${structuredData.flows.length} flows`);

    } catch (error) {
      console.error('❌ Figma sync failed:', error);
      process.exit(1);
    }
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
const getArg = (key: string, defaultValue?: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

// Main execution
const main = async () => {
  const fileKey = getArg('file-key', process.env.FIGMA_FILE_KEY || 'w0bI6UKGtkTUwzhMGMhs93');
  const nodeId = getArg('node-id', process.env.FIGMA_NODE_ID);
  const outputDir = getArg('output-dir', 'src/data/figma');
  const outputFormat = (getArg('format', 'both') as 'json' | 'typescript' | 'both') || 'both';
  const includeImages = getArg('include-images', 'false') === 'true';
  const includeMetadata = getArg('include-metadata', 'true') === 'true';

  const config: FigmaSyncConfig = {
    fileKey,
    nodeId,
    outputDir,
    outputFormat,
    includeImages,
    includeMetadata,
  };

  const sync = new FigmaSync(config);
  await sync.sync();
};

main().catch(console.error);

