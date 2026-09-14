import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculatePaymentImpact,
  calculatePaymentImpactForOrder,
} from "@/lib/tax-engine/payment-impact";


describe("calculatePaymentImpact", () => {
  it("GT-IMPACT-001 - menghitung dampak berdasarkan urutan pembayaran", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "A",

      payments: [
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

    expect(result).toHaveLength(3);

    // Gaji: 8 juta × 1,5%
    expect(result[0].cumulativeGross).toBe(
      8_000_000,
    );

    expect(result[0].terRate).toBe(0.015);

    expect(
      result[0].simulatedCumulativeTax,
    ).toBe(120_000);

    expect(result[0].paymentImpact).toBe(
      120_000,
    );

    // Lembur: 10 juta × 2%
    expect(result[1].cumulativeGross).toBe(
      10_000_000,
    );

    expect(result[1].terRate).toBe(0.02);

    expect(
      result[1].simulatedCumulativeTax,
    ).toBe(200_000);

    expect(result[1].paymentImpact).toBe(
      80_000,
    );

    // Bonus: 20 juta × 9%
    expect(result[2].cumulativeGross).toBe(
      20_000_000,
    );

    expect(result[2].terRate).toBe(0.09);

    expect(
      result[2].simulatedCumulativeTax,
    ).toBe(1_800_000);

    expect(result[2].paymentImpact).toBe(
      1_600_000,
    );
  });


  it("GT-IMPACT-002 - urutan pembayaran mengikuti sequence", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          name: "Bonus",
          amount: 10_000_000,
          type: "bonus",
          sequence: 3,
        },
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
      ],
    });

    expect(result[0].paymentName).toBe(
      "Gaji",
    );

    expect(result[1].paymentName).toBe(
      "Lembur",
    );

    expect(result[2].paymentName).toBe(
      "Bonus",
    );
  });


  it("GT-IMPACT-003 - seluruh pembayaran 5 juta menghasilkan simulasi PPh 0", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          name: "Gaji",
          amount: 3_000_000,
          type: "salary",
          sequence: 1,
        },
        {
          name: "Tunjangan",
          amount: 2_000_000,
          type: "allowance",
          sequence: 2,
        },
      ],
    });

    expect(result[0].cumulativeGross).toBe(
      3_000_000,
    );

    expect(
      result[0].simulatedCumulativeTax,
    ).toBe(0);

    expect(result[1].cumulativeGross).toBe(
      5_000_000,
    );

    expect(result[1].terRate).toBe(0);

    expect(
      result[1].simulatedCumulativeTax,
    ).toBe(0);

    expect(result[1].paymentImpact).toBe(
      0,
    );
  });


  it("GT-IMPACT-004 - kategori B menggunakan TER B", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "B",

      payments: [
        {
          name: "Gaji",
          amount: 10_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result[0].terCategory).toBe("B");

    // TER B untuk 10 juta = 1,5%
    expect(result[0].terRate).toBe(0.015);

    expect(
      result[0].simulatedCumulativeTax,
    ).toBe(150_000);
  });


  it("GT-IMPACT-005 - kategori C menggunakan TER C", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "C",

      payments: [
        {
          name: "Gaji",
          amount: 10_000_000,
          type: "salary",
          sequence: 1,
        },
      ],
    });

    expect(result[0].terCategory).toBe("C");

    // TER C untuk 10 juta = 1,5%
    expect(result[0].terRate).toBe(0.015);

    expect(
      result[0].simulatedCumulativeTax,
    ).toBe(150_000);
  });


  it("GT-IMPACT-006 - pembayaran negatif ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2026,
        category: "A",

        payments: [
          {
            name: "Gaji",
            amount: -1_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow();
  });


  it("GT-IMPACT-007 - pembayaran NaN ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2026,
        category: "A",

        payments: [
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


  it("GT-IMPACT-008 - pembayaran Infinity ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2026,
        category: "A",

        payments: [
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


  it("GT-IMPACT-009 - payments kosong ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2026,
        category: "A",
        payments: [],
      }),
    ).toThrow();
  });


  it("GT-IMPACT-010 - tahun pajak non-integer ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2026.5,
        category: "A",

        payments: [
          {
            name: "Gaji",
            amount: 8_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow(
      "Tahun pajak tidak valid.",
    );
  });


  it("GT-IMPACT-011 - tahun pajak yang belum tersedia ditolak", () => {
    expect(() =>
      calculatePaymentImpact({
        taxYear: 2025,
        category: "A",

        payments: [
          {
            name: "Gaji",
            amount: 8_000_000,
            type: "salary",
            sequence: 1,
          },
        ],
      }),
    ).toThrow(
      "Konfigurasi pajak untuk tahun 2025 belum tersedia.",
    );
  });


  it("GT-IMPACT-012 - input payments tidak dimutasi oleh proses sorting", () => {
    const payments = [
      {
        name: "Bonus",
        amount: 10_000_000,
        type: "bonus" as const,
        sequence: 3,
      },
      {
        name: "Gaji",
        amount: 8_000_000,
        type: "salary" as const,
        sequence: 1,
      },
      {
        name: "Lembur",
        amount: 2_000_000,
        type: "overtime" as const,
        sequence: 2,
      },
    ];

    const originalOrder = payments.map(
      (payment) => payment.name,
    );

    calculatePaymentImpact({
      taxYear: 2026,
      category: "A",
      payments,
    });

    expect(
      payments.map(
        (payment) => payment.name,
      ),
    ).toEqual(originalOrder);
  });


  it("GT-IMPACT-013 - payment impact menjadi nol jika TER dan simulated tax tidak berubah", () => {
    const result = calculatePaymentImpact({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          name: "Gaji",
          amount: 3_000_000,
          type: "salary",
          sequence: 1,
        },
        {
          name: "Tunjangan",
          amount: 1_000_000,
          type: "allowance",
          sequence: 2,
        },
      ],
    });

    expect(result[0].terRate).toBe(0);
    expect(result[1].terRate).toBe(0);

    expect(
      result[0].simulatedCumulativeTax,
    ).toBe(0);

    expect(
      result[1].simulatedCumulativeTax,
    ).toBe(0);

    expect(result[1].paymentImpact).toBe(
      0,
    );
  });
});


describe(
  "calculatePaymentImpactForOrder - What If",
  () => {
    const input = {
      taxYear: 2026,
      category: "A" as const,

      payments: [
        {
          name: "Gaji Pokok",
          amount: 8_000_000,
          type: "salary" as const,
          sequence: 1,
        },
        {
          name: "Lembur",
          amount: 2_000_000,
          type: "overtime" as const,
          sequence: 2,
        },
        {
          name: "Bonus",
          amount: 10_000_000,
          type: "bonus" as const,
          sequence: 3,
        },
      ],
    };


    it("GT-IMPACT-014 - menghitung dampak berdasarkan urutan alternatif", () => {
      const alternativeOrder = [
        input.payments[0],
        input.payments[2],
        input.payments[1],
      ];

      const result =
        calculatePaymentImpactForOrder(
          input,
          alternativeOrder,
        );

      expect(result).toHaveLength(3);

      expect(result[0].paymentName).toBe(
        "Gaji Pokok",
      );

      expect(result[1].paymentName).toBe(
        "Bonus",
      );

      expect(result[2].paymentName).toBe(
        "Lembur",
      );

      expect(
        result[0].cumulativeGross,
      ).toBe(8_000_000);

      expect(
        result[1].cumulativeGross,
      ).toBe(18_000_000);

      expect(
        result[2].cumulativeGross,
      ).toBe(20_000_000);
    });


    it("GT-IMPACT-015 - hasil kumulatif akhir tetap sama walaupun urutan berubah", () => {
      const normal =
        calculatePaymentImpact(input);

      const alternative =
        calculatePaymentImpactForOrder(
          input,
          [
            input.payments[0],
            input.payments[2],
            input.payments[1],
          ],
        );

      expect(
        normal[normal.length - 1]
          .simulatedCumulativeTax,
      ).toBe(
        alternative[
          alternative.length - 1
        ].simulatedCumulativeTax,
      );

      expect(
        alternative[
          alternative.length - 1
        ].cumulativeGross,
      ).toBe(20_000_000);

      expect(
        alternative[
          alternative.length - 1
        ].simulatedCumulativeTax,
      ).toBe(1_800_000);
    });


    it("GT-IMPACT-016 - jumlah payment pada order alternatif harus sama", () => {
      expect(() =>
        calculatePaymentImpactForOrder(
          input,
          [
            input.payments[0],
            input.payments[1],
          ],
        ),
      ).toThrow();
    });


    it("GT-IMPACT-017 - order alternatif tidak boleh menggandakan payment dan menghilangkan payment lain", () => {
      expect(() =>
        calculatePaymentImpactForOrder(
          input,
          [
            input.payments[0],
            input.payments[0],
            input.payments[1],
          ],
        ),
      ).toThrow();
    });
  },
);