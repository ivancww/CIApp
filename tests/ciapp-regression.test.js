const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const management = fs.readFileSync(path.join(root, 'ciapp-management.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'ava-storage.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

test('preserves existing workflow, plans and compensation logic', () => {
  for (const page of ['step_ci_dignity','step_ci_1','step_ci_2','step_ci_3','step_ci_4']) assert.match(html,new RegExp(page));
  for (const plan of ['planKey: "sce"','planKey: "oys2"','方案 A','方案 B']) assert.ok(html.includes(plan));
  for (const fn of ['runStage3Calculation','calculateCIPremium','executeDynamicClaim','undoLastMultiClaim']) assert.match(html,new RegExp(`function ${fn}\\(`));
});

test('provides frontend, user and admin entrances', () => {
  assert.match(management,/mode==="user"/);
  assert.match(management,/mode==="admin"/);
  assert.match(management,/promptAdminLogin/);
  assert.match(html,/dynamic-ci-container/);
});

test('private files use IndexedDB provider without Firebase', () => {
  assert.match(storage,/indexedDB\.open\(DB_NAME/);
  assert.match(storage,/AVA_USER_STORAGE_V1/);
  const personal = management.slice(management.indexOf('async uploadPersonalDocuments'),management.indexOf('async openPersonalDocument'));
  assert.match(personal,/AVAStorage\.saveFile/);
  assert.doesNotMatch(personal,/firebase|storage\.ref/i);
});

test('official cloud mutations require admin', () => {
  assert.match(management,/uploadFileToFirebase=function\(\) \{ if \(!isAdminMaster\)/);
  assert.match(management,/deleteAdminCaseItem=function\(category,index\) \{ if \(!isAdminMaster\)/);
  assert.match(management,/if \(isAdminMaster\) return originalPageUpload/);
});

test('effective content uses user override then cloud fallback', () => {
  assert.match(management,/caseOverrides/);
  assert.match(management,/hiddenCases/);
  assert.match(management,/hiddenDocuments/);
  assert.match(management,/const effective=cloud\.concat\(cases\)/);
});

test('new runtime assets are available offline', () => {
  for (const asset of ['ava-storage.js','ciapp-management.js','ava-management.css']) assert.ok(sw.includes(asset));
  assert.match(sw,/v9\.14\.0/);
});

test('AVA shell provides explicit ecosystem navigation', () => {
  assert.match(html, /class="app-header"/);
  assert.match(html, /href="https:\/\/ivancww\.github\.io\/avaplatform\/"/);
  assert.match(html, /← 返回 AVA/);
});

test('Mother Standard header contains only frontend controls', () => {
  const header = html.slice(html.indexOf('<header class="app-header">'), html.indexOf('</header>') + 9);
  assert.doesNotMatch(header, /app-brand-logo|危疾生活儲備規劃|header-admin-btn|sync-status-badge/);
  assert.match(header, /CI Protection Planner/);
  assert.match(header, /v9\.14\.0/);
  assert.match(header, /id="btnRoleSwitch"/);
  assert.match(header, /← 返回 AVA/);
  assert.doesNotMatch(html, /安全離線備援|id="sync-status-badge"/);
});

test('Mother Standard shell tokens drive header and content dimensions', () => {
  for (const token of ['--ava-shell-max: 1200px','--ava-header-height: 64px','--ava-shell-gutter: clamp(16px, 2.5vw, 32px)','--ava-card-radius: 16px']) {
    assert.ok(html.includes(token));
  }
  assert.match(html, /width: min\(100%, var\(--ava-shell-max\)\)/);
  assert.match(html, /max-width: var\(--ava-shell-max\)/);
});

test('manifest remains GitHub Pages scoped and standalone capable', () => {
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#1e3a8a');
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js', \{ scope: '\.\/' \}\)/);
});

test('responsive management components use fluid grids and touch targets', () => {
  const css=fs.readFileSync(path.join(root,'ava-management.css'),'utf8');
  assert.match(css,/repeat\(auto-fit,minmax/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/@media \(max-width:699px\)/);
});
