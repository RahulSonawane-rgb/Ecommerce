import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const useTunnel = !!process.env.VITE_TUNNEL_HOST;
  const odooUrl = process.env.VITE_ODOO_URL || 'http://localhost:8069';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      ...(useTunnel
        ? {
            allowedHosts: [process.env.VITE_TUNNEL_HOST],
            hmr: { clientPort: 443, protocol: 'wss' },
          }
        : {}),
      proxy: {
        '/odoo': {
          target: odooUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/odoo/, ''),
        },
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});