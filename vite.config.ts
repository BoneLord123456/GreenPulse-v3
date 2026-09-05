import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, {recursive: true});
  const entries = fs.readdirSync(src, {withFileTypes: true});
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      {
        name: 'copy-static-assets',
        closeBundle() {
          const distDir = path.resolve(process.cwd(), 'dist');
          if (fs.existsSync(distDir)) {
            copyDirSync(path.resolve(process.cwd(), 'css'), path.resolve(distDir, 'css'));
            copyDirSync(path.resolve(process.cwd(), 'js'), path.resolve(distDir, 'js'));
          }
        },
      },
    ],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
