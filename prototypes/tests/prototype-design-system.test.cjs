const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const prototypeDir = path.join(__dirname, '..');
const repositoryRoot = path.join(prototypeDir, '..');
const prototypeFiles = [
  'ai-service-development.html',
  'runtime-management.html',
  'settings-page-prototype.html'
];

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function cssOf(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'prototype must contain one inline style block');
  return match[1];
}

function variablesOf(source) {
  const match = source.match(/:root\s*\{([\s\S]*?)\}/);
  assert.ok(match, 'design tokens must be declared in :root');
  return Object.fromEntries(
    [...match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(item => [item[1], item[2].trim()])
  );
}

function declarationsFor(css, expectedSelector) {
  const declarations = {};
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = rule[1].split(',').map(selector => selector.trim());
    if (!selectors.includes(expectedSelector)) continue;
    for (const declaration of rule[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
      declarations[declaration[1]] = declaration[2].trim();
    }
  }
  return declarations;
}

const canonicalTokens = variablesOf(read('.agents/skills/enterprise-prototype-design/assets/design-tokens.css'));

test('all three prototypes inline the complete canonical token set without overrides', () => {
  for (const file of prototypeFiles) {
    const actual = variablesOf(cssOf(read(path.join('prototypes', file))));
    assert.deepEqual(actual, canonicalTokens, `${file} has drifted from the agreed design tokens`);
  }
});

test('all three prototypes share the same product shell and page hierarchy', () => {
  for (const file of prototypeFiles) {
    const html = read(path.join('prototypes', file));
    const css = cssOf(html);
    assert.match(html, /<span>数据服务平台<\/span>/, `${file} must use the platform product name`);
    assert.match(html, /<div class="top-domain">数据服务域<\/div>/, `${file} must use the domain name from CONTEXT.md`);
    assert.match(html, /<aside class="sidebar" aria-label="数据服务域导航">/);

    assert.equal(declarationsFor(css, '.topbar')['z-index'], '30');
    assert.equal(declarationsFor(css, '.topbar').height, 'var(--ds-nav-height)');
    assert.equal(declarationsFor(css, '.product-area').width, 'var(--ds-sidebar-width)');
    assert.equal(declarationsFor(css, '.sidebar')['z-index'], '20');
    assert.equal(declarationsFor(css, '.sidebar').width, 'var(--ds-sidebar-width)');
    assert.equal(declarationsFor(css, '.workspace').left, 'var(--ds-sidebar-width)');
    assert.equal(declarationsFor(css, '.page-head')['align-items'], 'flex-end');
    assert.equal(declarationsFor(css, '.page-head').padding, 'var(--ds-space-7) var(--ds-page-padding)');
  }
});

test('shared controls, status, table, overlays and feedback use one component contract', () => {
  for (const file of prototypeFiles) {
    const css = cssOf(read(path.join('prototypes', file)));
    const button = declarationsFor(css, '.btn');
    const status = declarationsFor(css, '.status');
    const tableCells = declarationsFor(css, 'td');
    const drawer = declarationsFor(css, '.drawer');
    const modal = declarationsFor(css, '.modal');
    const toast = declarationsFor(css, '.toast');

    assert.equal(button['min-height'], 'var(--ds-button-height)', `${file}: button height`);
    assert.equal(button['border-radius'], 'var(--ds-button-radius)', `${file}: button radius`);
    assert.equal(status['min-height'], '22px', `${file}: status height`);
    assert.equal(status['border-radius'], 'var(--ds-radius-small)', `${file}: status radius`);
    assert.equal(status['font-weight'], 'var(--ds-font-weight-medium)', `${file}: status weight`);
    assert.equal(tableCells.padding, 'var(--ds-table-cell-padding-block) var(--ds-table-cell-padding-inline)', `${file}: table density`);
    assert.equal(drawer.width, 'min(560px, 48vw)', `${file}: drawer width`);
    assert.equal(modal.width, 'var(--ds-modal-width)', `${file}: modal width`);
    assert.equal(modal['border-radius'], 'var(--ds-radius-large)', `${file}: modal radius`);
    assert.equal(toast.top, 'calc(var(--ds-nav-height) + var(--ds-space-7))', `${file}: toast vertical position`);
    assert.equal(toast.left, 'calc(var(--ds-sidebar-width) + (100vw - var(--ds-sidebar-width)) / 2)', `${file}: toast workspace centering`);
    assert.equal(toast['max-width'], '520px', `${file}: toast width`);
  }
});

test('prototype CSS stays token-based and artifacts stay offline and brand-neutral', () => {
  for (const file of prototypeFiles) {
    const html = read(path.join('prototypes', file));
    const cssWithoutRoot = cssOf(html).replace(/:root\s*\{[\s\S]*?\}/, '');
    assert.doesNotMatch(cssWithoutRoot, /#[0-9a-fA-F]{3,8}/, `${file} contains a parallel hard-coded color`);
    assert.doesNotMatch(html, /https?:\/\//i, `${file} contains a remote dependency`);
    assert.doesNotMatch(html, /HiMarket|HiChat|HiCoding/i, `${file} contains a third-party brand`);
    assert.doesNotMatch(html, /(?:[A-Za-z]:\\|\/mnt\/|\/home\/)/, `${file} contains a personal absolute path`);
    assert.match(cssOf(html), /@media\s*\(prefers-reduced-motion:\s*reduce\)/, `${file} must support reduced motion`);
  }
});

test('AI service development promotes variant C and isolates the historical harness', () => {
  const html = read(path.join('prototypes', 'ai-service-development.html'));
  assert.match(html, /var compareMode = queryParams\.get\("compare"\) === "1";/);
  assert.match(html, /var initialVariant = compareMode && variantNames\[requestedVariant\] \? requestedVariant : "C";/);
  assert.match(html, /\.prototype-switcher\[hidden\] \{ display: none; \}/);
  assert.match(html, /prototypeSwitcher\.hidden = !compareMode;/);
  assert.match(html, /function switchVariant\(step\) \{\s+if \(!compareMode\) return;/);
});
