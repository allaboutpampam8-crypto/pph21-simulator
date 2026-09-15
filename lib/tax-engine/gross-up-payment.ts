import { getTaxConfig } from "@/config/tax";
import {
  calculateGrossUpRecalculation,
} from "./gross-up";
import { getTER } from "./ter";

import type {
  GrossUpPayment,
  GrossUpPaymentTreatment,
  TERCategory,
} from "./types";

export interface GrossUpPaymentResult {
  id: string;
  name: string;
  amount: number;
  treatment: GrossUpPaymentTreatment;

  /**
   * Bruto aktual kumulatif sampai payment ini.
   */
  cumulativeActualGross: number;

  /**
   * TER berdasarkan bruto aktual kumulatif.
   */
  terRate: number;

  /**
   * TER setelah memperhitungkan
   * mekanisme re-gross-up.
   */
  finalTerRate: number;

  /**
   * Tax allowance yang benar-benar
   * sudah diberikan pada payment ini.
   */
  actualTaxAllowance: number;

  /**
   * Gross-up base payment ini.
   */
  grossUpBase: number;

  /**
   * Total kebutuhan tax allowance dari
   * seluruh payment GROSS_UP yang sudah
   * ada sampai posisi ini.
   */
  oriTaxAllowance: number;

  /**
   * Total adjustment gross-up dari
   * seluruh payment GROSS_UP yang sudah
   * ada sampai posisi ini.
   */
  grossUpAdjustment: number;

  /**
   * Bruto setelah seluruh adjustment
   * gross-up yang relevan.
   */
  brutoOri: number;

  /**
   * PPh kumulatif setelah adjustment.
   */
  cumulativeTax: number;

  /**
   * Dampak PPh pada payment ini.
   *
   * Ini merupakan alokasi payroll/simulasi,
   * bukan rumus statutory PPh 21 per payment.
   */
  paymentTaxImpact: number;
}

export interface GrossUpPaymentCalculationInput {
  taxYear: number;
  category: TERCategory;
  payments: GrossUpPayment[];
}

/**
 * Menghitung payment secara berurutan sekaligus
 * mengevaluasi ulang seluruh payment GROSS_UP
 * ketika kondisi bruto kumulatif berubah.
 *
 * Contoh:
 *
 * Gaji GROSS_UP
 *      ↓
 * Bonus GROSS
 *
 * Ketika bonus masuk, allowance GROSS_UP
 * pada Gaji akan dihitung ulang.
 */
export function calculateGrossUpPayments(
  input: GrossUpPaymentCalculationInput,
): GrossUpPaymentResult[] {
  validateInput(input);

  const config = getTaxConfig(
    input.taxYear,
  );

  const results: GrossUpPaymentResult[] = [];

  let cumulativeActualGross = 0;
  let cumulativeTax = 0;

  for (const payment of input.payments) {
    cumulativeActualGross += payment.amount;

    /**
     * TER berdasarkan actual gross sebelum
     * re-gross-up.
     */
    const actualTer = getTER(
      input.category,
      cumulativeActualGross,
      {
        TER_A: config.TER_A,
        TER_B: config.TER_B,
        TER_C: config.TER_C,
      },
    );

    /**
     * Ambil seluruh payment GROSS_UP
     * yang sudah muncul sampai posisi ini.
     *
     * Payment GROSS berikutnya dapat menyebabkan
     * payment GROSS_UP sebelumnya perlu dihitung
     * ulang.
     */
    const grossUpPayments =
      input.payments.filter(
        (candidate, index) =>
          index <=
            input.payments.indexOf(
              payment,
            ) &&
          candidate.treatment ===
            "GROSS_UP",
      );

    let totalOriTaxAllowance = 0;
    let totalGrossUpAdjustment = 0;

    /**
     * Recalculate seluruh GROSS_UP
     * berdasarkan kondisi kumulatif terbaru.
     */
    for (const grossUpPayment of grossUpPayments) {
      const recalculation =
        calculateGrossUpRecalculation({
          taxYear: input.taxYear,
          category: input.category,

          actualGross:
            cumulativeActualGross,

          grossUpBase:
            grossUpPayment.grossUpBase!,

          actualTaxAllowance:
            grossUpPayment.actualTaxAllowance!,
        });

      totalOriTaxAllowance +=
        recalculation.oriTaxAllowance;

      totalGrossUpAdjustment +=
        recalculation.grossUpAdjustment;
    }

    /**
     * Bruto aktual + seluruh adjustment
     * gross-up yang diperlukan.
     */
    const brutoOri =
      cumulativeActualGross +
      totalGrossUpAdjustment;

    /**
     * Cari TER final berdasarkan bruto
     * setelah adjustment.
     */
    const finalTer = getTER(
      input.category,
      brutoOri,
      {
        TER_A: config.TER_A,
        TER_B: config.TER_B,
        TER_C: config.TER_C,
      },
    );

    /**
     * PPh kumulatif internal payroll.
     */
    const currentTax =
      Math.round(
        brutoOri *
          finalTer.rate,
      );

    /**
     * Selisih terhadap kondisi payment
     * sebelumnya.
     */
    const paymentTaxImpact =
      currentTax -
      cumulativeTax;

    cumulativeTax =
      currentTax;

    /**
     * Data allowance yang berasal dari
     * payment GROSS_UP yang sedang diproses.
     *
     * Untuk payment GROSS nilainya 0 karena
     * payment tersebut sendiri tidak memberikan
     * tax allowance.
     */
    const actualTaxAllowance =
      payment.actualTaxAllowance ??
      0;

    const grossUpBase =
      payment.grossUpBase ??
      0;

    results.push({
      id: payment.id,
      name: payment.name,
      amount: payment.amount,
      treatment: payment.treatment,

      cumulativeActualGross,

      terRate:
        actualTer.rate,

      finalTerRate:
        finalTer.rate,

      actualTaxAllowance,

      grossUpBase,

      oriTaxAllowance:
        totalOriTaxAllowance,

      grossUpAdjustment:
        totalGrossUpAdjustment,

      brutoOri,

      cumulativeTax:
        currentTax,

      paymentTaxImpact,
    });
  }

  return results;
}

function validateInput(
  input: GrossUpPaymentCalculationInput,
): void {
  if (
    !Number.isInteger(
      input.taxYear,
    ) ||
    input.taxYear < 2000
  ) {
    throw new Error(
      "Tahun pajak tidak valid.",
    );
  }

  if (
    !Array.isArray(
      input.payments,
    )
  ) {
    throw new Error(
      "Daftar payment harus berupa array.",
    );
  }

  const paymentIds =
    new Set<string>();

  for (const payment of input.payments) {
    if (
      !payment.id ||
      !payment.id.trim()
    ) {
      throw new Error(
        "Payment harus memiliki id.",
      );
    }

    if (
      paymentIds.has(
        payment.id,
      )
    ) {
      throw new Error(
        `Payment id "${payment.id}" tidak boleh duplikat.`,
      );
    }

    paymentIds.add(
      payment.id,
    );

    if (
      !payment.name ||
      !payment.name.trim()
    ) {
      throw new Error(
        "Payment harus memiliki nama.",
      );
    }

    if (
      !Number.isFinite(
        payment.amount,
      ) ||
      payment.amount < 0
    ) {
      throw new Error(
        `Nominal payment "${payment.name}" tidak valid.`,
      );
    }

    if (
      payment.treatment ===
      "GROSS_UP"
    ) {
      if (
        payment.grossUpBase ===
          undefined ||
        !Number.isFinite(
          payment.grossUpBase,
        ) ||
        payment.grossUpBase < 0
      ) {
        throw new Error(
          `Gross-up base "${payment.name}" wajib diisi dan harus valid.`,
        );
      }

      if (
        payment.actualTaxAllowance ===
          undefined ||
        !Number.isFinite(
          payment.actualTaxAllowance,
        ) ||
        payment.actualTaxAllowance < 0
      ) {
        throw new Error(
          `Actual tax allowance "${payment.name}" wajib diisi dan harus valid.`,
        );
      }

      if (
        payment.actualTaxAllowance >
        payment.amount
      ) {
        throw new Error(
          `Actual tax allowance "${payment.name}" tidak boleh melebihi amount.`,
        );
      }
    }

    if (
      payment.treatment ===
      "GROSS"
    ) {
      if (
        payment.grossUpBase !==
          undefined ||
        payment.actualTaxAllowance !==
          undefined
      ) {
        throw new Error(
          `Payment GROSS "${payment.name}" tidak boleh memiliki gross-up base atau actual tax allowance.`,
        );
      }
    }
  }
}