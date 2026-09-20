#!/usr/bin/env node
/**
 * GUARDIAN VALIDATOR — Hardened Phase 1 Safety Rail for HANDSOMESALES
 * 
 * Enforces structural integrity, ASIN consistency, affiliate attribution,
 * and data synchronization across HTML elements and JS data models.
 * 
 * Hardened Features:
 * 1. Safe static parsing for HS_PRODUCTS (No Function() or eval()).
 * 2. Attribute-order independent HTML parsing for cards and anchors.
 * 3. Scoped link inspection (only evaluates Amazon/affiliate links for tag/ASIN rules).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const EXPECTED_TAG = 'handsomesales-20';
const REQUIRED_REL = ['noopener', 'sponsored'];

const report = {
  timestamp: new Date().toISOString(),
  passed: true,
  summary: {
    totalUrlsChecked: 0,
    htmlProductsCount: 0,
    jsProductsCount: 0,
    errorsCount: 0,
    warningsCount: 0
  },
  checks: {
    affiliateUrls: { passed: true, details: [] },
    htmlAnchorAttributes: { passed: true, details: [] },
    asinConsistency: { passed: true, details: [] },
    jsDataModel: { passed: true, details: [] },
    syncCheck: { passed: true, details: [] }
  },
  errors: [],
  warnings: []
};

function addError(checkName, msg) {
  report.passed = false;
  report.checks[checkName].passed = false;
  report.checks[checkName].details.push(`[ERROR] ${msg}`);
  report.errors.push(msg);
  report.summary.errorsCount++;
}

function addWarning(checkName, msg) {
  report.checks[checkName].details.push(`[WARN] ${msg}`);
  report.warnings.push(msg);
  report.summary.warningsCount++;
}

function addPass(checkName, msg) {
  report.checks[checkName].details.push(`[PASS] ${msg}`);
}

// Helper: Extract attributes safely regardless of order or whitespace
function parseAttributes(attrString) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? true;
    attrs[key] = val;
  }
  return attrs;
}

// Helper: Safe parser for HS_PRODUCTS JS array without Function() or eval()
function safeParseHsProducts(rawJsArray) {
  let cleaned = rawJsArray
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    .trim();

  const products = [];
  const objectRegex = /\{([\s\S]*?)\}/g;
  let objMatch;

  while ((objMatch = objectRegex.exec(cleaned)) !== null) {
    const objContent = objMatch[1];
    const item = {};
    
    const kvRegex = /([a-zA-Z0-9_]+)\s*:\s*(?:"([^"]*)"|'([^']*)'|([^\s,}]+))/g;
    let kvMatch;
    while ((kvMatch = kvRegex.exec(objContent)) !== null) {
      const key = kvMatch[1];
      const val = kvMatch[2] ?? kvMatch[3] ?? kvMatch[4];
      item[key] = val;
    }

    if (Object.keys(item).length > 0) {
      products.push(item);
    }
  }

  return products;
}

// Helper: Check if URL is an Amazon / affiliate link
function isAmazonAffiliateLink(href) {
  if (!href) return false;
  return href.includes('amazon.com') || href.includes('amzn.to') || href.includes('tag=');
}

// 1. Read index.html
if (!fs.existsSync(INDEX_HTML)) {
  addError('syncCheck', 'index.html not found');
  finish();
}

const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

// 2. Parse HTML product cards (Attribute order independent)
const cardRegex = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
const htmlProducts = [];
let cardMatch;

while ((cardMatch = cardRegex.exec(htmlContent)) !== null) {
  const attrStr = cardMatch[1];
  const cardBody = cardMatch[2];
  const attrs = parseAttributes(attrStr);

  const classes = (attrs.class || '').split(/\s+/);
  if (!classes.includes('card')) {
    continue;
  }

  const asin = attrs['data-product-id'];
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    addError('asinConsistency', `Article card missing or invalid data-product-id attribute`);
    continue;
  }

  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let anchorMatch;
  const cardAnchors = [];

  while ((anchorMatch = anchorRegex.exec(cardBody)) !== null) {
    const anchorAttrStr = anchorMatch[1];
    const fullTag = `<a${anchorAttrStr}>`;
    const anchorAttrs = parseAttributes(anchorAttrStr);

    const href = anchorAttrs.href || '';
    const rel = (anchorAttrs.rel || '').split(/\s+/).filter(Boolean);
    const dataHsProduct = anchorAttrs['data-hs-product'] || null;
    const anchorClasses = (anchorAttrs.class || '').split(/\s+/).filter(Boolean);

    cardAnchors.push({ fullTag, href, rel, dataHsProduct, classes: anchorClasses });
  }

  htmlProducts.push({
    asin,
    anchors: cardAnchors
  });
}

report.summary.htmlProductsCount = htmlProducts.length;

// Duplicate HTML ASIN check
const htmlAsins = htmlProducts.map(p => p.asin);
const duplicateHtmlAsins = htmlAsins.filter((asin, idx) => htmlAsins.indexOf(asin) !== idx);
if (duplicateHtmlAsins.length > 0) {
  addError('asinConsistency', `Duplicate ASINs found in HTML product grid: ${duplicateHtmlAsins.join(', ')}`);
} else {
  addPass('asinConsistency', `Unique ASINs verified in HTML grid (${htmlProducts.length} items)`);
}

// 3. Validate HTML anchors
for (const prod of htmlProducts) {
  for (const anchor of prod.anchors) {
    if (!isAmazonAffiliateLink(anchor.href)) {
      addPass('affiliateUrls', `ASIN ${prod.asin}: non-affiliate link ignored (${anchor.href})`);
      continue;
    }

    report.summary.totalUrlsChecked++;
    
    const missingRel = REQUIRED_REL.filter(r => !anchor.rel.includes(r));
    if (missingRel.length > 0) {
      addError('htmlAnchorAttributes', `ASIN ${prod.asin}: anchor missing required rel attributes: ${missingRel.join(', ')} in ${anchor.fullTag}`);
    } else {
      addPass('htmlAnchorAttributes', `ASIN ${prod.asin}: rel="noopener sponsored" verified`);
    }

    if (anchor.dataHsProduct !== prod.asin) {
      addError('asinConsistency', `ASIN ${prod.asin}: anchor data-hs-product="${anchor.dataHsProduct}" mismatch with parent card ASIN`);
    } else {
      addPass('asinConsistency', `ASIN ${prod.asin}: data-hs-product matches parent card`);
    }

    try {
      const u = new URL(anchor.href);
      const tag = u.searchParams.get('tag');
      if (tag !== EXPECTED_TAG) {
        addError('affiliateUrls', `ASIN ${prod.asin}: URL tag is '${tag}', expected '${EXPECTED_TAG}' in ${anchor.href}`);
      } else {
        addPass('affiliateUrls', `ASIN ${prod.asin}: tag=${EXPECTED_TAG} verified`);
      }

      if (!u.pathname.includes(prod.asin)) {
        addError('asinConsistency', `ASIN ${prod.asin}: URL pathname '${u.pathname}' does not contain ASIN`);
      }
    } catch (e) {
      addError('affiliateUrls', `ASIN ${prod.asin}: invalid URL string '${anchor.href}'`);
    }
  }
}

// 4. Safe Parse HS_PRODUCTS array from JS without Function()/eval()
const hsProductsMatch = htmlContent.match(/const\s+HS_PRODUCTS\s*=\s*(\[\s*[\s\S]*?\n\s*\]);/);
let jsProducts = [];

if (!hsProductsMatch) {
  addError('jsDataModel', 'Could not locate const HS_PRODUCTS = [...] in index.html');
} else {
  try {
    const rawJsArray = hsProductsMatch[1];
    jsProducts = safeParseHsProducts(rawJsArray);
    report.summary.jsProductsCount = jsProducts.length;
    addPass('jsDataModel', `Safely parsed HS_PRODUCTS array without code execution (${jsProducts.length} items)`);
  } catch (err) {
    addError('jsDataModel', `Failed to parse HS_PRODUCTS JS array: ${err.message}`);
  }
}

const jsAsins = [];
for (const p of jsProducts) {
  if (!p.id || !/^[A-Z0-9]{10}$/.test(p.id)) {
    addError('jsDataModel', `Invalid or missing product id (ASIN) in HS_PRODUCTS entry: ${JSON.stringify(p)}`);
    continue;
  }
  jsAsins.push(p.id);

  if (!p.name || !p.category || !p.affiliateUrl) {
    addError('jsDataModel', `Product ${p.id} missing required fields (name, category, affiliateUrl)`);
  }

  try {
    const u = new URL(p.affiliateUrl);
    const tag = u.searchParams.get('tag');
    if (tag !== EXPECTED_TAG) {
      addError('affiliateUrls', `HS_PRODUCTS [${p.id}]: affiliateUrl tag is '${tag}', expected '${EXPECTED_TAG}'`);
    }
    if (!u.pathname.includes(p.id)) {
      addError('asinConsistency', `HS_PRODUCTS [${p.id}]: affiliateUrl pathname does not contain ASIN ${p.id}`);
    }
  } catch (e) {
    addError('affiliateUrls', `HS_PRODUCTS [${p.id}]: invalid affiliateUrl '${p.affiliateUrl}'`);
  }
}

const duplicateJsAsins = jsAsins.filter((asin, idx) => jsAsins.indexOf(asin) !== idx);
if (duplicateJsAsins.length > 0) {
  addError('jsDataModel', `Duplicate ASINs found in HS_PRODUCTS: ${duplicateJsAsins.join(', ')}`);
}

// 5. Cross-synchronization check (HTML vs JS)
const missingInJs = htmlAsins.filter(asin => !jsAsins.includes(asin));
const missingInHtml = jsAsins.filter(asin => !htmlAsins.includes(asin));

if (missingInJs.length > 0) {
  addError('syncCheck', `ASINs in HTML grid missing from HS_PRODUCTS JS model: ${missingInJs.join(', ')}`);
}
if (missingInHtml.length > 0) {
  addError('syncCheck', `ASINs in HS_PRODUCTS JS model missing from HTML grid: ${missingInHtml.join(', ')}`);
}

if (missingInJs.length === 0 && missingInHtml.length === 0 && htmlAsins.length > 0) {
  addPass('syncCheck', `HTML grid and HS_PRODUCTS JS model perfectly synchronized (${htmlAsins.length} items)`);
}

function finish() {
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'reports', 'guardian_report.json'), JSON.stringify(report, null, 2));

  let textReport = `===================================================\n`;
  textReport += `GUARDIAN VALIDATION REPORT — ${report.timestamp}\n`;
  textReport += `Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  textReport += `Summary: ${report.summary.htmlProductsCount} HTML cards | ${report.summary.jsProductsCount} JS items | ${report.summary.totalUrlsChecked} URLs checked\n`;
  textReport += `Errors: ${report.summary.errorsCount} | Warnings: ${report.summary.warningsCount}\n`;
  textReport += `===================================================\n\n`;

  for (const [checkName, checkData] of Object.entries(report.checks)) {
    textReport += `[${checkName.toUpperCase()}] — ${checkData.passed ? 'PASSED' : 'FAILED'}\n`;
    for (const d of checkData.details) {
      textReport += `  ${d}\n`;
    }
    textReport += `\n`;
  }

  fs.writeFileSync(path.join(ROOT, 'reports', 'guardian_output.txt'), textReport);
  console.log(textReport);

  process.exitCode = report.passed ? 0 : 1;
}

finish();
