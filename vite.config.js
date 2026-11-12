import { defineConfig } from 'vite';

// base relativa: el sitio funciona en cualquier dominio o subcarpeta (Netlify, Vercel, GitHub Pages…)
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
