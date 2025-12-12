/**
 * AIBOS Kernel - The Brain
 * 
 * Standalone API service that enforces the AI-BOS Constitution.
 * Provides metadata, lineage, policy, and event services.
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Import routes
import { metadataRoutes } from './routes/metadata.js';
import { lineageRoutes } from './routes/lineage.js';
import { policyRoutes } from './routes/policy.js';
import { eventsRoutes } from './routes/events.js';

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000'], // Allow apps/web
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'aibos-kernel',
    version: '0.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'aibos-kernel',
    uptime: process.uptime(),
  });
});

// Mount route handlers
app.route('/metadata', metadataRoutes);
app.route('/lineage', lineageRoutes);
app.route('/policy', policyRoutes);
app.route('/events', eventsRoutes);

// Start server
const port = Number(process.env.PORT) || 3001;

console.log(`🚀 AIBOS Kernel starting on http://localhost:${port}`);
console.log(`📋 PRD: KERNEL_01_AIBOS_KERNEL.md`);
console.log(`🧬 DNA: @aibos/schemas`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Kernel running on http://localhost:${info.port}`);
});
