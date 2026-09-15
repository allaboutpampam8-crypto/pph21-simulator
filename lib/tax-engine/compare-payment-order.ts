import {
  calculateGrossUpPayments,
  type GrossUpPaymentCalculationInput,
  type GrossUpPaymentResult,
} from "./gross-up-payment";

export interface PaymentOrderComparison {
  orderA: GrossUpPaymentResult[];
  orderB: GrossUpPaymentResult[];

  finalTaxA: number;
  finalTaxB: number;

  totalActualGrossA: number;
  totalActualGrossB: number;

  sameFinalTax: boolean;
  sameActualGross: boolean;
}

export interface ComparePaymentOrderInput {
  taxYear: number;
  category: GrossUpPaymentCalculationInput["category"];

  orderA: GrossUpPaymentCalculationInput["payments"];
  orderB: GrossUpPaymentCalculationInput["payments"];
}

/**
 * Membandingkan dua urutan pembayaran.
 *
 * Fungsi ini digunakan untuk fitur edukasi
 * "What If? Urutan Pembayaran".
 *
 * Catatan:
 * hasil per-payment merupakan simulasi
 * alokasi payroll Gross-Up / Re-Gross-Up.
 *
 * Fungsi ini tidak menggantikan perhitungan
 * PPh 21 resmi masa pajak.
 */
export function comparePaymentOrder(
  input: ComparePaymentOrderInput,
): PaymentOrderComparison {
  const resultA =
    calculateGrossUpPayments({
      taxYear: input.taxYear,
      category: input.category,
      payments: input.orderA,
    });

  const resultB =
    calculateGrossUpPayments({
      taxYear: input.taxYear,
      category: input.category,
      payments: input.orderB,
    });

  const finalA =
    resultA[resultA.length - 1];

  const finalB =
    resultB[resultB.length - 1];

  const finalTaxA =
    finalA?.cumulativeTax ?? 0;

  const finalTaxB =
    finalB?.cumulativeTax ?? 0;

  const totalActualGrossA =
    finalA?.cumulativeActualGross ?? 0;

  const totalActualGrossB =
    finalB?.cumulativeActualGross ?? 0;

  return {
    orderA: resultA,
    orderB: resultB,

    finalTaxA,
    finalTaxB,

    totalActualGrossA,
    totalActualGrossB,

    sameFinalTax:
      finalTaxA === finalTaxB,

    sameActualGross:
      totalActualGrossA ===
      totalActualGrossB,
  };
}