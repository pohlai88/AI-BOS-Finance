# Figma Automatic Synchronization Setup

This guide explains how to set up automatic synchronization of design information from your Figma/FigJam boards to the codebase.

## 📋 Overview

The Figma sync system automatically:
- ✅ Fetches design data from Figma/FigJam boards
- ✅ Extracts architecture structure (Atomic Cells, Molecules, Flows, etc.)
- ✅ Generates TypeScript types and JSON data files
- ✅ Runs on schedule via GitHub Actions
- ✅ Creates pull requests when design changes are detected

## 🚀 Quick Start

### 1. Get Your Figma API Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Navigate to **Personal Access Tokens**
3. Click **Create new token**
4. Give it a name (e.g., "AI-BOS Sync")
5. Copy the token (you won't see it again!)

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
FIGMA_API_TOKEN=your_token_here
FIGMA_FILE_KEY=w0bI6UKGtkTUwzhMGMhs93
FIGMA_NODE_ID=0:1
```

### 3. Add GitHub Secret (for CI/CD)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIGMA_API_TOKEN`
5. Value: Your Figma API token
6. Click **Add secret**

### 4. Run Manual Sync

```bash
# Install dependencies (if not already done)
npm install

# Run sync manually
npm run figma:sync
```

The sync will create files in `src/data/figma/`:
- `figma-architecture.json` - Structured architecture data
- `figma-architecture.ts` - TypeScript types
- `figma-raw.json` - Raw Figma API response (optional)

## 📁 File Structure

After running sync, you'll have:

```
src/data/figma/
├── figma-architecture.json    # Structured design data
├── figma-architecture.ts      # TypeScript types
└── figma-raw.json              # Raw API response (if enabled)
```

## ⚙️ Configuration

Edit `figma-sync.config.json` to customize sync behavior:

```json
{
  "fileKey": "w0bI6UKGtkTUwzhMGMhs93",
  "nodeId": "0:1",
  "outputDir": "src/data/figma",
  "outputFormat": "both",
  "includeImages": false,
  "includeMetadata": true,
  "syncSchedule": {
    "enabled": true,
    "frequency": "daily",
    "time": "09:00"
  }
}
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `fileKey` | string | Figma file key from URL |
| `nodeId` | string | Specific node ID to sync (optional) |
| `outputDir` | string | Where to save synced files |
| `outputFormat` | "json" \| "typescript" \| "both" | Output format |
| `includeImages` | boolean | Download images (not yet implemented) |
| `includeMetadata` | boolean | Include raw Figma metadata |

## 🔄 Automatic Sync Options

### Option 1: GitHub Actions (Recommended)

The workflow runs automatically:
- **Daily at 9:00 AM UTC** (configurable)
- **On manual trigger** via GitHub Actions UI
- **On config file changes**

**Setup:**
1. Add `FIGMA_API_TOKEN` to GitHub Secrets (see step 3 above)
2. The workflow is already configured in `.github/workflows/figma-sync.yml`
3. It will automatically create PRs when design changes are detected

**Manual Trigger:**
1. Go to **Actions** tab in GitHub
2. Select **Figma Sync** workflow
3. Click **Run workflow**
4. Optionally specify a different file key

### Option 2: Local Cron Job

For local development, you can set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/AI-BOS-Finance && npm run figma:sync
```

### Option 3: Watch Mode (Development)

For active development, use watch mode:

```bash
npm run figma:sync:watch
```

This will re-sync whenever the script file changes.

## 📊 Using Synced Data in Code

### Import Architecture Data

```typescript
import { figmaArchitecture } from '@/data/figma/figma-architecture';

// Access atomic cells
const cells = figmaArchitecture.architecture.atomicCells;
console.log(`Found ${cells.length} atomic cells`);

// Access domain molecules
const molecules = figmaArchitecture.architecture.domainMolecules;
console.log(`Found ${molecules.length} molecules`);

// Access flows
const flows = figmaArchitecture.flows;
console.log(`Found ${flows.length} flows`);
```

### Type Safety

The generated TypeScript file includes types:

```typescript
import type { FigmaArchitectureType } from '@/data/figma/figma-architecture';

function processArchitecture(data: FigmaArchitectureType) {
  // Fully typed!
}
```

## 🔍 Extracting Specific Information

The sync script automatically categorizes nodes based on naming patterns:

- **Atomic Cells**: Nodes containing "Atomic Cell" or "Cell"
- **Domain Molecules**: Nodes containing "Molecule"
- **Flows**: Nodes containing "Flow" or "Process"
- **Kernel Layer**: Nodes containing "Kernel" or "Hexagon"

You can customize the extraction logic in `canon/D-Operations/D-TOOL/figma-sync.ts`:

```typescript
// In extractStructuredData method
if (nodeName.includes('Your Custom Pattern')) {
  structure.yourCustomCategory.push({
    id: node.id,
    name: nodeName,
    path: currentPath,
    type: node.type,
  });
}
```

## 🐛 Troubleshooting

### Error: "FIGMA_API_TOKEN environment variable is required"

**Solution:** Make sure you've created a `.env` file with your token:
```bash
FIGMA_API_TOKEN=your_token_here
```

### Error: "Figma API error: 403"

**Solution:** 
- Check that your API token is valid
- Ensure the file is accessible (not private or you have access)
- Verify the file key is correct

### Error: "Figma API error: 404"

**Solution:**
- Verify the `fileKey` in `figma-sync.config.json` is correct
- Extract it from the Figma URL: `https://figma.com/board/{fileKey}/...`

### Sync runs but no changes detected

**Solution:**
- Check that the Figma file actually changed
- Verify the output directory exists: `src/data/figma/`
- Check file permissions

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use GitHub Secrets** for CI/CD tokens
3. **Rotate tokens regularly** - Regenerate every 90 days
4. **Limit token scope** - Only grant necessary permissions
5. **Review PRs** - Always review auto-generated PRs before merging

## 📝 Advanced Usage

### Sync Multiple Files

Create multiple config files and sync scripts:

```bash
# figma-sync-architecture.config.json
{
  "fileKey": "w0bI6UKGtkTUwzhMGMhs93",
  "outputDir": "src/data/figma/architecture"
}

# figma-sync-design-system.config.json
{
  "fileKey": "another-file-key",
  "outputDir": "src/data/figma/design-system"
}
```

### Custom Extraction Logic

Modify `canon/D-Operations/D-TOOL/figma-sync.ts` to extract custom data:

```typescript
// Add custom extraction in extractStructuredData
if (nodeName.includes('Payment')) {
  structure.paymentFlows.push({
    id: node.id,
    name: nodeName,
    // ... custom fields
  });
}
```

## 🔗 Related Documentation

- [Figma API Documentation](https://www.figma.com/developers/api)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Architecture Documentation](./01-architecture/)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the sync logs in GitHub Actions
3. Verify your Figma API token is valid
4. Check that the file key matches your Figma board

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Development Team

