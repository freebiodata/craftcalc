/**
 * CraftCalc math: Minecraft-oriented generators and calculators.
 *
 * circleCells: rasterize a circle/oval outline into Minecraft-style block
 * cells using a midpoint (Bresenham) circle algorithm, scaled per axis.
 *
 * The output lists the cells (x, z) of the outline for a circle of given
 * radius. For building, players typically want either the outline or a
 * filled/ring pattern. We provide outline by default; fill comes from a
 * separate helper (cellsInCircle).
 */

export interface Cell {
  x: number;
  z: number;
}

/** Bresenham midpoint circle outline (one octant mirrored). */
export function circleOutline(r: number): Cell[] {
  if (!(r > 0)) return [];
  const cells: Cell[] = [];
  let x = r;
  let z = 0;
  let err = 1 - r;
  const add = (a: number, b: number) => {
    cells.push({ x: a, z: b });
  };
  while (x >= z) {
    add(x, z); add(z, x); add(-z, x); add(-x, z);
    add(-x, -z); add(-z, -x); add(z, -x); add(x, -z);
    z += 1;
    if (err < 0) {
      err += 2 * z + 1;
    } else {
      x -= 1;
      err += 2 * (z - x) + 1;
    }
  }
  return dedupe(cells);
}

/** Filled circle (all cells with distance <= r from centre). */
export function circleFill(r: number): Cell[] {
  if (!(r > 0)) return [];
  const cells: Cell[] = [];
  const rr = r * r;
  for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) {
      if (x * x + z * z <= rr) cells.push({ x, z });
    }
  }
  return cells;
}

/** Cells exactly on the "thick" outline: distance between r-t and r. */
export function circleRing(r: number, thickness: number): Cell[] {
  if (!(r > 0) || !(thickness > 0)) return [];
  const cells: Cell[] = [];
  const outer = r * r;
  const inner = Math.max(0, r - thickness) ** 2;
  for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) {
      const d = x * x + z * z;
      if (d <= outer && d >= inner) cells.push({ x, z });
    }
  }
  return dedupe(cells);
}

/** Ellipse outline via parametric sampling (for oval builds). */
export function ellipseOutline(rx: number, rz: number): Cell[] {
  if (!(rx > 0) || !(rz > 0)) return [];
  const cells: Cell[] = [];
  const steps = Math.ceil(2 * Math.PI * Math.max(rx, rz) * 2);
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    cells.push({ x: Math.round(rx * Math.cos(t)), z: Math.round(rz * Math.sin(t)) });
  }
  return dedupe(cells);
}

function dedupe(cells: Cell[]): Cell[] {
  const seen = new Set<string>();
  const out: Cell[] = [];
  for (const c of cells) {
    const k = `${c.x},${c.z}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  // sort for deterministic rendering (row by row)
  out.sort((a, b) => (a.z - b.z) || (a.x - b.x));
  return out;
}

/**
 * Circle rendering as an ASCII grid for preview (radius r),
 * using '#' for outline, '.' for empty.
 */
export function renderGrid(r: number, filled = false, thickness = 0): string[][] {
  const size = 2 * r + 1;
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill('.'));
  const cells = filled ? circleFill(r) : thickness > 0 ? circleRing(r, thickness) : circleOutline(r);
  for (const c of cells) {
    const gx = c.x + r;
    const gz = c.z + r;
    if (gx >= 0 && gx < size && gz >= 0 && gz < size) grid[gz][gx] = '#';
  }
  return grid;
}

/* ============ Nether portal coordinate math ============ */

export const NETHER_RATIO = 8;

/** Overworld X/Z -> Nether X/Z */
export function toNether(x: number, z: number): { x: number; z: number } {
  return { x: Math.round(x / NETHER_RATIO), z: Math.round(z / NETHER_RATIO) };
}

/** Nether X/Z -> Overworld X/Z */
export function toOverworld(x: number, z: number): { x: number; z: number } {
  return { x: x * NETHER_RATIO, z: z * NETHER_RATIO };
}

/* ============ Beacon range ============ */

export const BEACON_LEVELS = [1, 2, 3, 4] as const;

/** Beacon effect radius (blocks) by pyramid level (levels 1..4). */
export function beaconRange(level: number): number {
  const r = [0, 20, 30, 40, 50][level] ?? 0;
  return r;
}

/** Full pyramid block requirement for a level-N beacon. */
export function beaconBlocks(level: number): number {
  switch (level) {
    case 1: return 9;
    case 2: return 34;
    case 3: return 83;
    case 4: return 164;
    default: return 0;
  }
}

/** Iron/gold/diamond/emerald ingot count to fill a level-N pyramid (9 per block). */
export function beaconMats(level: number): number {
  return beaconBlocks(level) * 9;
}

/* ============ Enchanting helper ============ */

/**
 * Bookshelf progress: each bookshelf row around the enchanting table
 * contributes toward max level 30. Standard: 15 bookshelves = level 30.
 * Returns the max enchant level available for N bookshelves (0-15 => 0-30).
 */
export function enchantLevelForBookshelves(bookshelves: number): number {
  if (bookshelves < 0) return 0;
  // each shelf gives 2 levels, capped at 30
  return Math.min(30, Math.floor(bookshelves) * 2);
}

/**
 * XP points needed for a level (standard pre-1.8 style scale used widely,
 * matches the classic Minecraft formula):
 *  - levels 0-15: 2L + 7 per level
 *  - levels 16-30: 5L - 38 per level
 *  - levels 31+: 9L - 158 per level
 * xpToNext(level) returns points needed to go from `level` to `level+1`.
 */
export function xpToNext(level: number): number {
  if (level < 0) return 0;
  if (level <= 15) return 2 * level + 7;
  if (level <= 30) return 5 * level - 38;
  return 9 * level - 158;
}

/** Cumulative XP from level 0 to `level`. */
export function xpTotal(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpToNext(i);
  return total;
}

/** Mob XP values (common, kills; standard values). */
export const MOB_XP: Record<string, number> = {
  'Zombie / Skeleton / Creeper': 5,
  'Spider': 5,
  'Enderman': 5,
  'Blaze': 10,
  'Piglin': 5,
  'Hoglin': 5,
  'Zombified Piglin': 5,
  'Witch': 5,
  'Slime (small)': 1,
  'Slime (medium)': 2,
  'Slime (big)': 4,
  'Ender Dragon': 12000,
  'Wither': 50,
};
