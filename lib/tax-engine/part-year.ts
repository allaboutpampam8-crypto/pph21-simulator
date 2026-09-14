import { getTaxConfig } from "@/config/tax";

import {
  calculateProgressiveTax,
} from "./progressive-tax";

import type {
  PartYearTaxInput,
  PartYearTaxResult,
} from "./types";

/**
 * Menghitung PPh 21 untuk pegawai yang hanya memperoleh
 * penghasilan selama sebagian tahun pajak.
 *
 * Annualisasi hanya dilakukan apabila kewajiban pajak
 * baru dimulai di tengah tahun.
 */
export function calculatePartYearTax(
  input: PartYearTaxInput,
): PartYearTaxResult {
  validateInput(input);

  const config = getTaxConfig(input.taxYear);

  const pensionContribution =
    input.pensionContribution ?? 0;

  const religiousContribution =
    input.religiousContribution ?? 0;

  /**
   * Biaya jabatan:
   * 5% dari bruto, maksimal Rp500.000 per bulan.
   */
  const jobExpense = Math.min(
    input.grossIncome * 0.05,
    500_000 * input.monthsWorked,
  );

  const netIncome = Math.max(
    0,
    input.grossIncome -
      jobExpense -
      pensionContribution -
      religiousContribution,
  );

  const ptkp = config.PTKP[input.status];

  /**
   * Jika kewajiban pajak baru dimulai di tengah tahun,
   * penghasilan neto disetahunkan.
   *
   * Contoh:
   * 4 bulan penghasilan Rp56,9 juta
   *
   * Rp56,9 juta × 12 / 4
   * = Rp170,7 juta
   */
  const annualizedNetIncome =
    input.taxSubjectStartedMidYear
      ? (netIncome * 12) /
        input.monthsWorked
      : netIncome;

  const taxableIncome =
    Math.floor(
      Math.max(
        0,
        annualizedNetIncome - ptkp,
      ) / 1_000,
    ) * 1_000;

  const annualTax =
    calculateProgressiveTax(
      taxableIncome,
      config.PASAL_17,
    );

  /**
   * Jika kewajiban pajak baru dimulai di tengah tahun,
   * PPh disesuaikan secara prorata.
   *
   * Jika tidak, gunakan PPh berdasarkan penghasilan
   * aktual tanpa annualisasi.
   */
  const proratedTax =
    input.taxSubjectStartedMidYear
      ? Math.round(
          (annualTax *
            input.monthsWorked) /
            12,
        )
      : annualTax;

  const finalTax = Math.max(
    0,
    proratedTax -
      input.previousTaxWithheld,
  );

  const overpayment = Math.max(
    0,
    input.previousTaxWithheld -
      proratedTax,
  );

    return {
    grossIncome: input.grossIncome,

    jobExpense,
    pensionContribution,
    religiousContribution,

    netIncome,
    annualizedNetIncome,

    ptkp,
    taxableIncome,

    annualTax,
    proratedTax,

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
  input: PartYearTaxInput,
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
      input.grossIncome,
    ) ||
    input.grossIncome < 0
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