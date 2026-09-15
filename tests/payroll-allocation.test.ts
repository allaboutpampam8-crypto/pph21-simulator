import { describe, expect, it } from "vitest";

import {
  calculatePayrollAllocation,
} from "@/lib/tax-engine/payroll-allocation";

describe(
  "Payroll Allocation Adapter",
  () => {
    it(
      "GT-PA-001 - memisahkan officialTax dan grossUpAdjustment",
      () => {
        const result =
          calculatePayrollAllocation({
            taxYear: 2026,
            category: "A",

            officialTax:
              2_919_865,

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

        expect(
          result.officialTax,
        ).toBe(2_919_865);

        expect(
          result.grossUpAdjustment,
        ).toBe(812_093);

        expect(
          result.actualGross,
        ).toBe(25_732_135);

        expect(
          result.brutoOri,
        ).toBe(26_544_228);
      },
    );

    it(
      "GT-PA-002 - officialTax tidak dihitung ulang oleh adapter",
      () => {
        const result =
          calculatePayrollAllocation({
            taxYear: 2026,
            category: "A",

            // Sengaja menggunakan nilai
            // yang berbeda untuk memastikan
            // adapter tidak mengambil nilai
            // dari payroll allocation sebagai
            // official tax.
            officialTax:
              1_234_567,

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

        expect(
          result.officialTax,
        ).toBe(1_234_567);

        expect(
          result.grossUpAdjustment,
        ).toBe(812_093);
      },
    );

    it(
      "GT-PA-003 - Gross → Gross-Up",
      () => {
        const result =
          calculatePayrollAllocation({
            taxYear: 2026,
            category: "A",

            officialTax:
              1_851_466,

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
                amount: 7_103_195,
                treatment: "GROSS_UP",
                grossUpBase: 6_463_907,
                actualTaxAllowance: 639_288,
              },
            ],
          });

        expect(
          result.officialTax,
        ).toBe(1_851_466);

        expect(
          result.grossUpAdjustment,
        ).toBe(0);

        expect(
          result.actualGross,
        ).toBe(20_571_842);

        expect(
          result.brutoOri,
        ).toBe(20_571_842);
      },
    );

    it(
      "GT-PA-004 - allocation tetap tersedia walaupun tidak ada gross-up",
      () => {
        const result =
          calculatePayrollAllocation({
            taxYear: 2026,
            category: "A",

            officialTax:
              200_000,

            payments: [
              {
                id: "salary-1",
                name: "Gaji",
                amount: 10_000_000,
                treatment: "GROSS",
              },
            ],
          });

        expect(
          result.officialTax,
        ).toBe(200_000);

        expect(
          result.grossUpAdjustment,
        ).toBe(0);

        expect(
          result.actualGross,
        ).toBe(10_000_000);

        expect(
          result.brutoOri,
        ).toBe(10_000_000);
      },
    );

    it(
      "GT-PA-005 - officialTax negatif ditolak",
      () => {
        expect(() =>
          calculatePayrollAllocation({
            taxYear: 2026,
            category: "A",

            officialTax:
              -1,

            payments: [
              {
                id: "salary-1",
                name: "Gaji",
                amount: 10_000_000,
                treatment: "GROSS",
              },
            ],
          }),
        ).toThrow(
          /official tax/i,
        );
      },
    );
  },
);