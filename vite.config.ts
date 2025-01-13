import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@emotion/babel-plugin',
            {
              autoLabel: 'always',
              labelFormat: '[local]',
              sourceMap: true,
              cssPropOptimization: true
            }
          ]
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
