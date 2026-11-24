import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pdfjsRoot = fileURLToPath(new URL('./node_modules/pdfjs-dist/', import.meta.url));
const pdfjsVersion: string = JSON.parse(readFileSync(pdfjsRoot + 'package.json', 'utf8')).version;
// Versioned so the week-long static cache never mixes files from two pdf.js releases.
const pdfjsAssets = `pdfjs-${pdfjsVersion}`;

// Character maps (needed for Korean/CJK PDFs without embedded fonts), the 14 standard fonts
// and image decoders. QuickJS is only used for PDF scripting, which the converter keeps off.
function pdfjsAssetFiles(): Plugin {
  return {
    name: 'pdfjs-assets',
    apply: 'build',
    generateBundle() {
      for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
        for (const file of readdirSync(pdfjsRoot + dir)) {
          if (file.includes('quickjs')) continue;
          this.emitFile({ type: 'asset', fileName: `${pdfjsAssets}/${dir}/${file}`, source: readFileSync(pdfjsRoot + dir + '/' + file) });
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), pdfjsAssetFiles()],
  define: { __PDFJS_ASSETS__: JSON.stringify(pdfjsAssets) },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8099',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
