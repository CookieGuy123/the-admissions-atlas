import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        clientPort: 3000,
        protocol: 'wss',
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : undefined,
      allowedHosts: ['localhost', '.app.github.dev'],
    },
  };
});
