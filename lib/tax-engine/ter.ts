import type {
  TERBracket,
} from "@/config/tax/2026";

import type {
  TERCategory,
} from "./types";

export interface TERResult {
  category: TERCategory;
  rate: number;
  bracket: TERBracket;
}

export function getTER(
  category: TERCategory,
  gross: number,
  brackets: {
    TER_A: TERBracket[];
    TER_B: TERBracket[];
    TER_C: TERBracket[];
  },
): TERResult {
  if (!Number.isFinite(gross)) {
    throw new Error(
      "Gross income harus berupa angka yang valid.",
    );
  }

  if (gross < 0) {
    throw new Error(
      "Gross income tidak boleh negatif.",
    );
  }

  const categoryBrackets =
    getBrackets(category, brackets);

  const bracket =
    categoryBrackets.find((item) => {
      const minimumMatched =
        gross >= item.min;

      const maximumMatched =
        item.max === null ||
        gross <= item.max;

      return (
        minimumMatched &&
        maximumMatched
      );
    });

  if (!bracket) {
    throw new Error(
      `Tidak ditemukan bracket TER ${category} untuk gross ${gross}.`,
    );
  }

  return {
    category,
    rate: bracket.rate,
    bracket,
  };
}

function getBrackets(
  category: TERCategory,
  brackets: {
    TER_A: TERBracket[];
    TER_B: TERBracket[];
    TER_C: TERBracket[];
  },
): TERBracket[] {
  switch (category) {
    case "A":
      return brackets.TER_A;

    case "B":
      return brackets.TER_B;

    case "C":
      return brackets.TER_C;

    default:
      throw new Error(
        `Kategori TER tidak valid: ${category}`,
      );
  }
}