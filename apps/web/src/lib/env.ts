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
  
  // Database (server-only, optional)
  DATABASE_URL: z.string().url().optional(),
  
  // MCP Tokens (server-only, optional)
  GITHUB_TOKEN: z.string().min(1).optional(),
  FIGMA_TOKEN: z.string().min(1).optional(),
  SUPABASE_TOKEN: z.string().min(1).optional(),
  
  // Next.js MCP DevTools (server-only)
  NEXT_MCP_WATCH: z.string().transform(val => val === 'true').optional(),
  NEXT_MCP_TRACK_CHANGES: z.string().transform(val => val === 'true').optional(),
  NEXT_MCP_LOG_UPDATES: z.string().transform(val => val === 'true').optional(),
  
  // Service Configuration (server-only)
  PORT: z.string().regex(/^\d+$/).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

/**
 * Client-side environment variables schema
 * Must be prefixed with NEXT_PUBLIC_ (exposed to browser)
 */
const clientEnvSchema = z.object({
  // Supabase (client-side)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  
  // Kernel API (client-side)
  NEXT_PUBLIC_KERNEL_URL: z.string().url().optional(),
  
  // Feature Flags (client-side)
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
    NEXT_MCP_WATCH: process.env.NEXT_MCP_WATCH,
    NEXT_MCP_TRACK_CHANGES: process.env.NEXT_MCP_TRACK_CHANGES,
    NEXT_MCP_LOG_UPDATES: process.env.NEXT_MCP_LOG_UPDATES,
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
