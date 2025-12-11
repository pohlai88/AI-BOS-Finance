#!/usr/bin/env node
/**
 * Figma Push Script
 * 
 * Automatically populates Figma/FigJam mindmaps from codebase architecture data.
 * This is the reverse of figma-sync - it pushes data TO Figma.
 * 
 * Usage:
 *   npm run figma:push
 *   npm run figma:push -- --file-key=w0bI6UKGtkTUwzhMGMhs93
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FigmaPushConfig {
  fileKey: string;
  nodeId?: string;
  sourceData: string[];
  clearExisting: boolean;
  layout: 'mindmap' | 'hierarchical' | 'radial';
}

interface MindmapNode {
  id?: string;
  name: string;
  type: 'text' | 'sticky' | 'shape';
  children?: MindmapNode[];
  position?: { x: number; y: number };
  style?: {
    fill?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
  };
}

class FigmaPush {
  private apiToken: string;
  private config: FigmaPushConfig;

  constructor(config: FigmaPushConfig) {
    this.apiToken = process.env.FIGMA_API_TOKEN || '';
    if (!this.apiToken) {
      throw new Error('FIGMA_API_TOKEN environment variable is required');
    }
    this.config = config;
  }

  /**
   * Load architecture data from codebase
   */
  async loadCodebaseData(): Promise<any> {
    const data: any = {
      atomicCells: [],
      molecules: [],
      flows: [],
      canons: [],
      metadata: [],
    };

    try {
      // Load Canon Matrix data
      const canonPath = join(__dirname, '../../..', 'src/data/mockCanonMatrix.ts');
      const canonContent = await readFile(canonPath, 'utf-8');
      // Extract canon records (simplified - in production, use AST parsing)
      const canonMatches = canonContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
      for (const match of canonMatches) {
        data.canons.push({ id: match[1] });
      }
    } catch (error) {
      console.warn('⚠️  Could not load canon data:', error);
    }

    try {
      // Load metadata structure
      const metadataPath = join(__dirname, '../../..', 'src/types/metadata.ts');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      // Extract domain information
      const domainMatches = metadataContent.matchAll(/domain:\s*string/g);
      if (domainMatches) {
        data.metadata.push({ type: 'MetadataRecord' });
      }
    } catch (error) {
      console.warn('⚠️  Could not load metadata:', error);
    }

    try {
      // Load payment schema
      const paymentPath = join(__dirname, '../../..', 'src/modules/payment/data/paymentSchema.ts');
      const paymentContent = await readFile(paymentPath, 'utf-8');
      if (paymentContent.includes('Payment')) {
        data.flows.push({ name: 'Payment Flow', type: 'P2P' });
      }
    } catch (error) {
      console.warn('⚠️  Could not load payment data:', error);
    }

    return data;
  }

  /**
   * Convert codebase data to mindmap structure
   */
  convertToMindmap(data: any): MindmapNode {
    const root: MindmapNode = {
      name: 'AI-BOS Finance Architecture',
      type: 'text',
      style: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      children: [
        {
          name: 'Principle Layer',
          type: 'text',
          style: { fontSize: 20, fontWeight: 'bold' },
          children: [
            {
              name: 'Atomic Cells',
              type: 'sticky',
              style: { fill: '#22c55e', fontSize: 16 },
              children: data.atomicCells.map((cell: any) => ({
                name: cell.name || cell.id,
                type: 'text',
                style: { fontSize: 14 },
              })),
            },
            {
              name: 'Domain Molecules',
              type: 'sticky',
              style: { fill: '#3b82f6', fontSize: 16 },
              children: [
                { name: 'AP Molecule', type: 'text' },
                { name: 'AR Molecule', type: 'text' },
                { name: 'GL Molecule', type: 'text' },
                { name: 'Cash & Treasury Molecule', type: 'text' },
                ...data.molecules.map((m: any) => ({
                  name: m.name || 'Molecule',
                  type: 'text',
                })),
              ],
            },
          ],
        },
        {
          name: 'Process Layer',
          type: 'text',
          style: { fontSize: 20, fontWeight: 'bold' },
          children: [
            {
              name: 'Process Families',
              type: 'sticky',
              style: { fill: '#8b5cf6', fontSize: 16 },
              children: [
                { name: 'Procure-to-Pay (P2P)', type: 'text' },
                { name: 'Order-to-Cash (O2C)', type: 'text' },
                { name: 'Record-to-Report (R2R)', type: 'text' },
                { name: 'Hire-to-Retire (H2R)', type: 'text' },
                ...data.flows.map((f: any) => ({
                  name: f.name || 'Flow',
                  type: 'text',
                })),
              ],
            },
          ],
        },
        {
          name: 'Kernel Layer',
          type: 'text',
          style: { fontSize: 20, fontWeight: 'bold' },
          children: [
            { name: 'Cell & Flow Registry', type: 'text' },
            { name: 'Orchestrator & State Machine', type: 'text' },
            { name: 'Policy & Control Engine', type: 'text' },
            { name: 'Integration Hub', type: 'text' },
            { name: 'Telemetry & GL Risk Radar', type: 'text' },
            { name: 'Tenant & Segmentation Manager', type: 'text' },
          ],
        },
        {
          name: 'Canon & Standards',
          type: 'text',
          style: { fontSize: 20, fontWeight: 'bold' },
          children: data.canons.slice(0, 10).map((canon: any) => ({
            name: canon.id || 'Canon',
            type: 'text',
            style: { fontSize: 14 },
          })),
        },
      ],
    };

    return root;
  }

  /**
   * Create nodes in FigJam using Figma API
   * Note: Figma API has limitations for creating nodes. This uses a simplified approach.
   */
  async createFigJamNodes(mindmap: MindmapNode, parentNodeId?: string): Promise<void> {
    console.log(`📝 Creating node: ${mindmap.name}`);

    // Note: Figma API doesn't directly support creating FigJam nodes via REST API
    // This would require using Figma Plugin API or manual creation
    // For now, we'll generate a script/instructions for manual creation

    const url = `https://api.figma.com/v1/files/${this.config.fileKey}/nodes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Figma-Token': this.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Figma API structure for creating nodes
        // Note: This is a placeholder - actual implementation depends on Figma API version
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  Could not create node via API (this may require plugin): ${response.statusText}`);
      return;
    }

    // Recursively create children
    if (mindmap.children) {
      for (const child of mindmap.children) {
        await this.createFigJamNodes(child, mindmap.id);
      }
    }
  }

  /**
   * Generate Figma Plugin code for creating nodes
   */
  generatePluginCode(mindmap: MindmapNode): string {
    const indent = (level: number) => '  '.repeat(level);

    const generateNodeCode = (node: MindmapNode, level: number = 0): string => {
      let code = '';
      code += `${indent(level)}const ${node.name.replace(/\s+/g, '_').toLowerCase()} = figma.createSticky();\n`;
      code += `${indent(level)}${node.name.replace(/\s+/g, '_').toLowerCase()}.text.characters = "${node.name}";\n`;
      if (node.style?.fill) {
        code += `${indent(level)}${node.name.replace(/\s+/g, '_').toLowerCase()}.fill = { r: 0.13, g: 0.77, b: 0.37 }; // Green\n`;
      }
      code += `${indent(level)}${node.name.replace(/\s+/g, '_').toLowerCase()}.x = ${level * 200};\n`;
      code += `${indent(level)}${node.name.replace(/\s+/g, '_').toLowerCase()}.y = ${level * 100};\n\n`;

      if (node.children) {
        node.children.forEach((child, index) => {
          code += generateNodeCode(child, level + 1);
        });
      }

      return code;
    };

    return `// Auto-generated Figma Plugin code
// Run this in Figma Plugin Console to populate mindmap

${generateNodeCode(mindmap)}
`;
  }

  /**
   * Save mindmap structure as JSON for manual import
   */
  async saveMindmapStructure(mindmap: MindmapNode): Promise<void> {
    const outputPath = join(__dirname, '../../..', '.figma', 'mindmap-structure.json');
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(mindmap, null, 2), 'utf-8');
    console.log(`✅ Saved mindmap structure to: ${outputPath}`);
  }

  /**
   * Main push process
   */
  async push(): Promise<void> {
    console.log('🚀 Starting Figma push (codebase → Figma)...');
    console.log(`📁 File Key: ${this.config.fileKey}`);

    try {
      // Load data from codebase
      console.log('📚 Loading codebase data...');
      const codebaseData = await this.loadCodebaseData();
      console.log(`✅ Loaded ${codebaseData.canons.length} canons, ${codebaseData.flows.length} flows`);

      // Convert to mindmap structure
      console.log('🗺️  Converting to mindmap structure...');
      const mindmap = this.convertToMindmap(codebaseData);

      // Save structure for reference
      await this.saveMindmapStructure(mindmap);

      // Generate plugin code
      const pluginCode = this.generatePluginCode(mindmap);
      const pluginPath = join(__dirname, '../../..', '.figma', 'plugin-code.ts');
      const fs = await import('fs/promises');
      await fs.writeFile(pluginPath, pluginCode, 'utf-8');
      console.log(`✅ Generated plugin code: ${pluginPath}`);

      // Note about API limitations
      console.log('\n📌 IMPORTANT: Figma API Limitations');
      console.log('   Figma REST API does not support creating FigJam nodes directly.');
      console.log('   Use one of these methods:');
      console.log('   1. Run the generated plugin code in Figma Plugin Console');
      console.log('   2. Use the mindmap-structure.json for manual import');
      console.log('   3. Install a Figma plugin that supports JSON import');

      console.log('\n✅ Figma push completed!');
      console.log('   Check .figma/ directory for generated files');

    } catch (error) {
      console.error('❌ Figma push failed:', error);
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
  const clearExisting = getArg('clear-existing', 'false') === 'true';
  const layout = (getArg('layout', 'mindmap') as 'mindmap' | 'hierarchical' | 'radial') || 'mindmap';

  const config: FigmaPushConfig = {
    fileKey,
    nodeId,
    sourceData: [
      'src/data/mockCanonMatrix.ts',
      'src/types/metadata.ts',
      'src/modules/payment/data/paymentSchema.ts',
    ],
    clearExisting,
    layout,
  };

  const pusher = new FigmaPush(config);
  await pusher.push();
};

main().catch(console.error);

