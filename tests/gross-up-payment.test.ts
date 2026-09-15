import { describe, expect, it } from "vitest";

import {
  calculateGrossUpPayments,
} from "@/lib/tax-engine/gross-up-payment";

describe(
  "Gross-Up Payment Engine - Tahap 2D",
  () => {
    it(
      "GT-RE-GU-001 - Gross-Up → Gross menghasilkan re-gross-up sesuai payroll aktual",
      () => {
        const result =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "salary-1",
                name: "Gaji",

                // Gross-up base + actual tax allowance
                amount: 7_608_027,

                treatment: "GROSS_UP",

                grossUpBase:
                  7_493_907,

                actualTaxAllowance:
                  114_120,
              },

              {
                id: "bonus-1",
                name: "Bonus",

                amount: 18_124_108,

                treatment: "GROSS",
              },
            ],
          });

        expect(result).toHaveLength(2);

        const salary =
          result[0];

        const bonus =
          result[1];

        // =========================
        // SALARY
        // =========================

        expect(
          salary.cumulativeActualGross,
        ).toBe(7_608_027);

        expect(
          salary.terRate,
        ).toBe(0.015);

        expect(
          salary.finalTerRate,
        ).toBe(0.015);

        expect(
          salary.actualTaxAllowance,
        ).toBe(114_120);

        expect(
          salary.oriTaxAllowance,
        ).toBe(114_120);

        expect(
          salary.grossUpAdjustment,
        ).toBe(0);

        expect(
          salary.brutoOri,
        ).toBe(7_608_027);

        expect(
          salary.cumulativeTax,
        ).toBe(114_120);

        expect(
          salary.paymentTaxImpact,
        ).toBe(114_120);

        // =========================
        // BONUS
        // =========================

        expect(
          bonus.cumulativeActualGross,
        ).toBe(25_732_135);

        // TER berdasarkan actual gross
        expect(
          bonus.terRate,
        ).toBe(0.10);

        // Setelah re-gross-up
        // menjadi TER 11%.
        expect(
          bonus.finalTerRate,
        ).toBe(0.11);

        expect(
          bonus.oriTaxAllowance,
        ).toBe(926_213);

        expect(
          bonus.grossUpAdjustment,
        ).toBe(812_093);

        expect(
          bonus.brutoOri,
        ).toBe(26_544_228);

        expect(
          bonus.cumulativeTax,
        ).toBe(2_919_865);

        // Total PPh dikurangi PPh
        // yang sudah muncul pada salary.
        expect(
          bonus.paymentTaxImpact,
        ).toBe(2_805_745);
      },
    );

    it(
      "GT-RE-GU-002 - Gross → Gross-Up tidak menghasilkan adjustment jika TER sudah sesuai",
      () => {
        const result =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "bonus-1",
                name: "Bonus",

                amount: 13_468_647,

                treatment: "GROSS",
              },

              {
                id: "salary-1",
                name: "Gaji",

                // Base + tax allowance
                amount: 7_103_195,

                treatment: "GROSS_UP",

                grossUpBase:
                  6_463_907,

                actualTaxAllowance:
                  639_288,
              },
            ],
          });

        expect(result).toHaveLength(2);

        const bonus =
          result[0];

        const salary =
          result[1];

        // =========================
        // BONUS
        // =========================

        expect(
          bonus.cumulativeActualGross,
        ).toBe(13_468_647);

        expect(
          bonus.terRate,
        ).toBe(0.05);

        expect(
          bonus.cumulativeTax,
        ).toBe(673_432);

        expect(
          bonus.paymentTaxImpact,
        ).toBe(673_432);

        // =========================
        // SALARY GROSS-UP
        // =========================

        expect(
          salary.cumulativeActualGross,
        ).toBe(20_571_842);

        expect(
          salary.terRate,
        ).toBe(0.09);

        expect(
          salary.finalTerRate,
        ).toBe(0.09);

        expect(
          salary.actualTaxAllowance,
        ).toBe(639_288);

        expect(
          salary.oriTaxAllowance,
        ).toBe(639_288);

        expect(
          salary.grossUpAdjustment,
        ).toBe(0);

        expect(
          salary.brutoOri,
        ).toBe(20_571_842);

        expect(
          salary.cumulativeTax,
        ).toBe(1_851_466);

        expect(
          salary.paymentTaxImpact,
        ).toBe(1_178_034);
      },
    );

    it(
      "GT-RE-GU-003 - Gross-Up → Gross tanpa perubahan TER tidak menghasilkan adjustment",
      () => {
        const result =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "salary-1",
                name: "Gaji",

                amount: 7_608_027,

                treatment: "GROSS_UP",

                grossUpBase:
                  7_493_907,

                actualTaxAllowance:
                  114_120,
              },

              {
                id: "bonus-1",
                name: "Bonus",

                amount: 100_000,

                treatment: "GROSS",
              },
            ],
          });

        expect(result).toHaveLength(2);

        const salary =
          result[0];

        const bonus =
          result[1];

        expect(
          salary.grossUpAdjustment,
        ).toBe(0);

        expect(
          salary.finalTerRate,
        ).toBe(0.015);

        expect(
          bonus.cumulativeActualGross,
        ).toBe(7_708_027);

        expect(
          bonus.terRate,
        ).toBe(0.015);

        expect(
          bonus.finalTerRate,
        ).toBe(0.015);

        expect(
          bonus.grossUpAdjustment,
        ).toBe(0);

        expect(
          bonus.brutoOri,
        ).toBe(7_708_027);
      },
    );

    it(
      "GT-RE-GU-004 - adjustment gross-up dapat mendorong bruto ke bracket berikutnya",
      () => {
        const result =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "payment-1",
                name: "Gross-Up",

                amount: 26_300_000,

                treatment: "GROSS_UP",

                grossUpBase:
                  24_000_000,

                actualTaxAllowance:
                  2_400_000,
              },
            ],
          });

        expect(result).toHaveLength(1);

        const payment =
          result[0];

        expect(
          payment.terRate,
        ).toBe(0.10);

        expect(
          payment.finalTerRate,
        ).toBe(0.11);

        expect(
          payment.oriTaxAllowance,
        ).toBe(2_966_292);

        expect(
          payment.grossUpAdjustment,
        ).toBe(566_292);

        expect(
          payment.brutoOri,
        ).toBe(26_866_292);

        expect(
          payment.cumulativeTax,
        ).toBe(2_955_292);
      },
    );

    it(
      "GT-RE-GU-005 - payment GROSS tidak boleh memiliki data gross-up",
      () => {
        expect(() =>
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "invalid-1",
                name: "Bonus",

                amount: 10_000_000,

                treatment: "GROSS",

                grossUpBase:
                  5_000_000,
              },
            ],
          }),
        ).toThrow(
          /tidak boleh memiliki gross-up base/i,
        );
      },
    );

    it(
      "GT-RE-GU-006 - GROSS_UP wajib memiliki gross-up base dan actual allowance",
      () => {
        expect(() =>
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "invalid-2",
                name: "Gaji",

                amount: 7_608_027,

                treatment: "GROSS_UP",
              },
            ],
          }),
        ).toThrow(
          /gross-up base.*wajib diisi/i,
        );
      },
    );
  },
);