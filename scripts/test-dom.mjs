#!/usr/bin/env node
/**
 * CraftCalc DOM smoke tests: loads built pages in jsdom, bundles+executes
 * page scripts via esbuild, verifies each tool computes and renders results.
 */
import { JSDOM } from 'jsdom';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const CACHE = '.dom-test-cache';
if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${detail}`); }
};

function bundleScript(srcPath, outName) {
  const out = join(CACHE, outName);
  execSync(
    `npx esbuild "${srcPath}" --bundle --format=iife --outfile="${out}" --log-level=error`,
    { stdio: 'pipe' },
  );
  return readFileSync(out, 'utf-8');
}

async function loadPage(path) {
  const html = readFileSync(path, 'utf-8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://craftcalc.top/',
  });
  const { window } = dom;
  const scripts = [...window.document.querySelectorAll('script[src]')];
  let i = 0;
  for (const s of scripts) {
    const src = s.getAttribute('src').replace(/^\//, 'dist/');
    try {
      window.eval(bundleScript(src, `b-${path.replace(/[^a-z0-9]/gi, '_')}-${i++}.js`));
    } catch (e) { console.log(`    (skip ${src}: ${e.message.slice(0, 80)})`); }
  }
  for (const s of window.document.querySelectorAll('script:not([src]):not([type="application/ld+json"])')) {
    try { window.eval(s.textContent); } catch (e) { console.log(`    (inline skip: ${e.message.slice(0, 80)})`); }
  }
  return dom;
}

console.log('CraftCalc DOM smoke tests\n');

// ---------------------------------------------------------------- circle generator
{
  const dom = await loadPage('dist/circle-generator/index.html');
  const doc = dom.window.document;
  const val = (id) => doc.getElementById(id)?.textContent ?? '';
  console.log('circle-generator:');
  // default r=10 outline -> block count and grid present
  const blocks = val('block-count');
  ok('block count rendered', /\d+ blocks/.test(blocks), `got "${blocks}"`);
  const preview = doc.getElementById('preview').textContent;
  ok('preview grid has # cells', preview.includes('#'), `grid: ${preview.slice(0, 60)}`);
  ok('preview grid has centre marker +', preview.includes('+'));
  // symmetry check on grid output: line lengths equal
  const lines = preview.trim().split('\n');
  const allSame = lines.every((l) => l.length === lines[0].length);
  ok('grid lines equal width', allSame, `widths: ${[...new Set(lines.map(l => l.length))]}`);
  // change radius
  const r = doc.getElementById('radius');
  r.value = '5';
  r.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const blocks5 = val('block-count');
  ok('r=5 recomputes', /\d+ blocks/.test(blocks5) && blocks5 !== blocks, `got "${blocks5}"`);
  // filled style increases count
  const style = doc.getElementById('style');
  style.value = 'filled';
  style.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const filled = parseInt(val('block-count'));
  ok('filled style gives more blocks than outline', filled > parseInt(blocks5), `outline ${blocks5} vs filled ${val('block-count')}`);
}

// ---------------------------------------------------------------- sphere generator
{
  const dom = await loadPage('dist/sphere-generator/index.html');
  const doc = dom.window.document;
  const val = (id) => doc.getElementById(id)?.textContent ?? '';
  console.log('\nsphere-generator:');
  ok('layer count = 21 for r=10', val('out-layers') === '21', `got "${val('out-layers')}"`);
  const plan = doc.getElementById('plan').textContent;
  ok('plan lists equator layer', plan.includes('equator'), `plan head: ${plan.slice(0, 80)}`);
  ok('plan lists radius 10 equator', /radius 10/.test(plan));
  // dome mode halves layers
  const shape = doc.getElementById('shape');
  shape.value = 'dome';
  shape.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  ok('dome = 11 layers for r=10', val('out-layers') === '11', `got "${val('out-layers')}"`);
}

// ---------------------------------------------------------------- nether portal
{
  const dom = await loadPage('dist/nether-portal-calculator/index.html');
  const doc = dom.window.document;
  const val = (id) => doc.getElementById(id)?.textContent ?? '';
  console.log('\nnether-portal-calculator:');
  // default 800, -1200 -> 100, -150
  ok('800,-1200 -> 100, -150', val('result-value') === '100, -150', `got "${val('result-value')}"`);
  // reverse
  const swap = doc.getElementById('swap-btn');
  swap.click();
  ok('swap reverses to overworld', val('result-caption').includes('Overworld'), `caption "${val('result-caption')}"`);
  ok('reversed value = 800, -1200', val('result-value') === '800, -1200', `got "${val('result-value')}"`);
}

// ---------------------------------------------------------------- beacon
{
  const dom = await loadPage('dist/beacon-calculator/index.html');
  const doc = dom.window.document;
  const val = (id) => doc.getElementById(id)?.textContent ?? '';
  console.log('\nbeacon-calculator:');
  // default level 1 -> 9 blocks
  ok('L1 headline = 9 blocks', val('result-value').startsWith('9 blocks'), `got "${val('result-value')}"`);
  ok('L1 radius = 20 blocks', val('out-radius') === '20 blocks', `got "${val('out-radius')}"`);
  // click level 4 chip
  const chip4 = doc.querySelector('[data-level="4"]');
  chip4.click();
  ok('L4 headline = 164 blocks', val('result-value').startsWith('164 blocks'), `got "${val('result-value')}"`);
  ok('L4 ingots = 1,476', val('out-ingots').includes('1,476'), `got "${val('out-ingots')}"`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
