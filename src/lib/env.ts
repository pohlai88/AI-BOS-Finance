/**
 * Environment Variable Validation
 *
 * Uses Zod for type-safe environment variable validation.
 * This replaces the deprecated @next/env package.
 *
 * @see REF_010 - Next.js Tools Recommendations
 */
import { z } from 'zod'

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Add server-only env vars here
  // DATABASE_URL: z.string().url().optional(),
})

/**
 * Client-side environment variables schema
 * Must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // Add more NEXT_PUBLIC_ vars here
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
 * ```
 */
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

export type Env = z.infer<typeof envSchema>
