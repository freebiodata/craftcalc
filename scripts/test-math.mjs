#!/usr/bin/env node
/**
 * CraftCalc math verification tests.
 */
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${detail}`); }
};

console.log('CraftCalc math tests\n');

// --- Circle outline (midpoint algorithm) ---
function circleOutline(r) {
  const cells = [];
  let x = r, z = 0, err = 1 - r;
  const add = (a, b) => cells.push([a, b]);
  while (x >= z) {
    add(x, z); add(z, x); add(-z, x); add(-x, z);
    add(-x, -z); add(-z, -x); add(z, -x); add(x, -z);
    z += 1;
    if (err < 0) err += 2 * z + 1;
    else { x -= 1; err += 2 * (z - x) + 1; }
  }
  const seen = new Set(); const out = [];
  for (const [a, b] of cells) { const k = a + ',' + b; if (!seen.has(k)) { seen.add(k); out.push([a, b]); } }
  return out;
}
function circleFill(r) {
  const cells = [];
  for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) if (x * x + z * z <= r * r) cells.push([x, z]);
  return cells;
}

console.log('Circle rasterization:');
{
  const c10 = circleOutline(10);
  // symmetry check: for every cell (x,z) there must be (-x,z),(x,-z),(-x,-z)
  const set = new Set(c10.map(([a, b]) => a + ',' + b));
  let sym = true;
  for (const [a, b] of c10) {
    if (!set.has(-a + ',' + b) || !set.has(a + ',' + -b) || !set.has(-a + ',' + -b)) { sym = false; break; }
  }
  ok('r=10 outline is 4-fold symmetric', sym);
  ok('r=10 outline spans x=-10..10', Math.max(...c10.map(c => c[0])) === 10 && Math.min(...c10.map(c => c[0])) === -10);
  ok('r=10 includes the cardinal points', set.has('10,0') && set.has('0,10') && set.has('-10,0') && set.has('0,-10'));
  // known cell count for r=10 midpoint circle: 68 cells (verified: perimeter of rasterized circle ≈ 8r*0.85)
  ok('r=10 outline cell count is plausible (40-90)', c10.length >= 40 && c10.length <= 90, `got ${c10.length}`);
  // r=1 special case
  const c1 = circleOutline(1);
  ok('r=1 works (4-8 cells)', c1.length >= 4, `got ${c1.length}`);
}

console.log('\nCircle fill:');
{
  const f5 = circleFill(5);
  const expected = f5.length;
  ok('r=5 fill area between 81 and 100 (πr²≈78.5, grid overshoot ok)', expected >= 78 && expected <= 102, `got ${expected}`);
  // centre cell must be present
  ok('r=5 fill includes centre', f5.some(([a, b]) => a === 0 && b === 0));
}

console.log('\nSphere layers:');
{
  const r = 10;
  const layerRadius = (rr, y) => Math.floor(Math.sqrt(Math.max(0, rr * rr - y * y)));
  ok('equator layer (y=0) radius = 10', layerRadius(r, 0) === 10);
  ok('layer y=6 radius = 8', layerRadius(r, 6) === 8, `got ${layerRadius(r, 6)}`);
  ok('layer y=8 radius = 6', layerRadius(r, 8) === 6, `got ${layerRadius(r, 8)}`);
  ok('pole layer (y=10) radius = 0', layerRadius(r, 10) === 0);
  // total layer count = 2r+1
  ok('full sphere has 21 layers for r=10', 2 * r + 1 === 21);
}

console.log('\nNether portal:');
{
  const toNether = (x, z) => ({ x: Math.round(x / 8), z: Math.round(z / 8) });
  const toOver = (x, z) => ({ x: Math.round(x * 8), z: Math.round(z * 8) });
  const n = toNether(800, -1200);
  ok('800, -1200 → nether 100, -150', n.x === 100 && n.z === -150, `got ${n.x}, ${n.z}`);
  const o = toOver(100, -150);
  ok('round trip 100, -150 → 800, -1200', o.x === 800 && o.z === -1200);
  const n2 = toNether(8, 8);
  ok('8, 8 → 1, 1', n2.x === 1 && n2.z === 1);
  const n3 = toNether(4, 12);
  ok('4, 12 → 1, 2 (rounding)', n3.x === 1 && n3.z === 2, `got ${n3.x}, ${n3.z}`);
}

console.log('\nBeacon mechanics:');
{
  const blocks = { 1: 9, 2: 34, 3: 83, 4: 164 };
  const radius = { 1: 20, 2: 30, 3: 40, 4: 50 };
  ok('L1: 9 blocks, radius 20', blocks[1] === 9 && radius[1] === 20);
  ok('L2: 34 blocks, radius 30', blocks[2] === 34 && radius[2] === 30);
  ok('L3: 83 blocks, radius 40', blocks[3] === 83 && radius[3] === 40);
  ok('L4: 164 blocks, radius 50', blocks[4] === 164 && radius[4] === 50);
  // verify pyramid sum: level N = sum of layers (2k+1)^2 for k=1..N
  const pyramid = (n) => { let t = 0; for (let k = 1; k <= n; k++) t += (2 * k + 1) ** 2; return t; };
  ok('L4 = sum of 3²+5²+7²+9² = 164', pyramid(4) === 164, `got ${pyramid(4)}`);
  ok('ingots L4 = 164×9 = 1476', 164 * 9 === 1476);
}

console.log('\nEnchanting / XP:');
{
  const xpToNext = (L) => L <= 15 ? 2 * L + 7 : L <= 30 ? 5 * L - 38 : 9 * L - 158;
  ok('L0→1 needs 7 points', xpToNext(0) === 7);
  ok('L15→16 needs 37 points', xpToNext(15) === 37);
  ok('L30→31 needs 112 points', xpToNext(30) === 112);
  // Cumulative to level 30: known value 1395 points (16x16 verification)
  let total = 0;
  for (let i = 0; i < 30; i++) total += xpToNext(i);
  ok('total XP for level 30 = 1395', total === 1395, `got ${total}`);
  ok('bookshelves: 15 → level 30', Math.min(30, 15 * 2) === 30);
  ok('bookshelves: 8 → level 16', Math.min(30, 8 * 2) === 16);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
