import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TER_A,
  TER_B,
  TER_C,
} from "@/config/tax/2026";

import { getTER } from "@/lib/tax-engine/ter";

const brackets = {
  TER_A,
  TER_B,
  TER_C,
};

describe("getTER - TER A", () => {
  it.each([
    [5_000_000, 0],
    [5_400_000, 0],
    [5_400_001, 0.0025],
    [5_650_000, 0.0025],
    [5_650_001, 0.005],
    [5_950_000, 0.005],
    [5_950_001, 0.0075],
    [6_300_000, 0.0075],
    [6_300_001, 0.01],
    [6_750_000, 0.01],
    [6_750_001, 0.0125],
    [7_500_000, 0.0125],
    [7_500_001, 0.015],
    [8_550_000, 0.015],
    [8_550_001, 0.0175],
    [9_650_000, 0.0175],
    [9_650_001, 0.02],
    [10_000_000, 0.02],
    [20_000_000, 0.09],
    [25_000_000, 0.10],
  ])(
    "gross %s mendapat TER %s",
    (gross, expectedRate) => {
      const result = getTER(
        "A",
        gross,
        brackets,
      );

      expect(result.rate).toBe(
        expectedRate,
      );
      expect(result.category).toBe("A");
    },
  );
});

describe("getTER - TER B", () => {
  it.each([
    [5_000_000, 0],
    [6_200_000, 0],
    [6_200_001, 0.0025],
    [6_500_000, 0.0025],
    [6_500_001, 0.005],
    [6_850_000, 0.005],
    [6_850_001, 0.0075],
    [7_300_000, 0.0075],
    [7_300_001, 0.01],
    [9_200_000, 0.01],
    [9_200_001, 0.015],
    [10_750_000, 0.015],
    [10_750_001, 0.02],
    [20_000_000, 0.08],
    [30_000_000, 0.12],
    [50_000_000, 0.18],
    [100_000_000, 0.24],
  ])(
    "gross %s mendapat TER %s",
    (gross, expectedRate) => {
      const result = getTER(
        "B",
        gross,
        brackets,
      );

      expect(result.rate).toBe(
        expectedRate,
      );
      expect(result.category).toBe("B");
    },
  );
});

describe("getTER - TER C", () => {
  it.each([
    [5_000_000, 0],
    [6_600_000, 0],
    [6_600_001, 0.0025],
    [6_950_000, 0.0025],
    [6_950_001, 0.005],
    [7_350_000, 0.005],
    [7_350_001, 0.0075],
    [7_800_000, 0.0075],
    [7_800_001, 0.01],
    [8_850_000, 0.01],
    [8_850_001, 0.0125],
    [9_800_000, 0.0125],
    [9_800_001, 0.015],
    [20_000_000, 0.08],
    [30_000_000, 0.11],
    [50_000_000, 0.17],
    [100_000_000, 0.24],
  ])(
    "gross %s mendapat TER %s",
    (gross, expectedRate) => {
      const result = getTER(
        "C",
        gross,
        brackets,
      );

      expect(result.rate).toBe(
        expectedRate,
      );
      expect(result.category).toBe("C");
    },
  );
});

describe("getTER - boundary dan bracket", () => {
  it("gross tepat di batas atas tetap masuk bracket tersebut", () => {
    const result = getTER(
      "A",
      5_650_000,
      brackets,
    );

    expect(result.rate).toBe(0.0025);
    expect(result.bracket.min).toBe(
      5_400_001,
    );
    expect(result.bracket.max).toBe(
      5_650_000,
    );
  });

  it("gross satu rupiah setelah batas berpindah ke bracket berikutnya", () => {
    const result = getTER(
      "A",
      5_650_001,
      brackets,
    );

    expect(result.rate).toBe(0.005);
    expect(result.bracket.min).toBe(
      5_650_001,
    );
  });

  it("gross sangat besar tetap mendapatkan bracket terakhir", () => {
    const result = getTER(
      "A",
      2_000_000_000,
      brackets,
    );

    expect(result.rate).toBe(0.34);
    expect(result.bracket.max).toBeNull();
  });
});

describe("getTER - invalid input", () => {
  it("menolak gross negatif", () => {
    expect(() =>
      getTER(
        "A",
        -1,
        brackets,
      ),
    ).toThrow(
      "Gross income tidak boleh negatif.",
    );
  });

  it("menolak NaN", () => {
    expect(() =>
      getTER(
        "A",
        Number.NaN,
        brackets,
      ),
    ).toThrow(
      "Gross income harus berupa angka yang valid.",
    );
  });

  it("menolak Infinity", () => {
    expect(() =>
      getTER(
        "A",
        Number.POSITIVE_INFINITY,
        brackets,
      ),
    ).toThrow(
      "Gross income harus berupa angka yang valid.",
    );
  });

  it("gross nol mendapatkan TER 0%", () => {
    const result = getTER(
      "A",
      0,
      brackets,
    );

    expect(result.rate).toBe(0);
  });
});