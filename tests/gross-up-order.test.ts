import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateGrossUpPayments,
} from "@/lib/tax-engine/gross-up-payment";

describe(
  "Gross-Up Payment - Order Comparison",
  () => {
    /**
     * Data dasar:
     *
     * Gaji GROSS_UP:
     * Base sebelum tunjangan PPh = Rp7.493.907
     *
     * Jika dibayarkan lebih dahulu:
     * Allowance = Rp114.120
     * Gross     = Rp7.608.027
     *
     * Bonus GROSS:
     * Rp18.124.108
     *
     * ========================================
     * URUTAN 1
     * Gaji GROSS_UP → Bonus GROSS
     * ========================================
     *
     * Total actual gross:
     * Rp25.732.135
     *
     * Setelah Re-Gross-Up:
     * Adjustment = Rp812.093
     * Bruto Ori  = Rp26.544.228
     * TER final  = 11%
     * Total PPh  = Rp2.919.865
     *
     * ========================================
     * URUTAN 2
     * Bonus GROSS → Gaji GROSS_UP
     * ========================================
     *
     * Bonus diproses terlebih dahulu.
     *
     * Ketika Gaji GROSS_UP diproses,
     * engine langsung menghitung allowance
     * berdasarkan kondisi kumulatif setelah Bonus.
     *
     * Base GROSS_UP:
     * Rp7.493.907
     *
     * Allowance:
     * Rp926.213
     *
     * Gross Gaji:
     * Rp8.420.120
     *
     * Total actual gross:
     * Rp26.544.228
     *
     * TER:
     * 11%
     *
     * Total PPh:
     * Rp2.919.865
     *
     * Catatan:
     * Hasil final PPh sama, tetapi distribusi
     * paymentTaxImpact berbeda karena urutan
     * payment berbeda.
     *
     * Catatan penting:
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

                /**
                 * Untuk GROSS_UP:
                 *
                 * amount = penghasilan sebelum
                 * tunjangan PPh.
                 *
                 * Tunjangan PPh dihitung otomatis
                 * oleh engine.
                 */
                amount: 7_493_907,

                treatment: "GROSS_UP",
              },

              {
                id: "bonus-1",
                name: "Bonus",

                /**
                 * Bonus sudah merupakan bruto.
                 */
                amount: 18_124_108,

                treatment: "GROSS",
              },
            ],
          });

        expect(
          result,
        ).toHaveLength(2);

        const salary =
          result[0];

        const bonus =
          result[1];

        // =========================
        // PAYMENT 1 - GAJI
        // =========================

        /**
         * Base:
         * Rp7.493.907
         *
         * Gross-Up menghasilkan:
         * Allowance = Rp114.120
         *
         * Gross:
         * Rp7.608.027
         */

        expect(
          salary.cumulativeActualGross,
        ).toBe(
          7_608_027,
        );

        expect(
          salary.terRate,
        ).toBe(
          0.015,
        );

        expect(
          salary.finalTerRate,
        ).toBe(
          0.015,
        );

        expect(
          salary.actualTaxAllowance,
        ).toBe(
          114_120,
        );

        expect(
          salary.grossUpBase,
        ).toBe(
          7_493_907,
        );

        expect(
          salary.oriTaxAllowance,
        ).toBe(
          114_120,
        );

        expect(
          salary.grossUpAdjustment,
        ).toBe(
          0,
        );

        expect(
          salary.brutoOri,
        ).toBe(
          7_608_027,
        );

        expect(
          salary.cumulativeTax,
        ).toBe(
          114_120,
        );

        expect(
          salary.paymentTaxImpact,
        ).toBe(
          114_120,
        );

        // =========================
        // PAYMENT 2 - BONUS
        // =========================

        /**
         * Actual gross:
         *
         * 7.608.027
         * + 18.124.108
         * = 25.732.135
         */

        expect(
          bonus.cumulativeActualGross,
        ).toBe(
          25_732_135,
        );

        /**
         * TER berdasarkan actual gross:
         *
         * Rp25.732.135 → 10%
         */

        expect(
          bonus.terRate,
        ).toBe(
          0.10,
        );

        /**
         * Setelah Re-Gross-Up:
         *
         * TER final → 11%
         */

        expect(
          bonus.finalTerRate,
        ).toBe(
          0.11,
        );

        /**
         * Kebutuhan allowance:
         *
         * Rp7.493.907 × 11% / 89%
         * = Rp926.213
         */

        expect(
          bonus.oriTaxAllowance,
        ).toBe(
          926_213,
        );

        /**
         * Allowance aktual:
         * Rp114.120
         *
         * Adjustment:
         *
         * Rp926.213 - Rp114.120
         * = Rp812.093
         */

        expect(
          bonus.grossUpAdjustment,
        ).toBe(
          812_093,
        );

        expect(
          bonus.brutoOri,
        ).toBe(
          26_544_228,
        );

        expect(
          bonus.cumulativeTax,
        ).toBe(
          2_919_865,
        );

        /**
         * PPh payment ini:
         *
         * Rp2.919.865
         * - Rp114.120
         * = Rp2.805.745
         */

        expect(
          bonus.paymentTaxImpact,
        ).toBe(
          2_805_745,
        );

        /**
         * Total seluruh payment:
         *
         * Rp114.120
         * + Rp2.805.745
         * = Rp2.919.865
         */

        expect(
          salary.paymentTaxImpact +
            bonus.paymentTaxImpact,
        ).toBe(
          2_919_865,
        );
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

                /**
                 * GROSS_UP:
                 *
                 * amount tetap merupakan
                 * penghasilan sebelum
                 * tunjangan PPh.
                 */
                amount: 7_493_907,

                treatment: "GROSS_UP",
              },
            ],
          });

        expect(
          result,
        ).toHaveLength(2);

        const bonus =
          result[0];

        const salary =
          result[1];

        // =========================
        // PAYMENT 1 - BONUS
        // =========================

        expect(
          bonus.cumulativeActualGross,
        ).toBe(
          18_124_108,
        );

        /**
         * Rp18.124.108
         * → TER A 8%
         */

        expect(
          bonus.terRate,
        ).toBe(
          0.08,
        );

        expect(
          bonus.finalTerRate,
        ).toBe(
          0.08,
        );

        expect(
          bonus.cumulativeTax,
        ).toBe(
          1_449_929,
        );

        expect(
          bonus.paymentTaxImpact,
        ).toBe(
          1_449_929,
        );

        // =========================
        // PAYMENT 2 - GAJI
        // =========================

        /**
         * Gaji:
         *
         * Base = Rp7.493.907
         *
         * Karena Bonus sudah dibayarkan
         * sebelumnya, Gross-Up Gaji dihitung
         * pada kondisi kumulatif tersebut.
         *
         * Allowance = Rp926.213
         *
         * Gross Gaji:
         *
         * Rp7.493.907
         * + Rp926.213
         * = Rp8.420.120
         *
         * Total:
         *
         * Rp18.124.108
         * + Rp8.420.120
         * = Rp26.544.228
         */

        expect(
          salary.cumulativeActualGross,
        ).toBe(
          26_544_228,
        );

        /**
         * Actual cumulative gross:
         *
         * Rp26.544.228
         * → TER 11%
         */

        expect(
          salary.terRate,
        ).toBe(
          0.11,
        );

        expect(
          salary.finalTerRate,
        ).toBe(
          0.11,
        );

        /**
         * Karena GROSS_UP langsung dihitung
         * berdasarkan kondisi final setelah Bonus,
         * allowance aktual sudah sesuai kebutuhan.
         */

        expect(
          salary.actualTaxAllowance,
        ).toBe(
          926_213,
        );

        expect(
          salary.grossUpBase,
        ).toBe(
          7_493_907,
        );

        expect(
          salary.oriTaxAllowance,
        ).toBe(
          926_213,
        );

        expect(
          salary.grossUpAdjustment,
        ).toBe(
          0,
        );

        expect(
          salary.brutoOri,
        ).toBe(
          26_544_228,
        );

        expect(
          salary.cumulativeTax,
        ).toBe(
          2_919_865,
        );

        /**
         * PPh payment ini:
         *
         * Rp2.919.865
         * - Rp1.449.929
         * = Rp1.469.936
         */

        expect(
          salary.paymentTaxImpact,
        ).toBe(
          1_469_936,
        );

        /**
         * Total:
         *
         * Rp1.449.929
         * + Rp1.469.936
         * = Rp2.919.865
         */

        expect(
          bonus.paymentTaxImpact +
            salary.paymentTaxImpact,
        ).toBe(
          2_919_865,
        );
      },
    );

    it(
      "GT-ORDER-003 - PPh kumulatif akhir sama walaupun urutan pembayaran berubah",
      () => {
        const salaryFirst =
          calculateGrossUpPayments({
            taxYear: 2026,
            category: "A",

            payments: [
              {
                id: "salary-1",
                name: "Gaji",
                amount: 7_493_907,
                treatment: "GROSS_UP",
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
                amount: 7_493_907,
                treatment: "GROSS_UP",
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

        /**
         * Walaupun urutan payment berbeda,
         * total PPh kumulatif akhir tetap
         * Rp2.919.865.
         *
         * Yang berubah adalah distribusi
         * paymentTaxImpact.
         */

        expect(
          finalTaxSalaryFirst,
        ).toBe(
          2_919_865,
        );

        expect(
          finalTaxBonusFirst,
        ).toBe(
          2_919_865,
        );

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
                amount: 7_493_907,
                treatment: "GROSS_UP",
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
                amount: 7_493_907,
                treatment: "GROSS_UP",
              },
            ],
          });

        // ==================================
        // GROSS-UP → GROSS
        // ==================================

        expect(
          salaryFirst[0]
            .paymentTaxImpact,
        ).toBe(
          114_120,
        );

        expect(
          salaryFirst[1]
            .paymentTaxImpact,
        ).toBe(
          2_805_745,
        );

        // ==================================
        // GROSS → GROSS-UP
        // ==================================

        expect(
          bonusFirst[0]
            .paymentTaxImpact,
        ).toBe(
          1_449_929,
        );

        expect(
          bonusFirst[1]
            .paymentTaxImpact,
        ).toBe(
          1_469_936,
        );

        // ==================================
        // TOTAL PPh KUMULATIF
        // ==================================

        /**
         * Urutan 1:
         *
         * 114.120
         * + 2.805.745
         * = 2.919.865
         */

        expect(
          salaryFirst[0]
            .paymentTaxImpact +
            salaryFirst[1]
              .paymentTaxImpact,
        ).toBe(
          2_919_865,
        );

        /**
         * Urutan 2:
         *
         * 1.449.929
         * + 1.469.936
         * = 2.919.865
         */

        expect(
          bonusFirst[0]
            .paymentTaxImpact +
            bonusFirst[1]
              .paymentTaxImpact,
        ).toBe(
          2_919_865,
        );
      },
    );
  },
);