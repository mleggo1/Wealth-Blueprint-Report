/** Compact AUD for chart axes (e.g. $3M, $450k) — education UI only */
export function formatCompactAud(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v >= 1_000_000_000) {
    const x = v / 1_000_000_000;
    return `${sign}$${x >= 10 || x % 1 < 0.05 ? x.toFixed(0) : x.toFixed(1)}B`;
  }
  if (v >= 1_000_000) {
    const x = v / 1_000_000;
    return `${sign}$${x >= 10 || x % 1 < 0.05 ? x.toFixed(0) : x.toFixed(1)}M`;
  }
  if (v >= 1_000) {
    const x = v / 1_000;
    return `${sign}$${x >= 100 || x % 1 < 0.05 ? x.toFixed(0) : x.toFixed(1)}k`;
  }
  return `${sign}$${Math.round(v)}`;
}
