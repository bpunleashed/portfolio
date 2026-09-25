// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://bpunleashed.github.io',
  base: '/portfolio',
  build: {
    assets: 'assets' // Ukladá CSS do /assets namiesto /_astro
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [mdx()]
});