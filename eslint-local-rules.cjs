"use strict";

/**
 * ESLint Local Rules for Canon Identity Contract
 * 
 * Enforces PAGE_META export in canonical page files.
 * This ensures the sync script always finds data.
 */

// ============================================================================
// Drift Police: Ban raw palette colors & arbitrary color values in className
// ============================================================================
const DISALLOWED_PREFIX =
  '(?:bg|text|border|ring|outline|fill|stroke|decoration|caret|accent)';

const PALETTE =
  '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white|transparent|current)';

const RE_ARBITRARY_COLOR = new RegExp(
  String.raw`(^|\s)${DISALLOWED_PREFIX}-\[(?:#|rgb|rgba|hsl|hsla|oklch|oklab|color-mix|var\().+?\](?=\s|$)`,
  'g'
);

const RE_TW_PALETTE = new RegExp(
  String.raw`(^|\s)${DISALLOWED_PREFIX}-${PALETTE}(?:-\d{2,3})?(?:\/\d{1,3})?(?=\s|$)`,
  'g'
);

function findHits(str) {
  const hits = [];
  for (const re of [RE_ARBITRARY_COLOR, RE_TW_PALETTE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(str))) hits.push(m[0].trim());
  }
  return hits;
}

function scanExpression(expr, context) {
  if (!expr) return;

  // "..."
  if (expr.type === 'Literal' && typeof expr.value === 'string') {
    const hits = findHits(expr.value);
    for (const hit of hits) {
      context.report({
        node: expr,
        messageId: 'disallowedColor',
        data: { color: hit },
      });
    }
    return;
  }

  // `... ${x} ...`
  if (expr.type === 'TemplateLiteral') {
    for (const q of expr.quasis) {
      const raw = q.value?.cooked ?? q.value?.raw;
      if (typeof raw === 'string') {
        const hits = findHits(raw);
        for (const hit of hits) {
          context.report({
            node: expr,
            messageId: 'disallowedColorTemplate',
            data: { color: hit },
          });
        }
      }
    }
    return;
  }

  // cn(...), clsx(...), cva(...), etc.
  if (expr.type === 'CallExpression') {
    for (const arg of expr.arguments) scanExpression(arg, context);
    return;
  }

  if (expr.type === 'ArrayExpression') {
    for (const el of expr.elements) scanExpression(el, context);
    return;
  }

  if (expr.type === 'ObjectExpression') {
    for (const p of expr.properties) {
      if (p?.type === 'Property') {
        scanExpression(p.key, context);   // {"bg-red-500": cond}
        scanExpression(p.value, context);
      }
    }
    return;
  }

  if (expr.type === 'ConditionalExpression') {
    scanExpression(expr.consequent, context);
    scanExpression(expr.alternate, context);
    return;
  }

  if (expr.type === 'LogicalExpression' || expr.type === 'BinaryExpression') {
    scanExpression(expr.left, context);
    scanExpression(expr.right, context);
  }
}
// ============================================================================

module.exports = {
  "require-page-meta": {
    meta: {
      type: "problem",
      docs: {
        description: "Enforce PAGE_META export in canonical page files",
        category: "Canon Identity",
      },
      messages: {
        missingExport: "Canonical page must export 'PAGE_META'.",
        missingConst: "'PAGE_META' must be declared 'as const'.",
      },
      schema: [],
    },
    create(context) {
      return {
        Program(node) {
          const filename = context.getFilename();

          // 1. Identify Canon Pages by filename
          // Matches: META_02_Name.tsx, PAY_01_Hub.tsx, SYS_03_Access.tsx
          // Pattern: [DOMAIN]_[NUMBER]_[Name].tsx
          // Adjust regex if your folder structure is different
          const isCanonFile = /[\\/][A-Z]{3,5}_[0-9]{2}_[^\\/]+\.tsx$/.test(filename);

          if (!isCanonFile) return;

          // 2. Scan top-level exports for PAGE_META
          const pageMetaExport = node.body.find(
            (statement) =>
              statement.type === "ExportNamedDeclaration" &&
              statement.declaration &&
              statement.declaration.type === "VariableDeclaration" &&
              statement.declaration.declarations[0].id.name === "PAGE_META"
          );

          if (!pageMetaExport) {
            context.report({
              node,
              messageId: "missingExport",
            });
            return;
          }

          // 3. Optional: Check for 'as const'
          // We look at the initialization of the variable
          const init = pageMetaExport.declaration.declarations[0].init;

          // If init is a simple ObjectExpression (not TSAsExpression), they forgot 'as const'
          if (init && init.type === "ObjectExpression") {
            // Check if it's followed by 'as const'
            const declaration = pageMetaExport.declaration.declarations[0];
            // This is a simplified check - full AST parsing would be more robust
            // For now, we'll just check if the export exists
          }
        },
      };
    },
  },

  "no-raw-colors": {
    meta: {
      type: "problem",
      docs: {
        description: "Ban hardcoded/palette Tailwind colors to prevent drift.",
        category: "Drift Police",
      },
      schema: [],
      fixable: null,
      messages: {
        disallowedColor: 'Drift Police: disallowed color class "{{color}}". Use governed tokens (bg-surface-*, text-text-*, bg-status-*, text-status-*, border-*) or atomic components.',
        disallowedColorTemplate: 'Drift Police: disallowed color class "{{color}}" in template literal. Use governed tokens or atomic components.',
      },
    },
    create(context) {
      // Escape hatch: Check for legacy/migration folders
      const filename = context.getFilename();
      const isLegacyFolder = /[\\/](__legacy__|migration__|__migration__)[\\/]/.test(filename);

      // Escape hatch: Check for eslint-disable comment
      function hasDisableComment(node) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getCommentsBefore(node);
        return comments.some(
          comment =>
            comment.type === 'Line' &&
            /eslint-disable(?:-next-line)?\s+(?:canon\/)?no-raw-colors/.test(comment.value)
        );
      }

      // Helper to scan with escape hatch checks
      function scanWithEscapeHatch(expr, node) {
        if (!expr) return;

        // Escape hatch: Legacy folders
        if (isLegacyFolder) return;

        // Escape hatch: Disable comment
        if (hasDisableComment(node)) return;

        scanExpression(expr, context);
      }

      return {
        JSXAttribute(node) {
          if (node.name?.name !== 'className') return;

          // className="..."
          if (node.value?.type === 'Literal') {
            scanWithEscapeHatch(node.value, node);
            return;
          }

          // className={...}
          if (node.value?.type === 'JSXExpressionContainer') {
            scanWithEscapeHatch(node.value.expression, node);
          }
        },
      };
    },
  },

  "no-inline-style-colors": {
    meta: {
      type: "problem",
      docs: {
        description: "Ban hardcoded colors in inline style props.",
        category: "Drift Police",
      },
      schema: [],
      fixable: null,
      messages: {
        disallowedInlineColor: 'Drift Police: hardcoded color "{{color}}" in inline style. Use CSS variables (var(--text-primary), var(--surface-base)) instead.',
      },
    },
    create(context) {
      const filename = context.getFilename();
      const isLegacyFolder = /[\\/](__legacy__|migration__|__migration__)[\\/]/.test(filename);

      function hasDisableComment(node) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getCommentsBefore(node);
        return comments.some(
          comment =>
            comment.type === 'Line' &&
            /eslint-disable(?:-next-line)?\s+(?:canon\/)?no-inline-style-colors/.test(comment.value)
        );
      }

      function isColorValue(value) {
        if (typeof value !== 'string') return false;
        // Match hex, rgb, rgba, hsl, hsla, oklch, oklab
        return /^#|^rgb\(|^rgba\(|^hsl\(|^hsla\(|^oklch\(|^oklab\(/i.test(value.trim());
      }

      function scanStyleObject(expr, node) {
        if (!expr || expr.type !== 'ObjectExpression') return;
        if (isLegacyFolder) return;
        if (hasDisableComment(node)) return;

        for (const prop of expr.properties) {
          if (prop.type !== 'Property') continue;
          if (prop.key.type !== 'Identifier') continue;

          const keyName = prop.key.name;
          // Only check color-related properties
          if (!/color|background|border|fill|stroke/i.test(keyName)) continue;

          if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
            const value = prop.value.value;
            if (isColorValue(value)) {
              context.report({
                node: prop.value,
                messageId: 'disallowedInlineColor',
                data: { color: value },
              });
            }
          }
        }
      }

      return {
        JSXAttribute(node) {
          if (node.name?.name !== 'style') return;
          if (node.value?.type !== 'JSXExpressionContainer') return;

          scanStyleObject(node.value.expression, node);
        },
      };
    },
  },

  "no-svg-hardcoded-colors": {
    meta: {
      type: "problem",
      docs: {
        description: "Ban hardcoded colors in SVG fill/stroke attributes.",
        category: "Drift Police",
      },
      schema: [],
      fixable: null,
      messages: {
        disallowedSvgColor: 'Drift Police: hardcoded color "{{color}}" in SVG attribute. Use CSS variables (var(--action-primary)) or className with tokens instead.',
      },
    },
    create(context) {
      const filename = context.getFilename();
      const isLegacyFolder = /[\\/](__legacy__|migration__|__migration__)[\\/]/.test(filename);

      function hasDisableComment(node) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getCommentsBefore(node);
        return comments.some(
          comment =>
            comment.type === 'Line' &&
            /eslint-disable(?:-next-line)?\s+(?:canon\/)?no-svg-hardcoded-colors/.test(comment.value)
        );
      }

      function isHardcodedColor(value) {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        // Allow CSS variables and currentColor
        if (/^var\(|^currentColor$/i.test(trimmed)) return false;
        // Block hex, rgb, named colors
        return /^#|^rgb\(|^rgba\(|^hsl\(|^hsla\(|^(red|blue|green|black|white|yellow|orange|purple|pink|cyan|magenta)$/i.test(trimmed);
      }

      return {
        JSXAttribute(node) {
          if (!['fill', 'stroke'].includes(node.name?.name)) return;
          if (isLegacyFolder) return;
          if (hasDisableComment(node)) return;

          if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
            const value = node.value.value;
            if (isHardcodedColor(value)) {
              context.report({
                node: node.value,
                messageId: 'disallowedSvgColor',
                data: { color: value },
              });
            }
          }
        },
      };
    },
  },
};

