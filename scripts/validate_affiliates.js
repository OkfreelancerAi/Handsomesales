#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALLOWED_AFFILIATE_HOSTS = new Set(['amzn.to', 'a.co', 'amazon.com', 'www.amazon.com']);
const AMAZON_HOSTS = /(^|\.)amazon\./i;
const filesToScan = ['index.html', 'disclosure.html'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(html|js|jsx|ts|tsx|json)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function extractUrls(text) {
  return [...text.matchAll(/https?:\/\/[^\s"'<>`)]+/gi)].map(m => m[0].replace(/[),.;]+$/, ''));
}

const candidates = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const url of extractUrls(text)) {
    try {
      const u = new URL(url);
      if (AMAZON_HOSTS.test(u.hostname) || ALLOWED_AFFILIATE_HOSTS.has(u.hostname)) {
        candidates.push({ file: rel, url, host: u.hostname, query: u.searchParams });
      }
    } catch {}
  }
}

const errors = [];
for (const item of candidates) {
  if (item.host === 'amzn.to' || item.host === 'a.co') continue;
  if (AMAZON_HOSTS.test(item.host)) {
    const tag = item.query.get('tag');
    if (!tag) errors.push(`${item.file}: Amazon URL is missing the Associates tag: ${item.url}`);
    else if (tag !== 'handsomesales-20') errors.push(`${item.file}: unexpected Associates tag '${tag}' (expected 'handsomesales-20'): ${item.url}`);
  }
}

for (const required of filesToScan) {
  if (!fs.existsSync(path.join(ROOT, required))) errors.push(`Missing expected affiliate surface: ${required}`);
}

if (errors.length) {
  console.error('AFFILIATE VALIDATION FAILED');
  errors.forEach(e => console.error(`- ${e}`));
  process.exitCode = 1;
} else {
  console.log(`AFFILIATE VALIDATION PASSED — checked ${candidates.length} Amazon/affiliate URL(s).`);
}
