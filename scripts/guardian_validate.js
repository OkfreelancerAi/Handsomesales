#!/usr/bin/env node
/**
 * GUARDIAN VALIDATOR — Phase 1 Safety Rail for HANDSOMESALES
 * 
 * Enforces structural integrity, ASIN consistency, affiliate attribution,
 * and data synchronization across HTML elements and JS data models.
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

// 1. Read index.html
if (!fs.existsSync(INDEX_HTML)) {
  addError('syncCheck', 'index.html not found');
  finish();
}

const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

// 2. Parse HTML product cards
const cardRegex = /<article\s+class="card"\s+data-product-id="([A-Z0-9]{10})">([\s\S]*?)<\/article>/gi;
const htmlProducts = [];
let cardMatch;

while ((cardMatch = cardRegex.exec(htmlContent)) !== null) {
  const asin = cardMatch[1];
  const cardBody = cardMatch[2];

  // Extract affiliate anchor within this card
  const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>/gi;
  let anchorMatch;
  const cardAnchors = [];

  while ((anchorMatch = anchorRegex.exec(cardBody)) !== null) {
    const fullTag = anchorMatch[0];
    const href = anchorMatch[1];
    
    // Parse attributes
    const relMatch = fullTag.match(/rel="([^"]+)"/i);
    const rel = relMatch ? relMatch[1].split(/\s+/) : [];
    
    const productAttrMatch = fullTag.match(/data-hs-product="([^"]+)"/i);
    const dataHsProduct = productAttrMatch ? productAttrMatch[1] : null;

    const classMatch = fullTag.match(/class="([^"]+)"/i);
    const classes = classMatch ? classMatch[1].split(/\s+/) : [];

    cardAnchors.push({ fullTag, href, rel, dataHsProduct, classes });
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
    report.summary.totalUrlsChecked++;
    
    // Check rel="noopener sponsored"
    const missingRel = REQUIRED_REL.filter(r => !anchor.rel.includes(r));
    if (missingRel.length > 0) {
      addError('htmlAnchorAttributes', `ASIN ${prod.asin}: anchor missing required rel attributes: ${missingRel.join(', ')} in ${anchor.fullTag}`);
    } else {
      addPass('htmlAnchorAttributes', `ASIN ${prod.asin}: rel="noopener sponsored" verified`);
    }

    // Check data-hs-product matching card ASIN
    if (anchor.dataHsProduct !== prod.asin) {
      addError('asinConsistency', `ASIN ${prod.asin}: anchor data-hs-product="${anchor.dataHsProduct}" mismatch with parent card ASIN`);
    } else {
      addPass('asinConsistency', `ASIN ${prod.asin}: data-hs-product matches parent card`);
    }

    // Check URL tag and ASIN
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

// 4. Parse HS_PRODUCTS array from JS
const hsProductsMatch = htmlContent.match(/const\s+HS_PRODUCTS\s*=\s*(\[\s*[\s\S]*?\n\s*\]);/);
let jsProducts = [];

if (!hsProductsMatch) {
  addError('jsDataModel', 'Could not locate const HS_PRODUCTS = [...] in index.html');
} else {
  try {
    const rawJsArray = hsProductsMatch[1];
    jsProducts = Function(`"use strict"; return (${rawJsArray});`)();
    report.summary.jsProductsCount = jsProducts.length;
    addPass('jsDataModel', `Successfully parsed HS_PRODUCTS array (${jsProducts.length} items)`);
  } catch (err) {
    addError('jsDataModel', `Failed to parse HS_PRODUCTS JS array: ${err.message}`);
  }
}

// Check JS products internal integrity
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

  // Validate affiliateUrl in JS
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

// Duplicate JS ASIN check
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
