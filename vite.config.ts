import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // 🔌 NEURAL LINK: Proxy /odata requests to the Backend
    proxy: {
      '/odata': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
