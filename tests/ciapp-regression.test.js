const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const management = fs.readFileSync(path.join(root, 'ciapp-management.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'ava-storage.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

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
  assert.match(sw,/v9\.12\.0/);
});

test('responsive management components use fluid grids and touch targets', () => {
  const css=fs.readFileSync(path.join(root,'ava-management.css'),'utf8');
  assert.match(css,/repeat\(auto-fit,minmax/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/@media \(max-width:699px\)/);
});
