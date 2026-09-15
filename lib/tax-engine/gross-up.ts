import { getTaxConfig } from "@/config/tax";
import { getTER } from "./ter";

import type {
  TERCategory,
} from "./types";

/**
 * Input untuk menghitung kebutuhan tunjangan pajak
 * berdasarkan gross-up base dan TER tertentu.
 */
export interface GrossUpAllowanceInput {
  grossUpBase: number;
  terRate: number;
}

/**
 * Input untuk menghitung re-gross-up.
 *
 * grossUpBases:
 *   Basis penghasilan sebelum tunjangan PPh
 *   untuk seluruh payment GROSS_UP.
 *
 * actualTaxAllowances:
 *   Tunjangan PPh yang benar-benar terbentuk
 *   ketika masing-masing payment GROSS_UP
 *   pertama kali diproses.
 *
 * actualTaxAllowances bukan input user.
 * Nilai ini dihasilkan oleh engine.
 */
export interface GrossUpRecalculationInput {
  taxYear: number;
  category: TERCategory;

  /**
   * Total bruto aktual kumulatif sampai posisi
   * payment yang sedang dihitung.
   *
   * Nilai ini SUDAH termasuk allowance GROSS_UP
   * yang benar-benar terbentuk.
   */
  actualGross: number;

  /**
   * Base dari seluruh payment GROSS_UP
   * yang sudah muncul sampai posisi ini.
   */
  grossUpBases: number[];

  /**
   * Allowance aktual dari seluruh payment
   * GROSS_UP tersebut.
   *
   * Array harus berpasangan dengan grossUpBases.
   */
  actualTaxAllowances: number[];
}

export interface GrossUpRecalculationResult {
  actualGross: number;

  /**
   * Total basis penghasilan sebelum
   * tunjangan PPh.
   */
  grossUpBase: number;

  /**
   * Total allowance yang benar-benar
   * sudah terbentuk sebelumnya.
   */
  actualTaxAllowance: number;

  /**
   * TER berdasarkan bruto aktual.
   */
  initialTerRate: number;

  /**
   * TER final setelah re-gross-up.
   */
  finalTerRate: number;

  /**
   * Total allowance yang seharusnya
   * tersedia berdasarkan TER final.
   */
  oriTaxAllowance: number;

  /**
   * Tambahan allowance yang diperlukan
   * dibandingkan allowance aktual.
   */
  grossUpAdjustment: number;

  /**
   * Bruto setelah adjustment.
   */
  brutoOri: number;

  /**
   * PPh berdasarkan brutoOri dan TER final.
   */
  totalTax: number;
}

/**
 * Menghitung tax allowance untuk gross-up base
 * dengan TER tertentu.
 *
 * Formula:
 *
 * A = G × t / (1 - t)
 */
export function calculateGrossUpAllowance(
  input: GrossUpAllowanceInput,
): number {
  validateGrossUpBase(
    input.grossUpBase,
  );

  if (
    !Number.isFinite(
      input.terRate,
    ) ||
    input.terRate < 0 ||
    input.terRate >= 1
  ) {
    throw new Error(
      "TER gross-up harus berada antara 0% dan kurang dari 100%.",
    );
  }

  if (
    input.terRate === 0
  ) {
    return 0;
  }

  return Math.round(
    (
      input.grossUpBase *
      input.terRate
    ) /
      (1 - input.terRate),
  );
}

/**
 * Menghitung kebutuhan Re-Gross-Up secara
 * bracket-aware.
 *
 * Mekanisme:
 *
 * 1. Tentukan TER dari actualGross.
 * 2. Hitung ulang seluruh allowance GROSS_UP
 *    berdasarkan TER kandidat.
 * 3. Bandingkan dengan allowance aktual.
 * 4. Tambahkan selisih allowance ke actualGross.
 * 5. Cari TER kembali.
 * 6. Jika TER berubah, ulangi.
 * 7. Berhenti ketika TER konsisten.
 *
 * Dengan demikian:
 *
 * allowance aktual
 *       ↓
 * allowance yang seharusnya
 *       ↓
 * adjustment
 *
 * dapat dihitung tanpa meminta user
 * memasukkan allowance secara manual.
 */
export function calculateGrossUpRecalculation(
  input: GrossUpRecalculationInput,
): GrossUpRecalculationResult {
  validateRecalculationInput(
    input,
  );

  const config =
    getTaxConfig(
      input.taxYear,
    );

  const terBrackets = {
    TER_A: config.TER_A,
    TER_B: config.TER_B,
    TER_C: config.TER_C,
  };

  const initialTer =
    getTER(
      input.category,
      input.actualGross,
      terBrackets,
    );

  const totalGrossUpBase =
    input.grossUpBases.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    );

  const totalActualTaxAllowance =
    input.actualTaxAllowances.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    );

  /**
   * Tidak ada Gross-Up.
   */
  if (
    input.grossUpBases.length === 0
  ) {
    const totalTax =
      Math.round(
        input.actualGross *
          initialTer.rate,
      );

    return {
      actualGross:
        input.actualGross,

      grossUpBase: 0,

      actualTaxAllowance: 0,

      initialTerRate:
        initialTer.rate,

      finalTerRate:
        initialTer.rate,

      oriTaxAllowance: 0,

      grossUpAdjustment: 0,

      brutoOri:
        input.actualGross,

      totalTax,
    };
  }

  let candidateRate =
    initialTer.rate;

  const maxIterations = 100;

  for (
    let iteration = 0;
    iteration < maxIterations;
    iteration++
  ) {
    /**
     * Hitung kebutuhan allowance berdasarkan
     * TER kandidat.
     */
    const oriTaxAllowance =
      input.grossUpBases.reduce(
        (
          total,
          grossUpBase,
        ) =>
          total +
          calculateGrossUpAllowance({
            grossUpBase,
            terRate:
              candidateRate,
          }),
        0,
      );

    /**
     * Adjustment adalah selisih antara
     * allowance yang seharusnya dan allowance
     * yang benar-benar sudah diberikan.
     */
    const grossUpAdjustment =
      oriTaxAllowance -
      totalActualTaxAllowance;

    /**
     * Bruto setelah Re-Gross-Up.
     */
    const brutoOri =
      input.actualGross +
      grossUpAdjustment;

    /**
     * Tentukan TER berdasarkan bruto
     * setelah adjustment.
     */
    const resultingTer =
      getTER(
        input.category,
        brutoOri,
        terBrackets,
      );

    /**
     * Jika TER sudah konsisten,
     * perhitungan selesai.
     */
    if (
      resultingTer.rate ===
      candidateRate
    ) {
      const totalTax =
        Math.round(
          brutoOri *
            resultingTer.rate,
        );

      return {
        actualGross:
          input.actualGross,

        grossUpBase:
          totalGrossUpBase,

        actualTaxAllowance:
          totalActualTaxAllowance,

        initialTerRate:
          initialTer.rate,

        finalTerRate:
          resultingTer.rate,

        oriTaxAllowance,

        grossUpAdjustment,

        brutoOri,

        totalTax,
      };
    }

    /**
     * TER berubah karena adjustment
     * mendorong bruto ke bracket berikutnya.
     */
    candidateRate =
      resultingTer.rate;
  }

  throw new Error(
    "Perhitungan re-gross-up tidak mencapai kondisi TER yang konsisten.",
  );
}

function validateGrossUpBase(
  grossUpBase: number,
): void {
  if (
    !Number.isFinite(
      grossUpBase,
    )
  ) {
    throw new Error(
      "Gross-up base harus berupa angka yang valid.",
    );
  }

  if (
    grossUpBase < 0
  ) {
    throw new Error(
      "Gross-up base tidak boleh negatif.",
    );
  }
}

function validateRecalculationInput(
  input: GrossUpRecalculationInput,
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
    !Number.isFinite(
      input.actualGross,
    ) ||
    input.actualGross < 0
  ) {
    throw new Error(
      "Actual gross harus berupa angka valid dan tidak boleh negatif.",
    );
  }

  if (
    !Array.isArray(
      input.grossUpBases,
    )
  ) {
    throw new Error(
      "Gross-up bases harus berupa array.",
    );
  }

  if (
    !Array.isArray(
      input.actualTaxAllowances,
    )
  ) {
    throw new Error(
      "Actual tax allowances harus berupa array.",
    );
  }

  if (
    input.grossUpBases.length !==
    input.actualTaxAllowances.length
  ) {
    throw new Error(
      "Jumlah gross-up bases harus sama dengan jumlah actual tax allowances.",
    );
  }

  for (
    const grossUpBase of
      input.grossUpBases
  ) {
    validateGrossUpBase(
      grossUpBase,
    );
  }

  for (
    const actualTaxAllowance of
      input.actualTaxAllowances
  ) {
    if (
      !Number.isFinite(
        actualTaxAllowance,
      ) ||
      actualTaxAllowance < 0
    ) {
      throw new Error(
        "Actual tax allowance harus berupa angka valid dan tidak boleh negatif.",
      );
    }
  }
}