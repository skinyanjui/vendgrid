import { build } from 'esbuild';
import fs from 'fs';
const r = await build({ entryPoints: ['src/main.jsx'], bundle: true, minify: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, target: 'es2019', loader: { '.css': 'text' } });
const js = r.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', `<title>VendGrid</title>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Buy, sell and find vending machines, parts, locations, routes and services.">\n<meta name="theme-color" content="#ffffff">\n<div id="root"></div>\n<script>${js}</script>`);
fs.copyFileSync('dist/index.html', 'dist/404.html'); // unknown addresses get the app's own not-found screen, with a 404 status
console.log('ok', (js.length/1024).toFixed(0)+'KB');
