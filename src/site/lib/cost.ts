/** Rates from the E-commetrics services sheet (San Diego market, 2026). USD per engineer per month. */
export const RATES = {
  agencyMin: 24_000,
  agencyMax: 40_000,
  inhouseMin: 12_000,
  inhouseMax: 18_000,
  ours: 5_200,
} as const;

export interface Range {
  min: number;
  max: number;
}
export interface Comparison {
  engineers: number;
  months: number;
  agency: Range;
  inhouse: Range;
  ours: Range;
  savingsVsInhouse: Range;
}

const clamp = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : lo;

/** Total cost over the period for each option. Engineers clamp to 1–5, months to 3–12 (3-month minimum). */
export function compare(engineers: number, months: number): Comparison {
  const e = clamp(engineers, 1, 5);
  const m = clamp(months, 3, 12);
  const k = e * m;
  return {
    engineers: e,
    months: m,
    agency: { min: RATES.agencyMin * k, max: RATES.agencyMax * k },
    inhouse: { min: RATES.inhouseMin * k, max: RATES.inhouseMax * k },
    ours: { min: RATES.ours * k, max: RATES.ours * k },
    savingsVsInhouse: { min: (RATES.inhouseMin - RATES.ours) * k, max: (RATES.inhouseMax - RATES.ours) * k },
  };
}

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Compact form for tight spaces: $15.6k, $2.4M */
export const usdShort = (n: number) =>
  n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${+(n / 1_000).toFixed(1)}k` : `$${n}`;
