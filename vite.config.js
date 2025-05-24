import { defineConfig } from 'vite';

export default defineConfig({
  root: process.cwd(),
  server: {
    port: 3001,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  assetsInclude: ['**/*.eot', '**/*.ttf', '**/*.woff', '**/*.woff2', '**/*.svg'],
}); 