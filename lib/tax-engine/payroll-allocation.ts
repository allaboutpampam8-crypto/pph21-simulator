import {
  calculateGrossUpPayments,
  type GrossUpPaymentCalculationInput,
  type GrossUpPaymentResult,
} from "./gross-up-payment";

export interface PayrollAllocationResult {
  payments: GrossUpPaymentResult[];

  /**
   * PPh 21 resmi masa pajak.
   *
   * Nilai ini sengaja diberikan dari luar,
   * karena perhitungan statutory tetap
   * menjadi tanggung jawab official tax engine.
   */
  officialTax: number;

  /**
   * Total adjustment gross-up pada kondisi
   * akhir simulasi payroll.
   */
  grossUpAdjustment: number;

  /**
   * Bruto aktual kumulatif.
   */
  actualGross: number;

  /**
   * Bruto setelah adjustment internal payroll.
   */
  brutoOri: number;
}

export interface PayrollAllocationInput
  extends GrossUpPaymentCalculationInput {
  /**
   * PPh 21 resmi yang dihitung oleh
   * official tax engine.
   */
  officialTax: number;
}

/**
 * Adapter antara official tax engine dan
 * payroll Gross-Up engine.
 *
 * Penting:
 * fungsi ini TIDAK menghitung ulang officialTax.
 * officialTax diberikan oleh official tax engine.
 */
export function calculatePayrollAllocation(
  input: PayrollAllocationInput,
): PayrollAllocationResult {
  validateInput(input);

  const payments =
    calculateGrossUpPayments({
      taxYear: input.taxYear,
      category: input.category,
      payments: input.payments,
    });

  const finalPayment =
    payments[payments.length - 1];

  return {
    payments,

    officialTax:
      input.officialTax,

    grossUpAdjustment:
      finalPayment?.grossUpAdjustment ?? 0,

    actualGross:
      finalPayment?.cumulativeActualGross ?? 0,

    brutoOri:
      finalPayment?.brutoOri ?? 0,
  };
}

function validateInput(
  input: PayrollAllocationInput,
): void {
  if (
    !Number.isFinite(
      input.officialTax,
    ) ||
    input.officialTax < 0
  ) {
    throw new Error(
      "Official tax harus berupa angka valid dan tidak boleh negatif.",
    );
  }
}