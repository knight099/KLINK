import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { esbuildOptions: { target: ['chrome107', 'edge107', 'firefox104', 'safari16'] } },
  build: { target: ['chrome107', 'edge107', 'firefox104', 'safari16'] },
  server: {
    port: 3000,
    host: true
  }
});
