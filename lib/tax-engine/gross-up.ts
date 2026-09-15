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
 * Input untuk menghitung re-gross-up setelah kondisi
 * bruto/TER masa pajak berubah.
 */
export interface GrossUpRecalculationInput {
  taxYear: number;
  category: TERCategory;

  /**
   * Total bruto aktual yang sudah terbentuk,
   * termasuk tunjangan PPh aktual dan komponen
   * lain yang menjadi objek pajak.
   */
  actualGross: number;

  /**
   * Basis penghasilan yang di-gross-up.
   * Tidak termasuk tax allowance aktual.
   */
  grossUpBase: number;

  /**
   * Tunjangan PPh yang sudah diberikan sebelumnya.
   */
  actualTaxAllowance: number;
}

export interface GrossUpRecalculationResult {
  actualGross: number;
  grossUpBase: number;
  actualTaxAllowance: number;

  /**
   * TER berdasarkan bruto aktual sebelum re-gross-up.
   */
  initialTerRate: number;

  /**
   * TER yang konsisten setelah adjustment gross-up.
   */
  finalTerRate: number;

  /**
   * Tunjangan PPh yang seharusnya tersedia
   * berdasarkan TER final.
   */
  oriTaxAllowance: number;

  /**
   * Selisih antara kebutuhan tunjangan pajak
   * dan tunjangan yang sudah diberikan.
   */
  grossUpAdjustment: number;

  /**
   * Bruto setelah adjustment internal payroll.
   */
  brutoOri: number;

  /**
   * PPh berdasarkan brutoOri dan TER final.
   *
   * Ini adalah hasil mekanisme internal payroll,
   * bukan rumus terpisah untuk setiap payment
   * secara hukum.
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
 *
 * Hasil dibulatkan ke rupiah.
 */
export function calculateGrossUpAllowance(
  input: GrossUpAllowanceInput,
): number {
  validateGrossUpBase(
    input.grossUpBase,
  );

  if (
    !Number.isFinite(input.terRate) ||
    input.terRate < 0 ||
    input.terRate >= 1
  ) {
    throw new Error(
      "TER gross-up harus berada antara 0% dan kurang dari 100%.",
    );
  }

  if (input.terRate === 0) {
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
 * Menghitung kebutuhan re-gross-up secara
 * bracket-aware.
 *
 * Prinsip:
 *
 * 1. Cari TER berdasarkan actualGross.
 * 2. Hitung ulang tax allowance berdasarkan TER tersebut.
 * 3. Tambahkan selisih allowance ke actualGross.
 * 4. Cari TER baru berdasarkan brutoOri.
 * 5. Jika TER berubah, ulangi.
 * 6. Berhenti ketika TER sudah konsisten.
 *
 * Ini diperlukan karena adjustment gross-up sendiri
 * dapat mendorong bruto ke bracket TER berikutnya.
 */
export function calculateGrossUpRecalculation(
  input: GrossUpRecalculationInput,
): GrossUpRecalculationResult {
  validateRecalculationInput(input);

  const config = getTaxConfig(
    input.taxYear,
  );

  const initialTer = getTER(
    input.category,
    input.actualGross,
    {
      TER_A: config.TER_A,
      TER_B: config.TER_B,
      TER_C: config.TER_C,
    },
  );

  let candidateRate =
    initialTer.rate;

  /**
   * Jumlah iterasi dibatasi untuk mencegah
   * infinite loop apabila konfigurasi TER
   * di masa depan mengalami perubahan.
   */
  const maxIterations = 100;

  for (
    let iteration = 0;
    iteration < maxIterations;
    iteration++
  ) {
    const oriTaxAllowance =
      calculateGrossUpAllowance({
        grossUpBase:
          input.grossUpBase,
        terRate: candidateRate,
      });

    const grossUpAdjustment =
      oriTaxAllowance -
      input.actualTaxAllowance;

    const brutoOri =
      input.actualGross +
      grossUpAdjustment;

    const resultingTer = getTER(
      input.category,
      brutoOri,
      {
        TER_A: config.TER_A,
        TER_B: config.TER_B,
        TER_C: config.TER_C,
      },
    );

    /**
     * TER sudah konsisten dengan brutoOri.
     */
    if (
      resultingTer.rate ===
      candidateRate
    ) {
      const totalTax = Math.round(
        brutoOri *
          resultingTer.rate,
      );

      return {
        actualGross:
          input.actualGross,

        grossUpBase:
          input.grossUpBase,

        actualTaxAllowance:
          input.actualTaxAllowance,

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
     * TER berubah karena brutoOri masuk
     * ke bracket berikutnya.
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
    !Number.isFinite(grossUpBase)
  ) {
    throw new Error(
      "Gross-up base harus berupa angka yang valid.",
    );
  }

  if (grossUpBase < 0) {
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

  validateGrossUpBase(
    input.grossUpBase,
  );

  if (
    !Number.isFinite(
      input.actualTaxAllowance,
    ) ||
    input.actualTaxAllowance < 0
  ) {
    throw new Error(
      "Actual tax allowance harus berupa angka valid dan tidak boleh negatif.",
    );
  }
}