import { getTaxConfig } from "@/config/tax";

import { calculateFinalTax } from "./final";
import { calculateMonthlyTax } from "./monthly";
import { calculatePartYearTax } from "./part-year";
import { calculatePaymentImpact } from "./payment-impact";

import type {
  PaymentImpactResult,
  TaxCalculationInput,
  TaxSimulationResult,
} from "./types";


export interface TaxSimulationOptions {
  /**
   * Jika true, engine menghitung simulasi
   * dampak berdasarkan urutan pembayaran.
   */
  includePaymentImpact?: boolean;

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
  const monthly =
    calculateMonthlyTax(input);


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


  return {
    grossIncome,
    monthly,
    paymentImpact,
  };
}