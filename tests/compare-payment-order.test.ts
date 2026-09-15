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

      // GROSS_UP:
      // amount = penghasilan sebelum
      // tambahan tunjangan PPh.
      amount: 7_493_907,

      treatment: "GROSS_UP" as const,
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

        /*
         * Gaji → Bonus:
         * Gross-Up Gaji terbentuk lebih dahulu
         * pada TER 1,5%, kemudian bonus mendorong
         * re-gross-up ke TER 11%.
         */
        expect(
          result.finalTaxA,
        ).toBe(2_919_865);

        /*
         * Bonus → Gaji:
         * Gaji Gross-Up diproses setelah bonus,
         * sehingga kondisi Gross-Up-nya berbeda.
         *
         * Engine saat ini menghasilkan Bruto Ori
         * akhir yang sama dengan order A.
         */
        expect(
          result.finalTaxB,
        ).toBe(2_919_865);

        expect(
          result.sameFinalTax,
        ).toBe(true);
      },
    );

    it(
      "GT-COMPARE-002 - total actual gross kedua urutan dapat berbeda karena posisi Gross-Up berbeda",
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

        /*
         * Gaji → Bonus
         *
         * Gaji:
         * 7.493.907 + 114.120
         * = 7.608.027
         *
         * + Bonus 18.124.108
         * = 25.732.135
         */
        expect(
          result.totalActualGrossA,
        ).toBe(25_732_135);

        /*
         * Bonus → Gaji
         *
         * Gaji diproses setelah bonus sehingga
         * Gross-Up allowance yang terbentuk
         * berbeda.
         */
        expect(
          result.totalActualGrossB,
        ).toBe(26_544_228);

        expect(
          result.sameActualGross,
        ).toBe(false);
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

        // =========================
        // Gaji → Bonus
        // =========================

        expect(
          result.orderA[0]
            .paymentTaxImpact,
        ).toBe(114_120);

        expect(
          result.orderA[1]
            .paymentTaxImpact,
        ).toBe(2_805_745);

        // =========================
        // Bonus → Gaji
        // =========================

        expect(
          result.orderB[0]
            .paymentTaxImpact,
        ).toBe(1_449_929);

        expect(
          result.orderB[1]
            .paymentTaxImpact,
        ).toBe(1_469_936);

        /*
         * Posisi payment berbeda sehingga
         * distribusi dampak PPh juga berbeda.
         */
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

        /*
         * Gaji → Bonus:
         * adjustment muncul pada Bonus karena
         * akumulasi gross mendorong TER.
         */
        expect(
          result.orderA[1]
            .grossUpAdjustment,
        ).toBe(812_093);

        /*
         * Bonus → Gaji:
         * Gaji Gross-Up sudah dihitung pada posisi
         * yang berbeda sehingga tidak menggunakan
         * adjustment yang sama seperti order A.
         */
        expect(
          result.orderB[1]
            .grossUpAdjustment,
        ).toBe(0);
      },
    );

    it(
      "GT-COMPARE-005 - bruto Ori akhir mencerminkan hasil masing-masing urutan",
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

        /*
         * Gaji → Bonus
         */
        expect(
          result.orderA[1].brutoOri,
        ).toBe(26_544_228);

        /*
         * Bonus → Gaji
         *
         * Gross-Up salary diproses pada posisi
         * setelah bonus.
         */
        expect(
          result.orderB[1].brutoOri,
        ).toBe(26_544_228);
      },
    );
  },
);