import {
  describe,
  expect,
  it,
} from "vitest";

import { calculateMonthlyTax } from "@/lib/tax-engine/monthly";

describe("calculateMonthlyTax - golden tests", () => {
  it("GT-001 - TK/0 gross 20 juta menghasilkan PPh 1,8 juta", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji Pokok",
          amount: 8_000_000,
          type: "salary",
          sequence: 1,
        },
        {
          name: "Lembur",
          amount: 2_000_000,
          type: "overtime",
          sequence: 2,
        },
        {
          name: "Bonus",
          amount: 10_000_000,
          type: "bonus",
          sequence: 3,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      20_000_000,
    );
    expect(result.terCategory).toBe("A");
    expect(result.terRate).toBe(0.09);
    expect(result.tax).toBe(1_800_000);
  });

  it("GT-002 - TK/0 gross 10 juta menghasilkan PPh 200 ribu", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji",
          amount: 10_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      10_000_000,
    );
    expect(result.terCategory).toBe("A");
    expect(result.terRate).toBe(0.02);
    expect(result.tax).toBe(200_000);
  });

  it("GT-003 - TK/0 gross 5 juta menghasilkan PPh 0", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji",
          amount: 5_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      5_000_000,
    );
    expect(result.terCategory).toBe("A");
    expect(result.terRate).toBe(0);
    expect(result.tax).toBe(0);
  });

  it("GT-004 - TK/0 gross 25 juta menghasilkan PPh 2,5 juta", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji",
          amount: 25_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      25_000_000,
    );
    expect(result.terCategory).toBe("A");
    expect(result.terRate).toBe(0.10);
    expect(result.tax).toBe(2_500_000);
  });
});

describe("calculateMonthlyTax - TER category", () => {
  it("TK/2 menggunakan TER B", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/2",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji",
          amount: 20_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      20_000_000,
    );
    expect(result.terCategory).toBe("B");
    expect(result.terRate).toBe(0.08);
    expect(result.tax).toBe(1_600_000);
  });

  it("K/3 menggunakan TER C", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "K/3",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji",
          amount: 20_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      20_000_000,
    );
    expect(result.terCategory).toBe("C");
    expect(result.terRate).toBe(0.08);
    expect(result.tax).toBe(1_600_000);
  });
});

describe("calculateMonthlyTax - TER boundary", () => {
  it.each([
    [5_400_000, 0, 0],
    [5_400_001, 0.0025, 13_500],
    [5_650_000, 0.0025, 14_125],
    [5_650_001, 0.005, 28_250],
    [7_500_000, 0.0125, 93_750],
    [7_500_001, 0.015, 112_500],
    [8_550_000, 0.015, 128_250],
    [8_550_001, 0.0175, 149_625],
  ])(
    "gross %s menghasilkan TER %s dan PPh %s",
    (
      gross,
      expectedRate,
      expectedTax,
    ) => {
      const result =
        calculateMonthlyTax({
          profile: {
            taxYear: 2026,
            status: "TK/0",
            month: 9,
            isFinalMonth: false,
          },
          incomeItems: [
            {
              name: "Gaji",
              amount: gross,
              type: "salary",
              sequence: 1,
            },
          ],
        });

      expect(result.terRate).toBe(
        expectedRate,
      );

      expect(result.tax).toBe(
        expectedTax,
      );
    },
  );
});

describe("calculateMonthlyTax - income components", () => {
  it("menggabungkan seluruh komponen penghasilan", () => {
    const result = calculateMonthlyTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },
      incomeItems: [
        {
          name: "Gaji Pokok",
          amount: 7_000_000,
          type: "salary",
          sequence: 1,
        },
        {
          name: "Tunjangan",
          amount: 1_000_000,
          type: "allowance",
          sequence: 2,
        },
        {
          name: "Lembur",
          amount: 1_000_000,
          type: "overtime",
          sequence: 3,
        },
      ],
    });

    expect(result.grossIncome).toBe(
      9_000_000,
    );
    expect(result.terRate).toBe(0.0175);
    expect(result.tax).toBe(157_500);
  });
});

describe("calculateMonthlyTax - validation", () => {
  const baseProfile = {
    taxYear: 2026,
    status: "TK/0" as const,
    month: 9,
    isFinalMonth: false,
  };

  it("menolak bulan 0", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: {
          ...baseProfile,
          month: 0,
        },
        incomeItems: [
          {
            name: "Gaji",
            amount: 10_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("menolak bulan 13", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: {
          ...baseProfile,
          month: 13,
        },
        incomeItems: [
          {
            name: "Gaji",
            amount: 10_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("menolak bulan desimal", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: {
          ...baseProfile,
          month: 9.5,
        },
        incomeItems: [
          {
            name: "Gaji",
            amount: 10_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("menolak income kosong", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: baseProfile,
        incomeItems: [],
      }),
    ).toThrow(
      "Minimal harus ada satu komponen penghasilan.",
    );
  });

  it("menolak income negatif", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: baseProfile,
        incomeItems: [
          {
            name: "Gaji",
            amount: -1,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("menolak NaN", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: baseProfile,
        incomeItems: [
          {
            name: "Gaji",
            amount: Number.NaN,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("menolak Infinity", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: baseProfile,
        incomeItems: [
          {
            name: "Gaji",
            amount:
              Number.POSITIVE_INFINITY,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("tidak boleh digunakan untuk masa pajak final", () => {
    expect(() =>
      calculateMonthlyTax({
        profile: {
          ...baseProfile,
          month: 12,
          isFinalMonth: true,
        },
        incomeItems: [
          {
            name: "Gaji",
            amount: 10_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow(
      "calculateMonthlyTax hanya digunakan untuk masa pajak bukan final.",
    );
  });
});