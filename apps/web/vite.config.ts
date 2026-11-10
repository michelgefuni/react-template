import { fileURLToPath, URL } from 'node:url';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const compilerEnabled = env.VITE_REACT_COMPILER !== 'false';

  return {
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      tailwindcss(),
      react(),
      compilerEnabled
        ? babel({ plugins: [['babel-plugin-react-compiler', {}]] })
        : null,
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // @feature-bff-start
      ...(env.BFF_DEV_URL
        ? {
            proxy: {
              [env.VITE_API_BASE_PATH || '/api']: {
                target: env.BFF_DEV_URL,
                changeOrigin: true,
              },
            },
          }
        : {}),
      // @feature-bff-end
    },
  };
});
