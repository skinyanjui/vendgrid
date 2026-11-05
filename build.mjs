// Bundles src/ into a single self-contained dist/index.html and copies public/ assets.
import { build } from 'esbuild';
import fs from 'fs';

const r = await build({
  entryPoints: ['src/main.jsx'], bundle: true, minify: true, write: false, format: 'iife',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, target: 'es2019',
});
const js = r.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>VendGrid</title>
<meta name="description" content="Buy and sell vending machines, parts, locations, routes and services.">
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`);
fs.cpSync('public', 'dist', { recursive: true });
console.log('ok', (js.length / 1024).toFixed(0) + 'KB');
