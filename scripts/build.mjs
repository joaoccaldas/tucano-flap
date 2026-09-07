import { build } from 'esbuild';
import { mkdir, cp, access, readFile } from 'node:fs/promises';

// Any compile or required-asset failure must fail the release.
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/main.ts'], bundle: true, outfile: 'dist/bundle.js', format: 'esm', minify: true, sourcemap: 'external' });
await cp('index.html', 'dist/index.html');
await cp('public/sprites', 'dist/sprites', { recursive: true });
await mkdir('dist/backgrounds', { recursive: true });
await cp('public/backgrounds/brazil-coast-panorama.jpg', 'dist/backgrounds/brazil-coast-panorama.jpg');
await access('dist/bundle.js');
const html = await readFile('dist/index.html', 'utf8');
if (!html.includes('./bundle.js')) throw new Error('HTML entry point does not load the game bundle');
console.log('Game bundle, HTML and required assets ready.');
