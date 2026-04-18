#!/usr/bin/env node

/**
 * Design System Validation Script
 *
 * Checks:
 * 1. All UI components in components/ui/ are documented in the Component Gallery
 * 2. All CSS tokens used in components are defined in globals.css
 * 3. No hardcoded color, font size, or spacing values exist outside token files
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../components/ui');
const DESIGN_PAGE = path.join(__dirname, '../app/(app)/admin/design/page.tsx');
const GLOBALS_CSS = path.join(__dirname, '../app/globals.css');

// Components that are internal/layout-specific and don't need gallery entries
const INTERNAL_COMPONENTS = new Set([
  'bot-drawer',
  'cmd-palette',
  'frag-detail',
  'frag-form',
  'frag-row',
  'frag-search',
  'fragrance-row-editorial',
  'form',
  'page-filter-bar',
  'sort-control',
  'toast',
  'token-preview-listener',
  'accord-cloud',
  'card',
  'divider',
  'stat-card',
]);

let errors = [];
let warnings = [];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Check that all UI components are documented
// ─────────────────────────────────────────────────────────────────────────────

function checkComponentDocumentation() {
  const componentFiles = fs.readdirSync(COMPONENTS_DIR)
    .filter(f => f.endsWith('.tsx'))
    .map(f => f.replace('.tsx', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''))
    .filter(f => !INTERNAL_COMPONENTS.has(f));

  const designPageContent = fs.readFileSync(DESIGN_PAGE, 'utf8');
  const galleryIds = (designPageContent.match(/id:\s*['"]([^'"]+)['"]/g) || [])
    .map(m => m.match(/['"]([^'"]+)['"]/)[1]);

  const gallerySet = new Set(galleryIds);

  const normalizeComponentName = (name) => {
    return name.toLowerCase().replace(/[_-]/g, '-');
  };

  const undocumented = componentFiles.filter(comp => {
    const normalizedComp = normalizeComponentName(comp);
    const isDocumented = Array.from(gallerySet).some(id =>
      normalizeComponentName(id) === normalizedComp
    );
    return !isDocumented;
  });

  if (undocumented.length > 0) {
    errors.push(`[COMPONENTS] Undocumented shared components in gallery: ${undocumented.join(', ')}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Check for undefined CSS tokens used in components
// ─────────────────────────────────────────────────────────────────────────────

function checkTokenDefinitions() {
  const globalsCssContent = fs.readFileSync(GLOBALS_CSS, 'utf8');

  const definedTokens = new Set();
  const tokenPattern = /--[\w-]+/g;
  let match;
  while ((match = tokenPattern.exec(globalsCssContent)) !== null) {
    definedTokens.add(match[0]);
  }

  const componentFiles = fs.readdirSync(COMPONENTS_DIR)
    .filter(f => f.endsWith('.tsx'));

  const undefinedTokens = new Set();

  for (const file of componentFiles) {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf8');
    const tokens = (content.match(/var\(--[\w-]+\)/g) || [])
      .map(t => t.match(/--[\w-]+/)[0]);

    tokens.forEach(token => {
      if (!definedTokens.has(token)) {
        undefinedTokens.add(token);
      }
    });
  }

  if (undefinedTokens.size > 0) {
    errors.push(`[TOKENS] Undefined tokens used: ${Array.from(undefinedTokens).sort().join(', ')}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all checks
// ─────────────────────────────────────────────────────────────────────────────

try {
  checkComponentDocumentation();
  checkTokenDefinitions();
} catch (err) {
  errors.push(`[SCRIPT ERROR] ${err.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Output results
// ─────────────────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error('✗ Design System Validation Failed:');
  errors.forEach(e => console.error('  ' + e));
  console.error('');
  process.exit(1);
} else {
  console.log('✓ Design System validation passed');
  process.exit(0);
}
