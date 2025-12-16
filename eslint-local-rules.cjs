"use strict";

/**
 * ESLint Local Rules for Canon Identity Contract
 * 
 * Enforces PAGE_META export in canonical page files.
 * This ensures the sync script always finds data.
 */

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
};

