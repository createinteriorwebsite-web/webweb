#!/usr/bin/env node
/* Resize every image in assets/img/orig into assets/img/web (max 1800px) and
   assets/img/thumb (max 700px) as JPEG. Uses macOS `sips`; no npm install needed.
   Usage: node optimize.js */
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = __dirname, ORIG = path.join(ROOT, 'assets/img/orig');
const WEB = path.join(ROOT, 'assets/img/web'), THUMB = path.join(ROOT, 'assets/img/thumb');
[WEB, THUMB].forEach(d => fs.mkdirSync(d, { recursive: true }));
for (const f of fs.readdirSync(ORIG)) {
  if (!/\.(jpe?g|png|webp)$/i.test(f) || /logo|menu|elementor/i.test(f)) continue;
  const name = f.replace(/\.[^.]+$/, '');
  const src = path.join(ORIG, f);
  const jobs = [[WEB, 1800, 78], [THUMB, 700, 72]];
  for (const [dir, size, q] of jobs) {
    const out = path.join(dir, name + '.jpg');
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q), '-Z', String(size), src, '--out', out], { stdio: 'ignore' });
    console.log('→', path.relative(ROOT, out));
  }
}
