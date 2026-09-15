import { getTaxConfig } from "@/config/tax";

import { calculateFinalTax } from "./final";
import { calculateMonthlyTax } from "./monthly";
import { calculatePartYearTax } from "./part-year";
import { calculatePaymentImpact } from "./payment-impact";
import {
  calculatePayrollAllocation,
} from "./payroll-allocation";

import type {
  PaymentImpactResult,
  TaxCalculationInput,
  TaxSimulationResult,
  GrossUpPayment,
} from "./types";


export interface TaxSimulationOptions {
  /**
   * Jika true, engine menghitung simulasi
   * dampak berdasarkan urutan pembayaran.
   */
  includePaymentImpact?: boolean;

  /**
   * Jika true, engine menghitung mekanisme
   * payroll Gross-Up / Re-Gross-Up.
   *
   * Ini merupakan simulasi mekanisme payroll,
   * bukan pengganti perhitungan PPh 21 resmi.
   */
  includePayrollAllocation?: boolean;

  /**
   * Daftar payment payroll yang akan dianalisis
   * oleh Gross-Up / Re-Gross-Up engine.
   */
  payrollPayments?: GrossUpPayment[];

  /**
   * Total PPh 21 yang sudah dipotong pada
   * masa pajak sebelumnya.
   */
  previousTaxWithheld?: number;
}


export function simulateTax(
  input: TaxCalculationInput,
  options: TaxSimulationOptions = {},
): TaxSimulationResult {
  const {
    includePaymentImpact = false,
    includePayrollAllocation = false,
    payrollPayments = [],
    previousTaxWithheld = 0,
  } = options;

  const grossIncome =
    input.incomeItems.reduce(
      (total, item) =>
        total + item.amount,
      0,
    );


  /**
   * =====================================================
   * MASA PAJAK FINAL
   * =====================================================
   *
   * Untuk tahap ini payroll allocation belum
   * diaktifkan pada masa final.
   *
   * Perhitungan final tetap menggunakan
   * Final Tax Engine / Part-Year Tax Engine
   * seperti sebelumnya.
   */
  if (input.profile.isFinalMonth) {
    const monthsWorked =
      input.profile.monthsWorked ?? 12;

    const taxSubjectStartedMidYear =
      input.profile
        .taxSubjectStartedMidYear ??
      false;

    /**
     * Pada masa final, perhitungan menggunakan
     * total bruto kumulatif yang diberikan melalui
     * finalGrossIncome.
     *
     * Jika tidak diberikan, gunakan grossIncome
     * untuk menjaga kompatibilitas dengan kontrak
     * lama.
     */
    const finalGrossIncome =
      input.finalGrossIncome ??
      grossIncome;


    /**
     * Jika bekerja kurang dari 12 bulan,
     * gunakan Part-Year Engine.
     */
    if (monthsWorked < 12) {
      const partYear =
        calculatePartYearTax({
          taxYear:
            input.profile.taxYear,

          status:
            input.profile.status,

          monthsWorked,

          taxSubjectStartedMidYear,

          grossIncome:
            finalGrossIncome,

          pensionContribution:
            input.pensionContribution ??
            0,

          religiousContribution:
            input.religiousContribution ??
            0,

          previousTaxWithheld,
        });

      return {
        grossIncome,
        partYear,
      };
    }


    /**
     * Jika bekerja 12 bulan penuh,
     * gunakan Final Tax Engine biasa.
     */
    const final =
      calculateFinalTax({
        taxYear:
          input.profile.taxYear,

        status:
          input.profile.status,

        monthsWorked: 12,

        annualGrossIncome:
          finalGrossIncome,

        pensionContribution:
          input.pensionContribution ??
          0,

        religiousContribution:
          input.religiousContribution ??
          0,

        previousTaxWithheld,
      });

    return {
      grossIncome,
      final,
    };
  }


  /**
   * =====================================================
   * MASA PAJAK BIASA
   * =====================================================
   */

  /**
   * 1. Hitung PPh 21 RESMI.
   *
   * Ini tetap menggunakan official tax engine.
   */
  const monthly =
    calculateMonthlyTax(input);


  /**
   * 2. Payment Impact
   *
   * Ini adalah simulasi edukasi berdasarkan
   * urutan payment.
   */
  let paymentImpact:
    | PaymentImpactResult[]
    | undefined;


  if (includePaymentImpact) {
    const config =
      getTaxConfig(
        input.profile.taxYear,
      );

    const terCategory =
      config.TER_CATEGORY[
        input.profile.status
      ];

    paymentImpact =
      calculatePaymentImpact({
        taxYear:
          input.profile.taxYear,

        category:
          terCategory,

        payments:
          input.incomeItems,
      });
  }


  /**
   * 3. Payroll Allocation
   *
   * Ini merupakan layer terpisah dari
   * official PPh 21 calculation.
   */
  let payrollAllocation:
    | TaxSimulationResult["payrollAllocation"]
    | undefined;


  if (includePayrollAllocation) {
    if (
      payrollPayments.length === 0
    ) {
      throw new Error(
        "Payroll allocation membutuhkan minimal satu payment.",
      );
    }

    const config =
      getTaxConfig(
        input.profile.taxYear,
      );

    const terCategory =
      config.TER_CATEGORY[
        input.profile.status
      ];

    payrollAllocation =
      calculatePayrollAllocation({
        taxYear:
          input.profile.taxYear,

        category:
          terCategory,

        /**
         * PPh resmi berasal dari
         * Monthly Tax Engine.
         *
         * Jangan menghitung ulang
         * officialTax dari gross-up engine.
         */
        officialTax:
          monthly.tax,

        payments:
          payrollPayments,
      });
  }


  /**
   * =====================================================
   * RESULT
   * =====================================================
   *
   * official PPh tetap berada pada:
   *
   * monthly.tax
   *
   * sedangkan:
   *
   * payrollAllocation.grossUpAdjustment
   *
   * adalah informasi mekanisme payroll.
   */
  return {
    grossIncome,
    monthly,
    paymentImpact,
    payrollAllocation,
  };
}