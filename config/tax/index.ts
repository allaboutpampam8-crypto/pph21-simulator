import {
  PASAL_17,
  PTKP,
  TAX_YEAR,
  TER_A,
  TER_B,
  TER_C,
  TER_CATEGORY,
  type TERBracket,
} from "./2026";

import type {
  TERCategory,
  TaxpayerStatus,
} from "@/lib/tax-engine/types";

export interface TaxConfig {
  taxYear: number;

  PTKP: Record<
    TaxpayerStatus,
    number
  >;

  TER_CATEGORY: Record<
    TaxpayerStatus,
    TERCategory
  >;

  TER_A: TERBracket[];
  TER_B: TERBracket[];
  TER_C: TERBracket[];

  PASAL_17: typeof PASAL_17;
}

const TAX_CONFIGS: Record<number, TaxConfig> = {
  [TAX_YEAR]: {
    taxYear: TAX_YEAR,
    PTKP,
    TER_CATEGORY,
    TER_A,
    TER_B,
    TER_C,
    PASAL_17,
  },
};

export function getTaxConfig(
  taxYear: number,
): TaxConfig {
  const config = TAX_CONFIGS[taxYear];

  if (!config) {
    throw new Error(
      `Konfigurasi pajak untuk tahun ${taxYear} belum tersedia.`,
    );
  }

  return config;
}