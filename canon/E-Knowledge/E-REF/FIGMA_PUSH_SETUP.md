# Figma Push - Populate Mindmap from Codebase

This guide explains how to automatically populate your Figma/FigJam mindmap from your codebase architecture data.

## 🎯 Overview

The **Figma Push** script extracts architecture data from your codebase and generates:
- Mindmap structure (JSON)
- Figma Plugin code
- Instructions for populating your Figma board

## 🚀 Quick Start

### 1. Run the Push Command

```bash
npm run figma:push
```

This will:
- ✅ Extract data from your codebase (canons, flows, molecules, etc.)
- ✅ Generate mindmap structure
- ✅ Create Figma Plugin code
- ✅ Save files to `.figma/` directory

### 2. Use Generated Files

After running, you'll have:

```
.figma/
├── mindmap-structure.json  # Mindmap data structure
└── plugin-code.ts         # Figma Plugin code
```

## 📋 Methods to Populate Figma

### Method 1: Figma Plugin (Recommended) ⭐

**Best for:** Automated, repeatable population

1. **Create a Figma Plugin:**
   - Open Figma Desktop
   - Go to **Plugins** → **Development** → **New Plugin**
   - Choose **"Blank Plugin"**

2. **Copy Plugin Code:**
   ```typescript
   // Copy contents from .figma/plugin-code.ts
   // Paste into your plugin's code.ts file
   ```

3. **Run the Plugin:**
   - Open your FigJam board
   - Go to **Plugins** → **Your Plugin Name**
   - Click **Run**
   - The mindmap will be populated automatically

### Method 2: Manual Import

**Best for:** One-time setup or custom layouts

1. Open `mindmap-structure.json`
2. Use a Figma plugin that supports JSON import (e.g., "JSON to Figma")
3. Import the structure
4. Adjust layout manually

### Method 3: Figma REST API (Limited)

**Note:** Figma REST API has limitations for creating FigJam nodes. The push script generates plugin code because direct API creation is not fully supported.

## 🔧 Customization

### Add More Data Sources

Edit `canon/D-Operations/D-TOOL/figma-push.ts`:

```typescript
async loadCodebaseData(): Promise<any> {
  const data: any = {
    // Add your data sources
    atomicCells: await loadAtomicCells(),
    molecules: await loadMolecules(),
    flows: await loadFlows(),
    // Add custom data
    customData: await loadCustomData(),
  };
  return data;
}
```

### Customize Mindmap Structure

Modify the `convertToMindmap` method:

```typescript
convertToMindmap(data: any): MindmapNode {
  return {
    name: 'Your Root Node',
    type: 'text',
    children: [
      // Your custom structure
      {
        name: 'Custom Category',
        type: 'sticky',
        children: data.customData.map(item => ({
          name: item.name,
          type: 'text',
        })),
      },
    ],
  };
}
```

### Change Node Styling

```typescript
{
  name: 'Node Name',
  type: 'sticky',
  style: {
    fill: '#22c55e',      // Green color
    fontSize: 16,
    fontWeight: 'bold',
  },
}
```

## 📊 What Gets Extracted

The script currently extracts:

- ✅ **Canon Records** from `src/data/mockCanonMatrix.ts`
- ✅ **Metadata Types** from `src/types/metadata.ts`
- ✅ **Payment Flows** from `src/modules/payment/data/paymentSchema.ts`
- ✅ **Architecture Structure** (Atomic Cells, Molecules, Flows)

### Adding More Sources

To extract more data, add to `loadCodebaseData()`:

```typescript
// Example: Load entity governance data
try {
  const entityPath = join(__dirname, '..', 'src/types/entity-governance.ts');
  const entityContent = await readFile(entityPath, 'utf-8');
  // Parse and extract entities
  data.entities = extractEntities(entityContent);
} catch (error) {
  console.warn('⚠️  Could not load entity data:', error);
}
```

## 🎨 Mindmap Layout Options

The script supports different layouts (configure via `--layout` flag):

- `mindmap` (default) - Radial mindmap layout
- `hierarchical` - Top-down tree structure
- `radial` - Circular layout

```bash
npm run figma:push -- --layout=hierarchical
```

## 🔄 Workflow Integration

### Automated Updates

Add to your CI/CD pipeline:

```yaml
# .github/workflows/figma-push.yml
- name: Push to Figma
  run: npm run figma:push
  env:
    FIGMA_API_TOKEN: ${{ secrets.FIGMA_API_TOKEN }}
```

### Pre-commit Hook

Update mindmap before commits:

```bash
# .husky/pre-commit
npm run figma:push
git add .figma/
```

## 🐛 Troubleshooting

### Error: "Could not load [data source]"

**Solution:** The script gracefully handles missing files. If you want to add a data source:
1. Check the file path is correct
2. Ensure the file exists
3. Update the extraction logic if needed

### Plugin Code Doesn't Work

**Solution:**
1. Check Figma Plugin API version
2. Ensure you're using Figma Desktop (not web)
3. Check browser console for errors
4. Verify node types are supported (text, sticky, shape)

### Nodes Not Appearing

**Solution:**
1. Ensure you're running the plugin in a FigJam file (not regular Figma)
2. Check that you have edit permissions
3. Verify the file key is correct
4. Try running the plugin code step by step

## 📝 Example Output

After running `npm run figma:push`, you'll see:

```
🚀 Starting Figma push (codebase → Figma)...
📁 File Key: w0bI6UKGtkTUwzhMGMhs93
📚 Loading codebase data...
✅ Loaded 10 canons, 5 flows
🗺️  Converting to mindmap structure...
✅ Saved mindmap structure to: .figma/mindmap-structure.json
✅ Generated plugin code: .figma/plugin-code.ts

📌 IMPORTANT: Figma API Limitations
   Figma REST API does not support creating FigJam nodes directly.
   Use one of these methods:
   1. Run the generated plugin code in Figma Plugin Console
   2. Use the mindmap-structure.json for manual import
   3. Install a Figma plugin that supports JSON import

✅ Figma push completed!
   Check .figma/ directory for generated files
```

## 🔗 Related Documentation

- [Figma Sync Setup](./FIGMA_SYNC_SETUP.md) - Pulling FROM Figma
- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [FigJam API Reference](https://www.figma.com/developers/api#figjam-endpoints)

## 💡 Tips

1. **Incremental Updates:** Run `figma:push` regularly to keep mindmap in sync
2. **Version Control:** Commit `.figma/` files to track mindmap structure changes
3. **Custom Styling:** Modify node styles in `convertToMindmap()` for visual consistency
4. **Data Validation:** Add validation logic to ensure data quality before pushing

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Development Team

