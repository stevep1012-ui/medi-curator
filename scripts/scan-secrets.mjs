#!/usr/bin/env node
// 비밀키 정규식 스캔 — src/ 전체. CI 의 STATIC 게이트에서 호출.
import fs from 'node:fs';
import path from 'node:path';

const PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Firebase web key (live)', re: /apiKey:\s*['"]AIza[0-9A-Za-z_-]{35}['"]/g },
  { name: 'Generic secret', re: /(SECRET|TOKEN|PRIVATE_KEY)\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]/g },
  { name: 'JWT', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
];

const ALLOWLIST = [
  /\.env\.local\.example$/,
  /node_modules/,
  /dist\//,
  /\.git\//,
  /scan-secrets\.mjs$/,
  // Firebase 웹 config는 공개값(비밀 아님). 정적 호스트(Render 등)용 런타임 config.
  /public\/__\/firebase\/init\.json$/,
];

let hits = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (ALLOWLIST.some(rx => rx.test(p))) continue;
    if (entry.isDirectory()) { walk(p); continue; }
    if (!/\.(ts|tsx|js|jsx|mjs|json|html|env)$/.test(entry.name)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    for (const { name, re } of PATTERNS) {
      const m = txt.match(re);
      if (m) {
        console.error(`✗ ${p} — ${name}: ${m[0].slice(0, 12)}…`);
        hits += m.length;
      }
    }
  }
}

walk('.');
if (hits > 0) {
  console.error(`\n비밀키 ${hits}건 발견. SEC-gate BLOCK.`);
  process.exit(1);
}
console.log('✓ 비밀키 스캔 PASS');
