export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Memformat tarif desimal (misal 0.0175, 0.02, 0.11) menjadi format persentase
 * dengan maksimal 2 angka di belakang koma (misal: "1.75%", "2%", "11%", "0.25%").
 * Mencegah floating point issue di JavaScript seperti 1.7500000000000002%.
 */
export function formatPercent(rate: number): string {
  if (typeof rate !== "number" || isNaN(rate)) return "0%";
  const percent = Math.round((rate * 100 + Number.EPSILON) * 100) / 100;
  return `${percent}%`;
}
