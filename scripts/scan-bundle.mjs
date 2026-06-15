#!/usr/bin/env node
// 빌드 산출물(dist/) 에서 비밀키 노출 검사. SEC-gate 차단권.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || 'dist';
if (!fs.existsSync(dir)) { console.log(`${dir} 없음 — 빌드 먼저`); process.exit(0); }

const PATTERNS = [
  /AIza[0-9A-Za-z_-]{35}/g,
  /sk-[A-Za-z0-9]{32,}/g,
  /firebase[A-Za-z0-9_-]*['"]?\s*:\s*['"]AIza/g,
];

let hits = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    // Firebase 웹 config(init.json)는 공개값 — 정적 호스트용 런타임 config라 dist에 포함되며 비밀 아님.
    if (/[\\/]__[\\/]firebase[\\/]init\.json$/.test(p)) continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(js|html|json|map)$/.test(e.name)) {
      const txt = fs.readFileSync(p, 'utf8');
      for (const re of PATTERNS) {
        const m = txt.match(re);
        if (m) hits.push({ file: p, match: m[0].slice(0, 16) + '…' });
      }
    }
  }
}
walk(dir);
if (hits.length) {
  console.error('✗ 번들에 비밀키 노출 발견:');
  for (const h of hits) console.error(`  ${h.file} :: ${h.match}`);
  process.exit(1);
}
console.log('✓ 번들 비밀키 스캔 PASS');
