#!/usr/bin/env node
/* Scans ./audio for .mp3/.ogg/.wav/.m4a files and writes ./audio/tracks.json.
   - audio/my-song.mp3          -> category "Free"
   - audio/chill/lazy-sunday.mp3 -> category "Chill"  (the sub-folder name)
   File names become titles: "lazy-sunday.mp3" -> "Lazy Sunday".
   Optional audio/names.json: { "chill/lazy-sunday.mp3": { "en": "Lazy Sunday", "ar": "أحد كسول" } }
   Runs automatically on every Vercel deploy (see vercel.json) and can be run locally: node scripts/build-audio-manifest.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'audio');
const EXT = /\.(mp3|ogg|wav|m4a)$/i;
fs.mkdirSync(root, { recursive: true });
let names = {};
try { names = JSON.parse(fs.readFileSync(path.join(root, 'names.json'), 'utf8')); } catch (e) {}
const title = s => s.replace(EXT, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
const walk = (dir, rel = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
  const r = rel ? rel + '/' + d.name : d.name;
  return d.isDirectory() ? walk(path.join(dir, d.name), r) : EXT.test(d.name) ? [r] : [];
});
const audio = walk(root).sort().map(rel => {
  const parts = rel.split('/'), file = parts.pop();
  const cat = parts.length ? title(parts[0]) : 'Free';
  const nm = names[rel];
  return {
    id: 'a-' + rel.replace(EXT, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: nm && typeof nm === 'object' ? nm : (typeof nm === 'string' ? nm : title(file)),
    category: cat,
    url: 'audio/' + rel.split('/').map(encodeURIComponent).join('/')
  };
});
fs.writeFileSync(path.join(root, 'tracks.json'), JSON.stringify({ audio }, null, 2) + '\n');
console.log(`audio/tracks.json: ${audio.length} track(s)`);
