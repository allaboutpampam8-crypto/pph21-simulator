import {
  describe,
  expect,
  it,
} from "vitest";

import { calculateFinalTax } from "@/lib/tax-engine/final";

describe("calculateFinalTax - golden tests", () => {
  it("GT-FINAL-001 - PPh final Rp7 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      pensionContribution: 0,
      religiousContribution: 0,

      previousTaxWithheld: 14_000_000,
    });

    expect(result.grossIncome).toBe(
      240_000_000,
    );
    expect(result.jobExpense).toBe(
      6_000_000,
    );
    expect(result.netIncome).toBe(
      234_000_000,
    );

    expect(result.ptkp).toBe(
      54_000_000,
    );
    expect(result.taxableIncome).toBe(
      180_000_000,
    );

    expect(result.annualTax).toBe(
      21_000_000,
    );
    expect(result.finalTax).toBe(
      7_000_000,
    );
    expect(result.overpayment).toBe(0);
  });

  it("GT-FINAL-002 - terjadi lebih potong Rp1 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      previousTaxWithheld: 22_000_000,
    });

    expect(result.annualTax).toBe(
      21_000_000,
    );
    expect(result.finalTax).toBe(0);
    expect(result.overpayment).toBe(
      1_000_000,
    );
  });

  it("GT-FINAL-003 - PPh final tepat Rp0", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      previousTaxWithheld: 21_000_000,
    });

    expect(result.annualTax).toBe(
      21_000_000,
    );
    expect(result.finalTax).toBe(0);
    expect(result.overpayment).toBe(0);
  });

  it("gross 0 menghasilkan PPh 0", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 0,

      previousTaxWithheld: 0,
    });

    expect(result.grossIncome).toBe(0);
    expect(result.jobExpense).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
    expect(result.finalTax).toBe(0);
    expect(result.overpayment).toBe(0);
  });
});

describe("calculateFinalTax - PTKP", () => {
  it("TK/0 menggunakan PTKP Rp54 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.ptkp).toBe(
      54_000_000,
    );
  });

  it("K/3 menggunakan PTKP Rp72 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "K/3",
      monthsWorked: 12,

      annualGrossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.ptkp).toBe(
      72_000_000,
    );
    expect(result.taxableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
  });

  it("K/3 dengan PKP 162 juta menghasilkan PPh Rp18,3 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "K/3",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.ptkp).toBe(
      72_000_000,
    );
    expect(result.taxableIncome).toBe(
      162_000_000,
    );
    expect(result.annualTax).toBe(
      18_300_000,
    );
  });
});

describe("calculateFinalTax - deductions", () => {
  it("mengurangi penghasilan dengan iuran pensiun", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      pensionContribution: 1_200_000,
      religiousContribution: 0,

      previousTaxWithheld: 0,
    });

    expect(result.jobExpense).toBe(
      6_000_000,
    );
    expect(result.pensionContribution).toBe(
      1_200_000,
    );
    expect(result.netIncome).toBe(
      232_800_000,
    );
    expect(result.taxableIncome).toBe(
      178_800_000,
    );
    expect(result.annualTax).toBe(
      20_820_000,
    );
  });

  it("mengurangi penghasilan dengan zakat/sumbangan keagamaan", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      pensionContribution: 0,
      religiousContribution: 1_200_000,

      previousTaxWithheld: 0,
    });

    expect(result.religiousContribution).toBe(
      1_200_000,
    );
    expect(result.netIncome).toBe(
      232_800_000,
    );
    expect(result.taxableIncome).toBe(
      178_800_000,
    );
    expect(result.annualTax).toBe(
      20_820_000,
    );
  });

  it("biaya jabatan maksimal Rp500 ribu per bulan", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 240_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.jobExpense).toBe(
      6_000_000,
    );
  });

  it("biaya jabatan tidak melebihi 5% bruto", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.jobExpense).toBe(
      3_000_000,
    );
  });
});

describe("calculateFinalTax - PKP rounding", () => {
  it("PKP dibulatkan ke bawah sampai ribuan", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // Bruto 114.001.999
      // Biaya jabatan 5.700.099,95
      // Neto 108.301.899,05
      // PKP = 54.301.899,05
      // Dibulatkan menjadi 54.301.000
      annualGrossIncome: 114_001_999,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      54_301_000,
    );
  });

  it("PKP tepat Rp0 menghasilkan PPh Rp0", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // Bruto 60 juta:
      // 60 juta - 3 juta biaya jabatan
      // - 54 juta PTKP = 3 juta PKP
      annualGrossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      3_000_000,
    );
    expect(result.annualTax).toBe(
      150_000,
    );
  });
});

describe("calculateFinalTax - Pasal 17 boundary", () => {
  it("PKP tepat Rp60 juta menggunakan tarif 5%", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // 120 juta bruto
      // - 6 juta biaya jabatan
      // - 54 juta PTKP
      // = 60 juta PKP
      annualGrossIncome: 120_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      60_000_000,
    );
    expect(result.annualTax).toBe(
      3_000_000,
    );
  });

  it("PKP Rp60.001.000 masuk lapisan 15%", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      annualGrossIncome: 120_001_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      60_001_000,
    );
    expect(result.annualTax).toBe(
      3_000_150,
    );
  });

  it("PKP tepat Rp250 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // 310 juta - 6 juta - 54 juta
      // = 250 juta PKP
      annualGrossIncome: 310_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      250_000_000,
    );
    expect(result.annualTax).toBe(
      31_500_000,
    );
  });

  it("PKP tepat Rp500 juta", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // 560 juta - 6 juta - 54 juta
      // = 500 juta PKP
      annualGrossIncome: 560_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      500_000_000,
    );
    expect(result.annualTax).toBe(
      94_000_000,
    );
  });

  it("PKP tepat Rp5 miliar", () => {
    const result = calculateFinalTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 12,

      // 5,06 miliar - 6 juta - 54 juta
      // = 5 miliar PKP
      annualGrossIncome: 5_060_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(
      5_000_000_000,
    );
    expect(result.annualTax).toBe(
      1_444_000_000,
    );
  });
});

describe("calculateFinalTax - validation", () => {
  const baseInput = {
    taxYear: 2026,
    status: "TK/0" as const,
    monthsWorked: 12,
    annualGrossIncome: 240_000_000,
    previousTaxWithheld: 0,
  };

  it("menolak tahun pajak non-integer", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        taxYear: 2026.5,
      }),
    ).toThrow(
      "Tahun pajak tidak valid.",
    );
  });

  it("menolak tahun pajak yang belum tersedia", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        taxYear: 2025,
      }),
    ).toThrow(
      "Konfigurasi pajak untuk tahun 2025 belum tersedia.",
    );
  });

  it("menolak monthsWorked 0", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        monthsWorked: 0,
      }),
    ).toThrow();
  });

  it("menolak monthsWorked 13", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        monthsWorked: 13,
      }),
    ).toThrow();
  });

  it("menolak monthsWorked desimal", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        monthsWorked: 6.5,
      }),
    ).toThrow();
  });

  it("menolak gross negatif", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        annualGrossIncome: -1,
      }),
    ).toThrow();
  });

  it("menolak gross NaN", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        annualGrossIncome: Number.NaN,
      }),
    ).toThrow();
  });

  it("menolak gross Infinity", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        annualGrossIncome:
          Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
  });

  it("menolak iuran pensiun negatif", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        pensionContribution: -1,
      }),
    ).toThrow();
  });

  it("menolak iuran pensiun NaN", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        pensionContribution: Number.NaN,
      }),
    ).toThrow();
  });

  it("menolak zakat negatif", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        religiousContribution: -1,
      }),
    ).toThrow();
  });

  it("menolak PPh sebelumnya negatif", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        previousTaxWithheld: -1,
      }),
    ).toThrow();
  });

  it("menolak PPh sebelumnya NaN", () => {
    expect(() =>
      calculateFinalTax({
        ...baseInput,
        previousTaxWithheld:
          Number.NaN,
      }),
    ).toThrow();
  });
});