import {
  getTaxConfig,
} from "@/config/tax";

import { getTER } from "./ter";

import type {
  MonthlyTaxResult,
  TaxCalculationInput,
} from "./types";

export function calculateMonthlyTax(
  input: TaxCalculationInput,
): MonthlyTaxResult {
  validateMonthlyInput(input);

  const grossIncome = input.incomeItems.reduce(
    (total, item) => total + item.amount,
    0,
  );

  const config = getTaxConfig(
  input.profile.taxYear,
);

const terCategory =
  config.TER_CATEGORY[
    input.profile.status
  ];

const ter = getTER(
  terCategory,
  grossIncome,
  {
    TER_A: config.TER_A,
    TER_B: config.TER_B,
    TER_C: config.TER_C,
  },
);

  const tax = Math.round(
    grossIncome * ter.rate,
  );

  return {
    grossIncome,
    terCategory,
    terRate: ter.rate,
    tax,
  };
}

function validateMonthlyInput(
  input: TaxCalculationInput,
): void {
  if (input.profile.isFinalMonth) {
    throw new Error(
      "calculateMonthlyTax hanya digunakan untuk masa pajak bukan final.",
    );
  }

  if (
    !Number.isInteger(input.profile.month) ||
    input.profile.month < 1 ||
    input.profile.month > 12
  ) {
    throw new Error(
      "Bulan pajak harus berupa bilangan bulat antara 1 sampai 12.",
    );
  }

  if (input.incomeItems.length === 0) {
    throw new Error(
      "Minimal harus ada satu komponen penghasilan.",
    );
  }

  for (const item of input.incomeItems) {
    if (!Number.isFinite(item.amount)) {
      throw new Error(
        `Nominal "${item.name}" harus berupa angka yang valid.`,
      );
    }

    if (item.amount < 0) {
      throw new Error(
        `Nominal "${item.name}" tidak boleh negatif.`,
      );
    }
  }
}