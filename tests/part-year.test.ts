import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculatePartYearTax,
} from "@/lib/tax-engine";

describe("calculatePartYearTax - golden tests", () => {
  it("GT-PY-001 - masuk September tetapi kewajiban pajak sudah ada sejak Januari", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 62_000_000,

      pensionContribution: 400_000,
      religiousContribution: 0,

      previousTaxWithheld: 3_255_000,
    });

    expect(result.grossIncome).toBe(
      62_000_000,
    );

    expect(result.jobExpense).toBe(
      2_000_000,
    );

    expect(result.netIncome).toBe(
      59_600_000,
    );

    expect(result.annualizedNetIncome).toBe(
      59_600_000,
    );

    expect(result.ptkp).toBe(
      54_000_000,
    );

    expect(result.taxableIncome).toBe(
      5_600_000,
    );

    expect(result.annualTax).toBe(
      280_000,
    );

    expect(result.proratedTax).toBe(
      280_000,
    );

    expect(result.finalTax).toBe(0);

    expect(result.overpayment).toBe(
      2_975_000,
    );
  });
});


describe("calculatePartYearTax - annualisasi", () => {
  it("tanpa annualisasi menggunakan penghasilan aktual", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    // 60 juta - 2 juta biaya jabatan
    // = 58 juta neto
    expect(result.netIncome).toBe(
      58_000_000,
    );

    expect(result.annualizedNetIncome).toBe(
      58_000_000,
    );

    // 58 juta - 54 juta PTKP
    // = 4 juta PKP
    expect(result.taxableIncome).toBe(
      4_000_000,
    );

    expect(result.annualTax).toBe(
      200_000,
    );

    expect(result.proratedTax).toBe(
      200_000,
    );
  });


  it("dengan annualisasi menggunakan penghasilan neto × 12 / bulan bekerja", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: true,

      grossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    // 60 juta - 2 juta biaya jabatan
    // = 58 juta neto

    // 58 juta × 12 / 4
    // = 174 juta
    expect(result.netIncome).toBe(
      58_000_000,
    );

    expect(result.annualizedNetIncome).toBe(
      174_000_000,
    );

    // 174 juta - 54 juta
    // = 120 juta PKP
    expect(result.taxableIncome).toBe(
      120_000_000,
    );

    // 60 juta × 5% = 3 juta
    // 190 juta × 15% = 9 juta
    // total = 12 juta
    expect(result.annualTax).toBe(
      12_000_000,
    );

    // 12 juta × 4 / 12
    // = 4 juta
    expect(result.proratedTax).toBe(
      4_000_000,
    );
  });
});


describe("calculatePartYearTax - biaya jabatan", () => {
  it("biaya jabatan maksimal Rp500 ribu per bulan bekerja", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 100_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.jobExpense).toBe(
      2_000_000,
    );
  });


  it("biaya jabatan tetap 5% jika belum mencapai batas maksimum", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 20_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.jobExpense).toBe(
      1_000_000,
    );
  });
});


describe("calculatePartYearTax - PTKP dan status", () => {
  it("K/3 menggunakan PTKP Rp72 juta", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "K/3",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 60_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.ptkp).toBe(
      72_000_000,
    );

    expect(result.taxableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
  });


  it("penghasilan yang belum melewati PTKP menghasilkan PPh 0", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 56_000_000,

      previousTaxWithheld: 0,
    });

    expect(result.taxableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
    expect(result.proratedTax).toBe(0);
    expect(result.finalTax).toBe(0);
  });
});


describe("calculatePartYearTax - deductions", () => {
  it("mengurangi penghasilan dengan iuran pensiun", () => {
    const withoutPension =
      calculatePartYearTax({
        taxYear: 2026,
        status: "TK/0",
        monthsWorked: 4,

        taxSubjectStartedMidYear: false,

        grossIncome: 62_000_000,

        pensionContribution: 0,
        religiousContribution: 0,

        previousTaxWithheld: 0,
      });

    const withPension =
      calculatePartYearTax({
        taxYear: 2026,
        status: "TK/0",
        monthsWorked: 4,

        taxSubjectStartedMidYear: false,

        grossIncome: 62_000_000,

        pensionContribution: 400_000,
        religiousContribution: 0,

        previousTaxWithheld: 0,
      });

    expect(withPension.netIncome).toBe(
      withoutPension.netIncome -
        400_000,
    );
  });


  it("mengurangi penghasilan dengan zakat/sumbangan keagamaan", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 62_000_000,

      pensionContribution: 0,
      religiousContribution: 3_100_000,

      previousTaxWithheld: 0,
    });

    expect(result.religiousContribution).toBe(
      3_100_000,
    );

    expect(result.netIncome).toBe(
      56_900_000,
    );
  });
});


describe("calculatePartYearTax - final tax dan overpayment", () => {
  it("previous withholding lebih kecil dari pajak menghasilkan final tax", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 62_000_000,

      previousTaxWithheld: 100_000,
    });

    expect(result.proratedTax).toBe(
      300_000,
    );

    expect(result.finalTax).toBe(
      200_000,
    );

    expect(result.overpayment).toBe(0);
  });


  it("previous withholding sama dengan pajak menghasilkan final tax 0", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 62_000_000,

      previousTaxWithheld: 300_000,
    });

    expect(result.proratedTax).toBe(
      300_000,
    );

    expect(result.finalTax).toBe(0);

    expect(result.overpayment).toBe(0);
  });


  it("previous withholding lebih besar menghasilkan overpayment", () => {
    const result = calculatePartYearTax({
      taxYear: 2026,
      status: "TK/0",
      monthsWorked: 4,

      taxSubjectStartedMidYear: false,

      grossIncome: 62_000_000,

      previousTaxWithheld: 1_000_000,
    });

    expect(result.proratedTax).toBe(
      300_000,
    );

    expect(result.finalTax).toBe(0);

    expect(result.overpayment).toBe(
      700_000,
    );
  });
});


describe("calculatePartYearTax - validation", () => {
  const baseInput = {
    taxYear: 2026,
    status: "TK/0" as const,
    monthsWorked: 4,
    taxSubjectStartedMidYear: false,
    grossIncome: 62_000_000,
    previousTaxWithheld: 0,
  };


  it("menolak tahun pajak non-integer", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        taxYear: 2026.5,
      }),
    ).toThrow(
      "Tahun pajak tidak valid.",
    );
  });


  it("menolak tahun pajak yang belum tersedia", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        taxYear: 2025,
      }),
    ).toThrow(
      "Konfigurasi pajak untuk tahun 2025 belum tersedia.",
    );
  });


  it("menolak monthsWorked 0", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        monthsWorked: 0,
      }),
    ).toThrow();
  });


  it("menolak monthsWorked 13", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        monthsWorked: 13,
      }),
    ).toThrow();
  });


  it("menolak monthsWorked desimal", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        monthsWorked: 4.5,
      }),
    ).toThrow();
  });


  it("menolak gross negatif", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        grossIncome: -1,
      }),
    ).toThrow();
  });


  it("menolak gross NaN", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        grossIncome: Number.NaN,
      }),
    ).toThrow();
  });


  it("menolak gross Infinity", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        grossIncome:
          Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
  });


  it("menolak iuran pensiun negatif", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        pensionContribution: -1,
      }),
    ).toThrow();
  });


  it("menolak iuran pensiun NaN", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        pensionContribution: Number.NaN,
      }),
    ).toThrow();
  });


  it("menolak zakat negatif", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        religiousContribution: -1,
      }),
    ).toThrow();
  });


  it("menolak zakat Infinity", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        religiousContribution:
          Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
  });


  it("menolak previous withholding negatif", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        previousTaxWithheld: -1,
      }),
    ).toThrow();
  });


  it("menolak previous withholding NaN", () => {
    expect(() =>
      calculatePartYearTax({
        ...baseInput,
        previousTaxWithheld:
          Number.NaN,
      }),
    ).toThrow();
  });
});