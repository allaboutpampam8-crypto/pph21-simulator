import { getTaxConfig } from "@/config/tax";

import {
  calculateProgressiveTax,
} from "./progressive-tax";

import type {
  FinalTaxInput,
  FinalTaxResult,
} from "./types";

export function calculateFinalTax(
  input: FinalTaxInput,
): FinalTaxResult {
  validateInput(input);

  const config = getTaxConfig(input.taxYear);

  const pensionContribution =
    input.pensionContribution ?? 0;

  const religiousContribution =
    input.religiousContribution ?? 0;

  /**
   * Biaya jabatan:
   * 5% dari penghasilan bruto,
   * maksimal Rp500.000 per bulan.
   */
  const jobExpense = Math.min(
    input.annualGrossIncome * 0.05,
    500_000 * input.monthsWorked,
  );

  /**
   * Penghasilan neto:
   * bruto - biaya jabatan
   * - iuran pensiun
   * - zakat/sumbangan keagamaan wajib
   */
  const netIncome = Math.max(
    0,
    input.annualGrossIncome -
      jobExpense -
      pensionContribution -
      religiousContribution,
  );

  const ptkp = config.PTKP[input.status];

  /**
   * PKP dibulatkan ke bawah
   * sampai ribuan rupiah penuh.
   */
  const taxableIncome =
    Math.floor(
      Math.max(
        0,
        netIncome - ptkp,
      ) / 1_000,
    ) * 1_000;

  /**
   * PPh 21 setahun menggunakan
   * tarif Pasal 17 progresif.
   */
  const annualTax =
    calculateProgressiveTax(
      taxableIncome,
      config.PASAL_17,
    );

  /**
   * PPh 21 masa pajak terakhir:
   * PPh 21 setahun
   * - PPh 21 yang sudah dipotong sebelumnya.
   */
  const finalTax = Math.max(
    0,
    annualTax -
      input.previousTaxWithheld,
  );

  /**
   * Jika PPh yang sudah dipotong sebelumnya
   * lebih besar daripada PPh terutang setahun,
   * selisihnya menjadi kelebihan pemotongan.
   */
  const overpayment = Math.max(
    0,
    input.previousTaxWithheld -
      annualTax,
  );

  return {
    grossIncome:
      input.annualGrossIncome,

    jobExpense,
    pensionContribution,
    religiousContribution,

    netIncome,
    ptkp,
    taxableIncome,

    annualTax,
    previousTaxWithheld:
      input.previousTaxWithheld,

    finalTax,
    overpayment,

    // Dipertahankan untuk kompatibilitas
    // dengan struktur result saat ini.
    tax: finalTax,
  };
}

function validateInput(
  input: FinalTaxInput,
): void {
  if (
    !Number.isInteger(input.taxYear) ||
    input.taxYear < 2000
  ) {
    throw new Error(
      "Tahun pajak tidak valid.",
    );
  }

  if (
    !Number.isInteger(
      input.monthsWorked,
    ) ||
    input.monthsWorked < 1 ||
    input.monthsWorked > 12
  ) {
    throw new Error(
      "Jumlah bulan bekerja harus berupa bilangan bulat antara 1 sampai 12.",
    );
  }

  if (
    !Number.isFinite(
      input.annualGrossIncome,
    ) ||
    input.annualGrossIncome < 0
  ) {
    throw new Error(
      "Penghasilan bruto harus berupa angka valid dan tidak boleh negatif.",
    );
  }

  const pensionContribution =
    input.pensionContribution ?? 0;

  if (
    !Number.isFinite(
      pensionContribution,
    ) ||
    pensionContribution < 0
  ) {
    throw new Error(
      "Iuran pensiun harus berupa angka valid dan tidak boleh negatif.",
    );
  }

  const religiousContribution =
    input.religiousContribution ?? 0;

  if (
    !Number.isFinite(
      religiousContribution,
    ) ||
    religiousContribution < 0
  ) {
    throw new Error(
      "Zakat/sumbangan keagamaan harus berupa angka valid dan tidak boleh negatif.",
    );
  }

  if (
    !Number.isFinite(
      input.previousTaxWithheld,
    ) ||
    input.previousTaxWithheld < 0
  ) {
    throw new Error(
      "PPh yang sudah dipotong harus berupa angka valid dan tidak boleh negatif.",
    );
  }
}