export type LockMode = "W" | "H" | "Auto";

export type Ratio = {
  display: string;
  decimal: number;
  a?: number;
  b?: number;
};

export type Suggestion = {
  ratio: Ratio;
  errorPct: number;
  snap: { w: number; h: number };
};

export const NAMED_RATIOS: Ratio[] = [
  { display: "1:1", a: 1, b: 1, decimal: 1 },
  { display: "5:4", a: 5, b: 4, decimal: 5 / 4 },
  { display: "4:3", a: 4, b: 3, decimal: 4 / 3 },
  { display: "√2", decimal: Math.SQRT2 },
  { display: "3:2", a: 3, b: 2, decimal: 3 / 2 },
  { display: "16:10", a: 16, b: 10, decimal: 16 / 10 },
  { display: "φ", decimal: 1.618033988749895 },
  { display: "5:3", a: 5, b: 3, decimal: 5 / 3 },
  { display: "16:9", a: 16, b: 9, decimal: 16 / 9 },
  { display: "2:1", a: 2, b: 1, decimal: 2 },
  { display: "21:9", a: 21, b: 9, decimal: 21 / 9 },
  { display: "4:5", a: 4, b: 5, decimal: 4 / 5 },
  { display: "3:4", a: 3, b: 4, decimal: 3 / 4 },
  { display: "2:3", a: 2, b: 3, decimal: 2 / 3 },
  { display: "9:16", a: 9, b: 16, decimal: 9 / 16 },
];

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function reduceRatio(w: number, h: number): { a: number; b: number; decimal: number } {
  const d = gcd(w, h);
  return { a: Math.floor(w / d), b: Math.floor(h / d), decimal: w / h };
}

function buildCleanPool(maxN: number): Ratio[] {
  const pool: Ratio[] = [];
  for (let a = 1; a <= maxN; a++) {
    for (let b = 1; b <= maxN; b++) {
      if (gcd(a, b) !== 1) continue;
      pool.push({ display: `${a}:${b}`, a, b, decimal: a / b });
    }
  }
  return pool;
}

const CLEAN_POOL_DEFAULT = buildCleanPool(21);

function snapToRatio(
  w: number,
  h: number,
  target: number,
  lock: LockMode
): { w: number; h: number } {
  const effective: "W" | "H" = lock === "Auto" ? (w >= h ? "W" : "H") : lock;
  if (effective === "W") {
    return { w, h: Math.max(1, Math.round(w / target)) };
  }
  return { w: Math.max(1, Math.round(h * target)), h };
}

function buildSuggestion(
  w: number,
  h: number,
  ratio: Ratio,
  lock: LockMode
): Suggestion {
  const errorPct = ((w / h - ratio.decimal) / ratio.decimal) * 100;
  return {
    ratio,
    errorPct,
    snap: snapToRatio(w, h, ratio.decimal, lock),
  };
}

export function findNearestNamed(
  w: number,
  h: number,
  lock: LockMode,
  threshold = 10,
  limit = 3
): Suggestion[] {
  return NAMED_RATIOS.map((r) => buildSuggestion(w, h, r, lock))
    .filter((s) => Math.abs(s.errorPct) <= threshold)
    .sort((a, b) => Math.abs(a.errorPct) - Math.abs(b.errorPct))
    .slice(0, limit);
}

export function findNearestClean(
  w: number,
  h: number,
  lock: LockMode,
  excludeDecimals: number[] = [],
  threshold = 10,
  limit = 3,
  maxN = 21
): Suggestion[] {
  const pool = maxN === 21 ? CLEAN_POOL_DEFAULT : buildCleanPool(maxN);
  const eps = 1e-9;
  return pool
    .filter((r) => !excludeDecimals.some((d) => Math.abs(d - r.decimal) < eps))
    .map((r) => buildSuggestion(w, h, r, lock))
    .filter((s) => Math.abs(s.errorPct) <= threshold)
    .sort((a, b) => Math.abs(a.errorPct) - Math.abs(b.errorPct))
    .slice(0, limit);
}
