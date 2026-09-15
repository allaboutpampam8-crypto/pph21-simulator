import { getTaxConfig } from "@/config/tax";
import {
  calculateGrossUpAllowance,
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
   *
   * Untuk GROSS_UP, amount user merupakan base
   * sebelum tunjangan PPh, sehingga bruto aktual
   * memasukkan allowance yang dihitung engine.
   */
  cumulativeActualGross: number;

  /**
   * TER berdasarkan bruto aktual kumulatif
   * sebelum Re-Gross-Up adjustment.
   */
  terRate: number;

  /**
   * TER final setelah seluruh adjustment
   * Gross-Up diperhitungkan.
   */
  finalTerRate: number;

  /**
   * Tax allowance yang benar-benar terbentuk
   * pada saat payment GROSS_UP diproses.
   *
   * Nilai ini dihasilkan otomatis oleh engine.
   */
  actualTaxAllowance: number;

  /**
   * Base sebelum tunjangan PPh.
   *
   * Untuk GROSS_UP = amount.
   * Untuk GROSS = 0.
   */
  grossUpBase: number;

  /**
   * Total kebutuhan allowance dari seluruh
   * payment GROSS_UP sampai posisi ini.
   */
  oriTaxAllowance: number;

  /**
   * Total tambahan allowance yang diperlukan
   * akibat perubahan TER.
   */
  grossUpAdjustment: number;

  /**
   * Bruto setelah Re-Gross-Up adjustment.
   */
  brutoOri: number;

  /**
   * PPh kumulatif setelah adjustment.
   *
   * Ini adalah hasil simulasi internal payroll.
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
 * Menghitung payment payroll secara berurutan.
 *
 * GROSS:
 *   amount = bruto payment.
 *
 * GROSS_UP:
 *   amount = penghasilan sebelum tunjangan PPh.
 *   Tunjangan PPh dihitung otomatis.
 *
 * Setiap payment GROSS_UP menyimpan allowance
 * aktualnya secara internal. Ketika payment
 * berikutnya menyebabkan TER berubah, allowance
 * sebelumnya dapat dihitung ulang untuk menentukan
 * Re-Gross-Up adjustment.
 */
export function calculateGrossUpPayments(
  input: GrossUpPaymentCalculationInput,
): GrossUpPaymentResult[] {
  validateInput(input);

  const config =
    getTaxConfig(input.taxYear);

  const terBrackets = {
    TER_A: config.TER_A,
    TER_B: config.TER_B,
    TER_C: config.TER_C,
  };

  const results: GrossUpPaymentResult[] = [];

  /**
   * Bruto aktual yang benar-benar telah terbentuk
   * sampai payment sebelumnya.
   *
   * Nilai ini sudah termasuk allowance Gross-Up
   * aktual yang dihasilkan engine.
   */
  let cumulativeActualGross = 0;

  /**
   * PPh kumulatif simulasi.
   */
  let cumulativeTax = 0;

  /**
   * Menyimpan allowance aktual setiap payment
   * GROSS_UP.
   *
   * Key   = payment.id
   * Value = allowance yang benar-benar terbentuk
   *         ketika payment tersebut diproses.
   */
  const originalAllowances =
    new Map<string, number>();

  for (
    let paymentIndex = 0;
    paymentIndex <
      input.payments.length;
    paymentIndex++
  ) {
    const payment =
      input.payments[paymentIndex];

    /**
     * --------------------------------------------------
     * 1. Tentukan gross payment saat ini
     * --------------------------------------------------
     */

    let paymentGross =
      payment.amount;

    let paymentActualTaxAllowance =
      0;

    /**
     * Untuk GROSS_UP:
     *
     * amount = base sebelum tunjangan PPh.
     *
     * Engine mencari allowance yang konsisten
     * dengan TER setelah payment masuk.
     */
    if (
      payment.treatment ===
      "GROSS_UP"
    ) {
      const grossUpResult =
        calculateInitialGrossUp(
          input.taxYear,
          input.category,
          cumulativeActualGross,
          payment.amount,
        );

      paymentActualTaxAllowance =
        grossUpResult.taxAllowance;

      paymentGross =
        grossUpResult.gross;

      /**
       * Simpan allowance aktual.
       *
       * Ini bukan input user.
       */
      originalAllowances.set(
        payment.id,
        paymentActualTaxAllowance,
      );
    }

    /**
     * Bruto aktual setelah payment ini.
     *
     * Untuk GROSS:
     *   previous gross + amount
     *
     * Untuk GROSS_UP:
     *   previous gross + base + allowance
     */
    const newCumulativeActualGross =
      cumulativeActualGross +
      paymentGross;

    /**
     * TER aktual berdasarkan bruto
     * yang benar-benar terbentuk.
     */
    const actualTer =
      getTER(
        input.category,
        newCumulativeActualGross,
        terBrackets,
      );

    /**
     * --------------------------------------------------
     * 2. Ambil seluruh GROSS_UP sampai posisi ini
     * --------------------------------------------------
     */

    const grossUpPayments =
      input.payments.filter(
        (
          candidate,
          index,
        ) =>
          index <= paymentIndex &&
          candidate.treatment ===
            "GROSS_UP",
      );

    /**
     * Base masing-masing GROSS_UP.
     *
     * Pada desain baru:
     *
     * payment.amount
     * =
     * base sebelum tunjangan PPh.
     */
    const grossUpBases =
      grossUpPayments.map(
        (candidate) =>
          candidate.amount,
      );

    /**
     * Allowance aktual masing-masing
     * GROSS_UP yang sudah terbentuk.
     */
    const actualTaxAllowances =
      grossUpPayments.map(
        (candidate) =>
          originalAllowances.get(
            candidate.id,
          ) ?? 0,
      );

    /**
     * --------------------------------------------------
     * 3. Hitung Re-Gross-Up
     * --------------------------------------------------
     */

    const recalculation =
      calculateGrossUpRecalculation({
        taxYear:
          input.taxYear,

        category:
          input.category,

        actualGross:
          newCumulativeActualGross,

        grossUpBases,

        actualTaxAllowances,
      });

    /**
     * Total allowance yang seharusnya tersedia
     * berdasarkan TER final.
     */
    const totalOriTaxAllowance =
      recalculation.oriTaxAllowance;

    /**
     * Total adjustment dibandingkan allowance
     * yang benar-benar sudah terbentuk.
     */
    const totalGrossUpAdjustment =
      recalculation.grossUpAdjustment;

    /**
     * Bruto setelah adjustment.
     */
    const brutoOri =
      newCumulativeActualGross +
      totalGrossUpAdjustment;

    /**
     * TER final.
     */
    const finalTer =
      getTER(
        input.category,
        brutoOri,
        terBrackets,
      );

    /**
     * PPh kumulatif setelah adjustment.
     */
    const currentTax =
      Math.round(
        brutoOri *
          finalTer.rate,
      );

    /**
     * Dampak PPh terhadap payment ini.
     */
    const paymentTaxImpact =
      currentTax -
      cumulativeTax;

    cumulativeTax =
      currentTax;

    /**
     * Update actual gross.
     *
     * Adjustment tidak langsung dimasukkan
     * ke actual gross karena adjustment adalah
     * hasil Re-Gross-Up internal.
     */
    cumulativeActualGross =
      newCumulativeActualGross;

    /**
     * --------------------------------------------------
     * 4. Simpan hasil payment
     * --------------------------------------------------
     *
     * Penting:
     *
     * actualTaxAllowance harus merupakan
     * allowance yang BENAR-BENAR TERBENTUK
     * saat payment tersebut pertama kali diproses.
     *
     * Bukan allowance hasil Re-Gross-Up.
     */
    results.push({
      id:
        payment.id,

      name:
        payment.name,

      amount:
        payment.amount,

      treatment:
        payment.treatment,

      cumulativeActualGross:
        cumulativeActualGross,

      terRate:
        actualTer.rate,

      finalTerRate:
        finalTer.rate,

      actualTaxAllowance:
        paymentActualTaxAllowance,

      grossUpBase:
        payment.treatment ===
        "GROSS_UP"
          ? payment.amount
          : 0,

      oriTaxAllowance:
        totalOriTaxAllowance,

      grossUpAdjustment:
        totalGrossUpAdjustment,

      brutoOri:
        brutoOri,

      cumulativeTax:
        currentTax,

      paymentTaxImpact:
        paymentTaxImpact,
    });
  }

  return results;
}

/**
 * Menghitung Gross-Up awal.
 *
 * amount/base user:
 *
 *   G
 *
 * Allowance:
 *
 *   A = G × t / (1 - t)
 *
 * Karena allowance sendiri masuk bruto,
 * TER harus dicari secara iterative/bracket-aware.
 */
function calculateInitialGrossUp(
  taxYear: number,
  category: TERCategory,
  previousGross: number,
  grossUpBase: number,
): {
  taxAllowance: number;
  gross: number;
  terRate: number;
} {
  const config =
    getTaxConfig(taxYear);

  const terBrackets = {
    TER_A: config.TER_A,
    TER_B: config.TER_B,
    TER_C: config.TER_C,
  };

  /**
   * Mulai dari bruto tanpa allowance.
   */
  let candidateGross =
    previousGross +
    grossUpBase;

  let candidateTer =
    getTER(
      category,
      candidateGross,
      terBrackets,
    );

  const maxIterations = 100;

  for (
    let iteration = 0;
    iteration < maxIterations;
    iteration++
  ) {
    const taxAllowance =
      calculateGrossUpAllowance({
        grossUpBase,
        terRate:
          candidateTer.rate,
      });

    const gross =
      previousGross +
      grossUpBase +
      taxAllowance;

    const resultingTer =
      getTER(
        category,
        gross,
        terBrackets,
      );

    /**
     * TER sudah konsisten.
     */
    if (
      resultingTer.rate ===
      candidateTer.rate
    ) {
      return {
        taxAllowance,

        gross:
          grossUpBase +
          taxAllowance,

        terRate:
          resultingTer.rate,
      };
    }

    /**
     * Gross-Up mendorong bruto
     * ke bracket berikutnya.
     */
    candidateGross =
      gross;

    candidateTer =
      resultingTer;
  }

  throw new Error(
    "Perhitungan Gross-Up awal tidak mencapai kondisi TER yang konsisten.",
  );
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

  for (
    const payment of
      input.payments
  ) {
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

    /**
     * Pada desain baru, GROSS_UP tidak lagi
     * menerima grossUpBase maupun
     * actualTaxAllowance sebagai input.
     *
     * Keduanya dihitung oleh engine.
     */
    if (
      payment.treatment ===
      "GROSS_UP"
    ) {
      const legacyPayment =
        payment as GrossUpPayment & {
          grossUpBase?: number;
          actualTaxAllowance?: number;
        };

      if (
        legacyPayment.grossUpBase !==
          undefined ||
        legacyPayment.actualTaxAllowance !==
          undefined
      ) {
        throw new Error(
          `Payment GROSS_UP "${payment.name}" menggunakan field Gross-Up lama. Hapus grossUpBase dan actualTaxAllowance.`,
        );
      }
    }

    /**
     * GROSS juga tidak boleh membawa
     * parameter Gross-Up lama.
     */
    if (
      payment.treatment ===
      "GROSS"
    ) {
      const legacyPayment =
        payment as GrossUpPayment & {
          grossUpBase?: number;
          actualTaxAllowance?: number;
        };

      if (
        legacyPayment.grossUpBase !==
          undefined ||
        legacyPayment.actualTaxAllowance !==
          undefined
      ) {
        throw new Error(
          `Payment GROSS "${payment.name}" tidak boleh memiliki grossUpBase atau actualTaxAllowance.`,
        );
      }
    }
  }
}