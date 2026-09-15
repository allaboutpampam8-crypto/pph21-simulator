import { describe, expect, it } from "vitest";

import {
  calculateGrossUpPayments,
} from "@/lib/tax-engine/gross-up-payment";

describe(
  "Gross-Up Payment - Order Comparison",
  () => {
    /**
     * Data dasar:
     *
     * Gaji:
     * Gross-up base       Rp7.493.907
     * Actual allowance    Rp  114.120
     * Actual gross        Rp7.608.027
     *
     * Bonus:
     * Gross               Rp18.124.108
     *
     * Total actual gross:
     * Rp25.732.135
     *
     * Setelah re-gross-up:
     * Adjustment          Rp812.093
     * Bruto Ori           Rp26.544.228
     * TER final           11%
     * Total PPh           Rp2.919.865
     *
     * Catatan:
     * Hasil di bawah merupakan simulasi
     * mekanisme alokasi payroll Gross-Up /
     * Re-Gross-Up, bukan rumus PPh 21
     * statutory per payment.
     */

    it(
      "GT-ORDER-001 - Gaji GROSS_UP → Bonus GROSS",
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
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
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

        const salary = result[0];
        const bonus = result[1];

        // =========================
        // PAYMENT 1 - GAJI
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
        // PAYMENT 2 - BONUS
        // =========================

        expect(
          bonus.cumulativeActualGross,
        ).toBe(25_732_135);

        // TER berdasarkan actual gross
        expect(
          bonus.terRate,
        ).toBe(0.10);

        // Setelah re-gross-up
        // TER menjadi 11%.
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

        // Total PPh akhir dikurangi
        // PPh yang sudah muncul pada gaji.
        expect(
          bonus.paymentTaxImpact,
        ).toBe(2_805_745);

        // Total seluruh payment
        // harus sama dengan PPh kumulatif akhir.
        expect(
          salary.paymentTaxImpact +
            bonus.paymentTaxImpact,
        ).toBe(2_919_865);
      },
    );

    it(
      "GT-ORDER-002 - Bonus GROSS → Gaji GROSS_UP",
      () => {
        const result =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "bonus-1",
                name: "Bonus",
                amount: 18_124_108,
                treatment: "GROSS",
              },

              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_608_027,
                treatment: "GROSS_UP",
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
              },
            ],
          });

        expect(result).toHaveLength(2);

        const bonus = result[0];
        const salary = result[1];

        // =========================
        // PAYMENT 1 - BONUS
        // =========================

        expect(
          bonus.cumulativeActualGross,
        ).toBe(18_124_108);

        // Rp18.124.108 berada pada
        // TER A = 8%.
        expect(
          bonus.terRate,
        ).toBe(0.08);

        expect(
          bonus.finalTerRate,
        ).toBe(0.08);

        expect(
          bonus.cumulativeTax,
        ).toBe(1_449_929);

        expect(
          bonus.paymentTaxImpact,
        ).toBe(1_449_929);

        // =========================
        // PAYMENT 2 - GAJI
        // =========================

        expect(
          salary.cumulativeActualGross,
        ).toBe(25_732_135);

        // Actual gross masih berada
        // pada TER A = 10%.
        expect(
          salary.terRate,
        ).toBe(0.10);

        // Setelah re-gross-up
        // menjadi TER 11%.
        expect(
          salary.finalTerRate,
        ).toBe(0.11);

        expect(
          salary.grossUpAdjustment,
        ).toBe(812_093);

        expect(
          salary.brutoOri,
        ).toBe(26_544_228);

        expect(
          salary.cumulativeTax,
        ).toBe(2_919_865);

        // PPh akhir - PPh bonus sebelumnya.
        expect(
          salary.paymentTaxImpact,
        ).toBe(1_469_936);

        // Total tetap sama.
        expect(
          bonus.paymentTaxImpact +
            salary.paymentTaxImpact,
        ).toBe(2_919_865);
      },
    );

    it(
      "GT-ORDER-003 - total cumulative tax akhir sama walaupun urutan berubah",
      () => {
        const salaryFirst =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_608_027,
                treatment: "GROSS_UP",
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
              },

              {
                id: "bonus-1",
                name: "Bonus",
                amount: 18_124_108,
                treatment: "GROSS",
              },
            ],
          });

        const bonusFirst =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "bonus-1",
                name: "Bonus",
                amount: 18_124_108,
                treatment: "GROSS",
              },

              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_608_027,
                treatment: "GROSS_UP",
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
              },
            ],
          });

        const finalTaxSalaryFirst =
          salaryFirst[
            salaryFirst.length - 1
          ].cumulativeTax;

        const finalTaxBonusFirst =
          bonusFirst[
            bonusFirst.length - 1
          ].cumulativeTax;

        expect(
          finalTaxSalaryFirst,
        ).toBe(2_919_865);

        expect(
          finalTaxBonusFirst,
        ).toBe(2_919_865);

        expect(
          finalTaxSalaryFirst,
        ).toBe(
          finalTaxBonusFirst,
        );
      },
    );

    it(
      "GT-ORDER-004 - urutan mengubah distribusi paymentTaxImpact",
      () => {
        const salaryFirst =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_608_027,
                treatment: "GROSS_UP",
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
              },

              {
                id: "bonus-1",
                name: "Bonus",
                amount: 18_124_108,
                treatment: "GROSS",
              },
            ],
          });

        const bonusFirst =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "bonus-1",
                name: "Bonus",
                amount: 18_124_108,
                treatment: "GROSS",
              },

              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_608_027,
                treatment: "GROSS_UP",
                grossUpBase: 7_493_907,
                actualTaxAllowance: 114_120,
              },
            ],
          });

        // ==================================
        // GROSS-UP → GROSS
        // ==================================

        expect(
          salaryFirst[0]
            .paymentTaxImpact,
        ).toBe(114_120);

        expect(
          salaryFirst[1]
            .paymentTaxImpact,
        ).toBe(2_805_745);

        // ==================================
        // GROSS → GROSS-UP
        // ==================================

        expect(
          bonusFirst[0]
            .paymentTaxImpact,
        ).toBe(1_449_929);

        expect(
          bonusFirst[1]
            .paymentTaxImpact,
        ).toBe(1_469_936);

        // ==================================
        // TOTAL
        // ==================================

        expect(
          salaryFirst[0]
            .paymentTaxImpact +
            salaryFirst[1]
              .paymentTaxImpact,
        ).toBe(2_919_865);

        expect(
          bonusFirst[0]
            .paymentTaxImpact +
            bonusFirst[1]
              .paymentTaxImpact,
        ).toBe(2_919_865);
      },
    );
  },
);