import { describe, expect, it } from "vitest";

import { simulateTax } from "@/lib/tax-engine/simulate";

import type {
  TaxSimulationResult,
} from "@/lib/tax-engine/types";


/**
 * Helper untuk memastikan result merupakan
 * hasil masa pajak biasa sehingga property
 * `monthly` aman digunakan oleh TypeScript.
 */
function expectMonthlyResult(
  result: TaxSimulationResult,
) {
  expect(result.monthly).toBeDefined();

  if (!result.monthly) {
    throw new Error(
      "Expected monthly tax result.",
    );
  }

  return result.monthly;
}


describe(
  "simulateTax - Payroll Allocation Integration",
  () => {

    // =====================================================
    // GT-SIM-PA-001
    // =====================================================

    it(
      "GT-SIM-PA-001 - officialTax tetap berasal dari Monthly Tax Engine",
      () => {
        const result =
          simulateTax(
            {
              profile: {
                taxYear: 2026,
                month: 9,
                status: "TK/0",
                isFinalMonth: false,
              },

              incomeItems: [
                {
                  name: "Gaji",
                  amount: 7_608_027,

                  // IncomeItem membutuhkan type.
                  // Nilai salary digunakan untuk
                  // merepresentasikan penghasilan gaji.
                  type: "salary" as "salary",

                  sequence: 1,
                },

                {
                  name: "Bonus",
                  amount: 18_124_108,
                  type: "bonus" as "bonus",
                  sequence: 2,
                },
              ],
            },
            {
              includePayrollAllocation: true,

              payrollPayments: [
                {
                  id: "salary-1",
                  name: "Gaji",

                  // Untuk GROSS_UP:
                  // amount = penghasilan sebelum
                  // tambahan tunjangan PPh.
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
            },
          );

        const monthly =
          expectMonthlyResult(result);


        // =================================================
        // OFFICIAL TAX
        // =================================================

        /**
         * Actual gross:
         *
         * Rp7.608.027
         * + Rp18.124.108
         * = Rp25.732.135
         *
         * TER A = 10%
         *
         * Rp25.732.135 × 10%
         * = Rp2.573.213,5
         * → Rp2.573.214
         */

        expect(
          monthly.grossIncome,
        ).toBe(25_732_135);

        expect(
          monthly.terCategory,
        ).toBe("A");

        expect(
          monthly.terRate,
        ).toBe(0.10);

        expect(
          monthly.tax,
        ).toBe(2_573_214);


        // =================================================
        // PAYROLL ALLOCATION
        // =================================================

        expect(
          result.payrollAllocation,
        ).toBeDefined();

        expect(
          result.payrollAllocation!
            .officialTax,
        ).toBe(2_573_214);

        expect(
          result.payrollAllocation!
            .grossUpAdjustment,
        ).toBe(812_093);

        expect(
          result.payrollAllocation!
            .actualGross,
        ).toBe(25_732_135);

        expect(
          result.payrollAllocation!
            .brutoOri,
        ).toBe(26_544_228);
      },
    );


    // =====================================================
    // GT-SIM-PA-002
    // =====================================================

    it(
      "GT-SIM-PA-002 - officialTax tidak berubah karena gross-up adjustment",
      () => {
        const result =
          simulateTax(
            {
              profile: {
                taxYear: 2026,
                month: 9,
                status: "TK/0",
                isFinalMonth: false,
              },

              incomeItems: [
                {
                  name: "Gaji",
                  amount: 7_608_027,
                  type: "salary" as "salary",
                  sequence: 1,
                },

                {
                  name: "Bonus",
                  amount: 18_124_108,
                  type: "bonus" as "bonus",
                  sequence: 2,
                },
              ],
            },
            {
              includePayrollAllocation: true,

              payrollPayments: [
                {
                  id: "salary-1",
                  name: "Gaji",

                  // GROSS_UP:
                  // amount = base sebelum
                  // tunjangan PPh.
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
            },
          );

        const monthly =
          expectMonthlyResult(result);


        /**
         * Official PPh tetap:
         *
         * Actual Gross × TER
         *
         * bukan:
         *
         * Official Tax
         * + Gross-Up Adjustment
         */

        expect(
          monthly.tax,
        ).toBe(2_573_214);

        expect(
          result.payrollAllocation!
            .officialTax,
        ).toBe(2_573_214);

        expect(
          result.payrollAllocation!
            .grossUpAdjustment,
        ).toBe(812_093);


        /**
         * Ini hanya untuk memastikan kedua
         * angka memang terpisah.
         *
         * BUKAN angka PPh resmi.
         */
        expect(
          monthly.tax +
            result.payrollAllocation!
              .grossUpAdjustment,
        ).toBe(3_385_307);
      },
    );


    // =====================================================
    // GT-SIM-PA-003
    // =====================================================

    it(
      "GT-SIM-PA-003 - payroll allocation tidak aktif secara default",
      () => {
        const result =
          simulateTax({
            profile: {
              taxYear: 2026,
              month: 9,
              status: "TK/0",
              isFinalMonth: false,
            },

            incomeItems: [
              {
                name: "Gaji",
                amount: 10_000_000,
                type: "salary" as "salary",
                sequence: 1,
              },
            ],
          });

        const monthly =
          expectMonthlyResult(result);


        expect(
          monthly.grossIncome,
        ).toBe(10_000_000);

        expect(
          monthly.terRate,
        ).toBe(0.02);

        expect(
          monthly.tax,
        ).toBe(200_000);

        expect(
          result.payrollAllocation,
        ).toBeUndefined();
      },
    );


    // =====================================================
    // GT-SIM-PA-004
    // =====================================================

    it(
      "GT-SIM-PA-004 - includePayrollAllocation tanpa payment ditolak",
      () => {
        expect(() =>
          simulateTax(
            {
              profile: {
                taxYear: 2026,
                month: 9,
                status: "TK/0",
                isFinalMonth: false,
              },

              incomeItems: [
                {
                  name: "Gaji",
                  amount: 10_000_000,
                  type: "salary" as "salary",
                  sequence: 1,
                },
              ],
            },
            {
              includePayrollAllocation: true,
            },
          ),
        ).toThrow(
          /minimal satu payment/i,
        );
      },
    );


    // =====================================================
    // GT-SIM-PA-005
    // =====================================================

    it(
      "GT-SIM-PA-005 - final month tetap menggunakan final engine",
      () => {
        const result =
          simulateTax(
            {
              profile: {
                taxYear: 2026,
                month: 12,
                status: "TK/0",
                isFinalMonth: true,
                monthsWorked: 12,
              },

              incomeItems: [
                {
                  name: "Gaji",
                  amount: 20_000_000,
                  type: "salary" as "salary",
                  sequence: 1,
                },
              ],

              finalGrossIncome:
                240_000_000,
            },
            {
              includePayrollAllocation: true,

              /**
               * Sengaja diberikan untuk memastikan
               * tahap ini belum mengaktifkan payroll
               * allocation pada final month.
               */
              payrollPayments: [
                {
                  id: "salary-1",
                  name: "Gaji",
                  amount: 20_000_000,
                  treatment: "GROSS",
                },
              ],
            },
          );


        // Masa final harus menghasilkan
        // property `final`.
        expect(
          result.final,
        ).toBeDefined();

        expect(
          result.payrollAllocation,
        ).toBeUndefined();
      },
    );
  },
);