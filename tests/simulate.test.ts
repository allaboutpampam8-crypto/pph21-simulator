import { describe, expect, it } from "vitest";

import { simulateTax } from "@/lib/tax-engine";

describe("simulateTax - monthly", () => {
  it("GT-SIM-001 - menghitung monthly tax melalui satu pintu engine", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },

      incomeItems: [
        {
          name: "Gaji",
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

    expect(result.grossIncome).toBe(20_000_000);

    expect(result.monthly).toBeDefined();

    expect(result.monthly?.terCategory).toBe("A");

    expect(result.monthly?.terRate).toBe(0.09);

    expect(result.monthly?.tax).toBe(1_800_000);

    expect(result.final).toBeUndefined();
    expect(result.partYear).toBeUndefined();
  });

  it("GT-SIM-002 - tidak menghitung Payment Impact secara default", () => {
    const result = simulateTax({
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

    expect(result.paymentImpact).toBeUndefined();
  });

  it("GT-SIM-003 - mengikutsertakan Payment Impact jika diminta", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 9,
          isFinalMonth: false,
        },

        incomeItems: [
          {
            name: "Gaji",
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
      },
      {
        includePaymentImpact: true,
      },
    );

    expect(result.paymentImpact).toHaveLength(3);

    expect(result.paymentImpact?.[0].paymentImpact).toBe(120_000);

    expect(result.paymentImpact?.[1].paymentImpact).toBe(80_000);

    expect(result.paymentImpact?.[2].paymentImpact).toBe(1_600_000);
  });

  it("GT-SIM-004 - status TK/2 menggunakan kategori TER B", () => {
    const result = simulateTax({
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

    expect(result.monthly?.terCategory).toBe("B");

    expect(result.monthly?.terRate).toBe(0.08);

    expect(result.monthly?.tax).toBe(1_600_000);
  });

  it("GT-SIM-005 - status K/3 menggunakan kategori TER C", () => {
    const result = simulateTax({
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

    expect(result.monthly?.terCategory).toBe("C");

    expect(result.monthly?.terRate).toBe(0.08);

    expect(result.monthly?.tax).toBe(1_600_000);
  });

  it("GT-SIM-006 - previousTaxWithheld tidak memengaruhi monthly tax", () => {
    const withoutPrevious = simulateTax({
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

    const withPrevious = simulateTax(
      {
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
      },
      {
        previousTaxWithheld: 5_000_000,
      },
    );

    expect(withoutPrevious.monthly?.tax).toBe(withPrevious.monthly?.tax);

    expect(withPrevious.monthly?.tax).toBe(200_000);
  });
});

describe("simulateTax - final", () => {
  it("GT-SIM-007 - menggunakan Final Tax Engine untuk full year", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,

          monthsWorked: 12,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 20_000_000,
            type: "salary",
            sequence: 1,
          },
        ],

      finalGrossIncome: 240_000_000,
      },
      {
        previousTaxWithheld: 14_000_000,
      },
    );

    expect(result.grossIncome).toBe(20_000_000);

    expect(result.monthly).toBeUndefined();

    expect(result.partYear).toBeUndefined();

    expect(result.final).toBeDefined();

    expect(result.final?.annualTax).toBe(21_000_000);

    expect(result.final?.finalTax).toBe(7_000_000);

    expect(result.final?.overpayment).toBe(0);
  });

  it("GT-SIM-008 - previous withholding lebih besar menghasilkan overpayment", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,

          monthsWorked: 12,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 20_000_000,
            type: "salary",
            sequence: 1,
          },
        ],

      finalGrossIncome: 240_000_000,
      },
      {
        previousTaxWithheld: 22_000_000,
      },
    );

    expect(result.final?.annualTax).toBe(21_000_000);

    expect(result.final?.finalTax).toBe(0);

    expect(result.final?.overpayment).toBe(1_000_000);
  });

  it("GT-SIM-009 - previous withholding sama dengan pajak menghasilkan final tax 0", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,

          monthsWorked: 12,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 20_000_000,
            type: "salary",
            sequence: 1,
          },
        ],

      finalGrossIncome: 240_000_000,
      },
      {
        previousTaxWithheld: 21_000_000,
      },
    );

    expect(result.final?.annualTax).toBe(21_000_000);

    expect(result.final?.finalTax).toBe(0);

    expect(result.final?.overpayment).toBe(0);
  });

  it("GT-SIM-010 - full year tetap menggunakan Final Engine ketika monthsWorked tidak diberikan", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 240_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      },
      {
        previousTaxWithheld: 14_000_000,
      },
    );

    expect(result.partYear).toBeUndefined();

    expect(result.final).toBeDefined();

    expect(result.final?.annualTax).toBe(21_000_000);

    expect(result.final?.finalTax).toBe(7_000_000);
  });

  it("GT-SIM-011 - meneruskan iuran pensiun dan zakat ke Final Engine", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,

          monthsWorked: 12,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 20_000_000,
            type: "salary",
            sequence: 1,
          },
        ],

      finalGrossIncome: 240_000_000,

        pensionContribution: 1_000_000,
        religiousContribution: 1_000_000,
      },
      {
        previousTaxWithheld: 0,
      },
    );

    expect(result.final?.pensionContribution).toBe(1_000_000);

    expect(result.final?.religiousContribution).toBe(1_000_000);

    expect(result.final?.netIncome).toBe(232_000_000);
  });
});

describe("simulateTax - part year", () => {
  it("GT-SIM-012 - menggunakan Part-Year Engine untuk final month kurang dari 12 bulan", () => {
    const result = simulateTax(
      {
        profile: {
          taxYear: 2026,
          status: "TK/0",
          month: 12,
          isFinalMonth: true,

          monthsWorked: 4,
          taxSubjectStartedMidYear: true,
        },

        incomeItems: [
          {
            name: "Gaji",
            amount: 15_500_000,
            type: "salary",
            sequence: 1,
          },
        ],

      finalGrossIncome: 62_000_000,

        religiousContribution: 3_100_000,
      },
      {
        previousTaxWithheld: 3_255_000,
      },
    );

    expect(result.grossIncome).toBe(15_500_000);

    expect(result.final).toBeUndefined();

    expect(result.partYear).toBeDefined();

    expect(result.partYear?.annualizedNetIncome).toBe(170_700_000);

    expect(result.partYear?.annualTax).toBe(11_505_000);

    expect(result.partYear?.proratedTax).toBe(3_835_000);

    expect(result.partYear?.finalTax).toBe(580_000);
  });

  it("GT-SIM-013 - part year tanpa annualisasi meneruskan flag dengan benar", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 12,
        isFinalMonth: true,

        monthsWorked: 4,
        taxSubjectStartedMidYear: false,
      },

      incomeItems: [
        {
          name: "Gaji",
          amount: 15_500_000,
          type: "salary",
          sequence: 1,
        },
      ],

      finalGrossIncome: 62_000_000,
    });

    expect(result.final).toBeUndefined();

    expect(result.partYear).toBeDefined();

    expect(result.partYear?.annualizedNetIncome).toBe(60_000_000);

    expect(result.partYear?.annualTax).toBe(300_000);

    expect(result.partYear?.proratedTax).toBe(300_000);
  });

  it("GT-SIM-014 - part year meneruskan iuran pensiun dan zakat", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 12,
        isFinalMonth: true,

        monthsWorked: 4,
        taxSubjectStartedMidYear: false,
      },

      incomeItems: [
        {
          name: "Gaji",
          amount: 15_500_000,
          type: "salary",
          sequence: 1,
        },
      ],

      finalGrossIncome: 62_000_000,

      pensionContribution: 400_000,
      religiousContribution: 3_100_000,
    });

    expect(result.partYear?.pensionContribution).toBe(400_000);

    expect(result.partYear?.religiousContribution).toBe(3_100_000);

    expect(result.partYear?.netIncome).toBe(56_500_000);
  });
});

describe("simulateTax - routing", () => {
  it("GT-SIM-015 - masa bukan final selalu menggunakan monthly engine", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 12,
        isFinalMonth: false,

        monthsWorked: 12,
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

    expect(result.monthly).toBeDefined();
    expect(result.final).toBeUndefined();
    expect(result.partYear).toBeUndefined();

    expect(result.monthly?.tax).toBe(1_800_000);
  });

  it("GT-SIM-016 - final month dengan 4 bulan bekerja selalu menggunakan Part-Year Engine", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 12,
        isFinalMonth: true,

        monthsWorked: 4,
        taxSubjectStartedMidYear: false,
      },

      incomeItems: [
        {
          name: "Gaji",
          amount: 15_000_000,
          type: "salary",
          sequence: 1,
        },
      ],

      finalGrossIncome: 60_000_000,
    });

    expect(result.monthly).toBeUndefined();
    expect(result.final).toBeUndefined();
    expect(result.partYear).toBeDefined();
  });

  it("GT-SIM-017 - final month dengan 12 bulan bekerja menggunakan Final Engine", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 12,
        isFinalMonth: true,

        monthsWorked: 12,
      },

      incomeItems: [
        {
          name: "Gaji",
          amount: 20_000_000,
          type: "salary",
          sequence: 1,
        },
      ],

      finalGrossIncome: 240_000_000,
    });

    expect(result.monthly).toBeUndefined();
    expect(result.partYear).toBeUndefined();
    expect(result.final).toBeDefined();
  });
});

describe("simulateTax - edge cases", () => {
  it("GT-SIM-018 - gross income 0 menghasilkan monthly tax 0", () => {
    const result = simulateTax({
      profile: {
        taxYear: 2026,
        status: "TK/0",
        month: 9,
        isFinalMonth: false,
      },

      incomeItems: [
        {
          name: "Gaji",
          amount: 0,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result.grossIncome).toBe(0);

    expect(result.monthly?.terRate).toBe(0);

    expect(result.monthly?.tax).toBe(0);
  });
});
