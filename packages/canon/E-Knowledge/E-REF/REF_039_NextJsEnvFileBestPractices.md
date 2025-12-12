> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_039  
> **Version:** 1.0.0  
> **Purpose:** Next.js environment file management best practices for monorepo with MCP  
> **Plane:** E — Knowledge (Reference)  
> **Date:** 2025-01-27

---

# REF_039: Next.js Environment File Management Best Practices

## 🎯 Overview

This document outlines best practices for managing multiple environment files in Next.js, especially in monorepo setups with MCP (Model Context Protocol) integration.

---

## 📁 Next.js Environment File Hierarchy

Next.js loads environment files in the following order (later files override earlier ones):

```
.env                    # Default values (committed to git)
.env.local              # Local overrides (gitignored)
.env.development        # Development-specific
.env.development.local  # Development local overrides (gitignored)
.env.production         # Production-specific
.env.production.local   # Production local overrides (gitignored)
.env.test               # Test-specific
```

### ⚠️ Important Rules

1. **`.env.local`** always loads (except in `test` environment)
2. **`.env.development.local`** overrides `.env.development` and `.env.local`
3. **`.env.production.local`** overrides `.env.production` and `.env.local`
4. Files with `.local` suffix are **NEVER** committed to git

---

## 🏗️ Monorepo Structure Best Practices

### Option 1: Root-Level `.env.local` (Recommended for MCP)

**Structure:**
```
AI-BOS-Finance/
├── .env                    # Shared defaults (committed)
├── .env.local              # All local secrets (gitignored)
├── .env.example            # Template (committed)
├── apps/
│   ├── web/
│   │   └── .env.local      # Web-specific overrides (optional)
│   └── kernel/
│       └── .env.local      # Kernel-specific overrides (optional)
```

**When to use:**
- ✅ MCP servers need root-level access (like your setup)
- ✅ Shared database connections
- ✅ Shared API keys
- ✅ Simpler management

**Pros:**
- Single source of truth for secrets
- MCP configs can access root `.env.local`
- Easier to manage shared credentials

**Cons:**
- All apps see all variables (use prefixes to avoid conflicts)

---

### Option 2: App-Level `.env.local` (Recommended for Isolation)

**Structure:**
```
AI-BOS-Finance/
├── .env                    # Shared defaults only
├── apps/
│   ├── web/
│   │   ├── .env.local      # Web secrets
│   │   └── .env.example    # Web template
│   └── kernel/
│       ├── .env.local      # Kernel secrets
│       └── .env.example    # Kernel template
```

**When to use:**
- ✅ Different apps need different credentials
- ✅ Strict isolation required
- ✅ Different deployment targets

**Pros:**
- Better isolation
- App-specific secrets
- Clearer ownership

**Cons:**
- MCP configs need to reference app-level files
- More files to manage

---

### Option 3: Hybrid Approach (Best for Your Setup)

**Structure:**
```
AI-BOS-Finance/
├── .env                    # Shared defaults (committed)
├── .env.local              # Shared secrets + MCP tokens (gitignored)
├── .env.example            # Template (committed)
├── apps/
│   ├── web/
│   │   ├── .env.local      # Web-specific overrides (optional)
│   │   └── .env.example    # Web template
│   └── kernel/
│       ├── .env.local      # Kernel-specific overrides (optional)
│       └── .env.example    # Kernel template
```

**Why This Works Best:**
- ✅ Root `.env.local` for MCP tokens (GitHub, Figma, Supabase)
- ✅ Root `.env.local` for shared database connections
- ✅ App-level `.env.local` for app-specific overrides
- ✅ Next.js automatically merges root + app-level files

---

## 🔐 Environment Variable Naming Conventions

### Prefix Strategy

```bash
# Next.js Public (exposed to browser)
NEXT_PUBLIC_*              # e.g., NEXT_PUBLIC_SUPABASE_URL

# App-Specific Prefixes
WEB_*                      # Web app only
KERNEL_*                   # Kernel app only
MCP_*                      # MCP servers only

# Service-Specific
SUPABASE_*                 # Supabase
DATABASE_*                 # Database
GITHUB_*                   # GitHub
FIGMA_*                    # Figma
```

### Example Structure

```bash
# ==========================================
# SHARED / MCP TOKENS (Root .env.local)
# ==========================================
GITHUB_TOKEN=...           # For GitHub MCP
FIGMA_TOKEN=...            # For Figma MCP
SUPABASE_TOKEN=...         # For Supabase MCP

# ==========================================
# NEXT.JS PUBLIC (apps/web/.env.local)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001

# ==========================================
# KERNEL APP (apps/kernel/.env.local)
# ==========================================
DATABASE_URL=...           # Kernel database
PORT=3001
LOG_LEVEL=debug
```

---

## ✅ Type-Safe Environment Validation

### Enhanced `apps/web/src/lib/env.ts`

```typescript
/**
 * Environment Variable Validation
 * 
 * Uses Zod for type-safe environment variable validation.
 * Validates both server-side and client-side variables.
 * 
 * @see REF_010 - Next.js Tools Recommendations
 * @see REF_039 - Environment File Best Practices
 */
import { z } from 'zod'

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database (server-only)
  DATABASE_URL: z.string().url().optional(),
  
  // MCP Tokens (server-only)
  GITHUB_TOKEN: z.string().min(1).optional(),
  FIGMA_TOKEN: z.string().min(1).optional(),
  SUPABASE_TOKEN: z.string().min(1).optional(),
  
  // Service Configuration
  PORT: z.string().regex(/^\d+$/).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

/**
 * Client-side environment variables schema
 * Must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_KERNEL_URL: z.string().url().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_DEBUG: z.string().transform(val => val === 'true').optional(),
})

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema)

/**
 * Validated environment variables
 * 
 * Usage:
 * ```ts
 * import { env } from '@/lib/env'
 * console.log(env.NODE_ENV)
 * console.log(env.NEXT_PUBLIC_SUPABASE_URL)
 * ```
 * 
 * @throws {ZodError} If environment variables don't match schema
 */
function getEnv() {
  const parsed = envSchema.safeParse({
    // Server-side
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    FIGMA_TOKEN: process.env.FIGMA_TOKEN,
    SUPABASE_TOKEN: process.env.SUPABASE_TOKEN,
    PORT: process.env.PORT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    
    // Client-side
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_KERNEL_URL: process.env.NEXT_PUBLIC_KERNEL_URL,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG,
  })

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

export const env = getEnv()
export type Env = z.infer<typeof envSchema>
```

---

## 📋 Environment File Templates

### Root `.env.example` (Committed)

```bash
# ==========================================
# AI-BOS Finance - Environment Template
# ==========================================
# Copy this file to .env.local and fill in your values
# DO NOT commit .env.local to version control!
# ==========================================

# ==========================================
# NODE ENVIRONMENT
# ==========================================
NODE_ENV=development

# ==========================================
# MCP SERVER TOKENS (for Cursor IDE & Next.js MCP)
# ==========================================
# GitHub MCP Server
GITHUB_TOKEN=your_github_token_here

# Figma MCP Server
FIGMA_TOKEN=your_figma_token_here

# Supabase MCP Server
SUPABASE_TOKEN=your_supabase_token_here

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL=postgresql://user:password@host:port/database

# ==========================================
# NEXT.JS PUBLIC VARIABLES
# ==========================================
# These are exposed to the browser - be careful!
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
```

### `apps/web/.env.example` (Committed)

```bash
# ==========================================
# Web App - Environment Template
# ==========================================
# Web-specific environment variables
# Root .env.local is automatically merged
# ==========================================

# Next.js Public Variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### `apps/kernel/.env.example` (Committed)

```bash
# ==========================================
# Kernel App - Environment Template
# ==========================================
# Kernel-specific environment variables
# Root .env.local is automatically merged
# ==========================================

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Service Configuration
PORT=3001
LOG_LEVEL=debug
SERVICE_NAME=bff-admin-config
SERVICE_VERSION=1.0.0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🔧 MCP Configuration Integration

### `.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["--no-install", "-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "next-devtools": {
      "command": "npx",
      "args": ["--no-install", "-y", "next-devtools-mcp"],
      "env": {
        "NEXT_MCP_WATCH": "${env:NEXT_MCP_WATCH}",
        "NEXT_MCP_TRACK_CHANGES": "${env:NEXT_MCP_TRACK_CHANGES}",
        "NEXT_MCP_LOG_UPDATES": "${env:NEXT_MCP_LOG_UPDATES}"
      }
    }
  }
}
```

**Key Points:**
- MCP config references `${env:VARIABLE_NAME}` from root `.env.local`
- Next.js MCP variables can be in root `.env.local` or `apps/web/.env.local`
- Both locations work because Next.js merges environment files

---

## 🚀 Best Practices Summary

### ✅ DO

1. **Use `.env.example` files** - Commit templates, never secrets
2. **Validate with Zod** - Type-safe environment variables
3. **Use prefixes** - `NEXT_PUBLIC_*` for client, app prefixes for isolation
4. **Document variables** - Comments in `.env.example` files
5. **Root `.env.local` for MCP** - MCP servers need root-level access
6. **App-level for overrides** - App-specific variables in app directories
7. **Use `.local` suffix** - Always gitignored, never committed

### ❌ DON'T

1. **Don't commit `.env.local`** - Always gitignored
2. **Don't hardcode secrets** - Always use environment variables
3. **Don't mix concerns** - Separate MCP, database, and app variables
4. **Don't use `NEXT_PUBLIC_*` for secrets** - These are exposed to browser
5. **Don't duplicate variables** - Use inheritance from root `.env.local`

---

## 📊 File Organization Checklist

- [ ] Root `.env.example` with all shared variables (committed)
- [ ] Root `.env.local` with actual secrets (gitignored)
- [ ] `apps/web/.env.example` with web-specific variables (committed)
- [ ] `apps/web/.env.local` with web secrets (gitignored, optional)
- [ ] `apps/kernel/.env.example` with kernel-specific variables (committed)
- [ ] `apps/kernel/.env.local` with kernel secrets (gitignored, optional)
- [ ] `apps/web/src/lib/env.ts` with Zod validation
- [ ] `.gitignore` excludes all `.env.local` files
- [ ] MCP config references `${env:VARIABLE_NAME}` format

---

## 🔍 Troubleshooting

### Issue: MCP Server Can't Find Token

**Problem:** `GITHUB_TOKEN` not found by MCP server

**Solution:**
1. Ensure `GITHUB_TOKEN` is in root `.env.local` (not app-level)
2. Restart Cursor IDE / VS Code after adding token
3. Verify MCP config uses `${env:GITHUB_TOKEN}` format

### Issue: Next.js Can't Read Environment Variables

**Problem:** `process.env.NEXT_PUBLIC_*` is `undefined`

**Solution:**
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Restart Next.js dev server after adding variables
3. Check `apps/web/src/lib/env.ts` validation schema

### Issue: Variable Conflicts Between Apps

**Problem:** Web app sees kernel variables or vice versa

**Solution:**
1. Use app-specific prefixes (`WEB_*`, `KERNEL_*`)
2. Use app-level `.env.local` files for isolation
3. Document which variables belong to which app

---

## 📚 References

- [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [REF_010: Next.js Tools Recommendations](./REF_010_NextJsToolsRecommendations.md)
- [Zod Documentation](https://zod.dev/)

---

**Last Updated:** 2025-01-27  
**Maintained By:** AI-BOS Finance Team
