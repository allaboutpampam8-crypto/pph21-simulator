import { describe, expect, it } from "vitest";

import {
  comparePaymentOrder,
} from "@/lib/tax-engine/compare-payment-order";

describe(
  "Compare Payment Order",
  () => {
    const salary = {
      id: "salary-1",
      name: "Gaji",
      amount: 7_608_027,
      treatment: "GROSS_UP" as const,
      grossUpBase: 7_493_907,
      actualTaxAllowance: 114_120,
    };

    const bonus = {
      id: "bonus-1",
      name: "Bonus",
      amount: 18_124_108,
      treatment: "GROSS" as const,
    };

    it(
      "GT-COMPARE-001 - membandingkan Gaji → Bonus dengan Bonus → Gaji",
      () => {
        const result =
          comparePaymentOrder({
            taxYear: 2026,
            category: "A",

            orderA: [
              salary,
              bonus,
            ],

            orderB: [
              bonus,
              salary,
            ],
          });

        expect(
          result.orderA,
        ).toHaveLength(2);

        expect(
          result.orderB,
        ).toHaveLength(2);

        expect(
          result.finalTaxA,
        ).toBe(2_919_865);

        expect(
          result.finalTaxB,
        ).toBe(2_919_865);

        expect(
          result.sameFinalTax,
        ).toBe(true);
      },
    );

    it(
      "GT-COMPARE-002 - total actual gross kedua urutan sama",
      () => {
        const result =
          comparePaymentOrder({
            taxYear: 2026,
            category: "A",

            orderA: [
              salary,
              bonus,
            ],

            orderB: [
              bonus,
              salary,
            ],
          });

        expect(
          result.totalActualGrossA,
        ).toBe(25_732_135);

        expect(
          result.totalActualGrossB,
        ).toBe(25_732_135);

        expect(
          result.sameActualGross,
        ).toBe(true);
      },
    );

    it(
      "GT-COMPARE-003 - distribusi paymentTaxImpact berbeda",
      () => {
        const result =
          comparePaymentOrder({
            taxYear: 2026,
            category: "A",

            orderA: [
              salary,
              bonus,
            ],

            orderB: [
              bonus,
              salary,
            ],
          });

        // Gaji → Bonus
        expect(
          result.orderA[0]
            .paymentTaxImpact,
        ).toBe(114_120);

        expect(
          result.orderA[1]
            .paymentTaxImpact,
        ).toBe(2_805_745);

        // Bonus → Gaji
        expect(
          result.orderB[0]
            .paymentTaxImpact,
        ).toBe(1_449_929);

        expect(
          result.orderB[1]
            .paymentTaxImpact,
        ).toBe(1_469_936);

        // Distribusi berbeda.
        expect(
          result.orderA[0]
            .paymentTaxImpact,
        ).not.toBe(
          result.orderB[0]
            .paymentTaxImpact,
        );
      },
    );

    it(
      "GT-COMPARE-004 - adjustment gross-up hanya muncul ketika diperlukan",
      () => {
        const result =
          comparePaymentOrder({
            taxYear: 2026,
            category: "A",

            orderA: [
              salary,
              bonus,
            ],

            orderB: [
              bonus,
              salary,
            ],
          });

        // Pada kedua urutan,
        // kondisi akhir membutuhkan
        // adjustment Rp812.093.
        expect(
          result.orderA[1]
            .grossUpAdjustment,
        ).toBe(812_093);

        expect(
          result.orderB[1]
            .grossUpAdjustment,
        ).toBe(812_093);
      },
    );

    it(
      "GT-COMPARE-005 - kedua urutan memiliki bruto Ori akhir yang sama",
      () => {
        const result =
          comparePaymentOrder({
            taxYear: 2026,
            category: "A",

            orderA: [
              salary,
              bonus,
            ],

            orderB: [
              bonus,
              salary,
            ],
          });

        expect(
          result.orderA[1].brutoOri,
        ).toBe(26_544_228);

        expect(
          result.orderB[1].brutoOri,
        ).toBe(26_544_228);
      },
    );
  },
);