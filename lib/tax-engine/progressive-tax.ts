export interface ProgressiveTaxBracket {
  batas: number;
  tarif: number;
}

/**
 * Menghitung PPh berdasarkan tarif Pasal 17 progresif.
 *
 * Bracket harus diberikan secara berurutan
 * dari batas penghasilan terendah ke tertinggi.
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: ReadonlyArray<ProgressiveTaxBracket>,
): number {
  if (!Number.isFinite(taxableIncome)) {
    throw new Error(
      "Penghasilan kena pajak harus berupa angka yang valid.",
    );
  }

  if (taxableIncome <= 0) {
    return 0;
  }

  let remainingIncome = taxableIncome;
  let previousLimit = 0;
  let tax = 0;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) {
      break;
    }

    const bracketIncome = Math.min(
      remainingIncome,
      bracket.batas - previousLimit,
    );

    tax +=
      bracketIncome * bracket.tarif;

    remainingIncome -=
      bracketIncome;

    previousLimit =
      bracket.batas;
  }

  return Math.round(tax);
}