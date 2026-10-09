import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    // Permanent dev-network fix: same-origin '/api' calls are proxied to the
    // backend, so the browser never hits CORS. Keeps working when the app is
    // opened via localhost, 127.0.0.1, or a LAN IP. Set VITE_API_URL only to
    // point at a remote backend; leave it empty for proxy mode.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
