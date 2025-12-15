// metadata-studio/server.ts
// Dedicated server startup file
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './index';
import { initializeEventSystem } from './events';

async function startServer() {
    try {
        console.log('🚀 Starting metadata-studio server...');

        // 1. Initialize event system
        console.log('📡 Initializing event system...');
        await initializeEventSystem();

        // 2. Create Hono app
        console.log('🏗️  Creating application...');
        const app = createApp();

        // 3. Start HTTP server
        const port = Number(process.env.PORT ?? 8787);
        console.log(`🌐 Starting server on port ${port}...`);

        serve({ fetch: app.fetch, port });

        console.log('');
        console.log('✅ metadata-studio listening on http://localhost:' + port);
        console.log('✅ Health check: http://localhost:' + port + '/healthz');
        console.log('');
    } catch (error) {
        console.error('❌ Failed to start metadata-studio:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

