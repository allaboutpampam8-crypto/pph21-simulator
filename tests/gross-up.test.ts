import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateGrossUpAllowance,
  calculateGrossUpRecalculation,
} from "@/lib/tax-engine/gross-up";

describe(
  "Gross-Up Tax Engine",
  () => {
    it(
      "GT-GU-001 - Gross-Up → Gross dengan perubahan TER",
      () => {
        const result =
          calculateGrossUpRecalculation({
            taxYear: 2026,
            category: "A",

            actualGross:
              25_732_135,

            // Gross-Up payment yang sudah terjadi
            grossUpBases: [
              7_493_907,
            ],

            // Tunjangan PPh yang benar-benar sudah
            // diberikan pada saat payroll awal
            actualTaxAllowances: [
              114_120,
            ],
          });

        expect(
          result.initialTerRate,
        ).toBe(0.10);

        expect(
          result.finalTerRate,
        ).toBe(0.11);

        expect(
          result.oriTaxAllowance,
        ).toBe(926_213);

        expect(
          result.grossUpAdjustment,
        ).toBe(812_093);

        expect(
          result.brutoOri,
        ).toBe(26_544_228);

        expect(
          result.totalTax,
        ).toBe(2_919_865);
      },
    );

    it(
      "GT-GU-002 - Gross → Gross-Up",
      () => {
        const result =
          calculateGrossUpRecalculation({
            taxYear: 2026,
            category: "A",

            actualGross:
              20_571_842,

            // Gross-Up salary base
            grossUpBases: [
              6_463_907,
            ],

            // Allowance sudah terbentuk
            // pada proses payroll awal
            actualTaxAllowances: [
              639_288,
            ],
          });

        expect(
          result.initialTerRate,
        ).toBe(0.09);

        expect(
          result.finalTerRate,
        ).toBe(0.09);

        expect(
          result.oriTaxAllowance,
        ).toBe(639_288);

        // Karena TER final sama dengan TER awal,
        // tidak ada tambahan adjustment.
        expect(
          result.grossUpAdjustment,
        ).toBe(0);

        expect(
          result.brutoOri,
        ).toBe(20_571_842);

        expect(
          result.totalTax,
        ).toBe(1_851_466);
      },
    );

    it(
      "GT-GU-003 - Gross-Up → Gross tanpa perubahan TER",
      () => {
        const result =
          calculateGrossUpRecalculation({
            taxYear: 2026,
            category: "A",

            actualGross:
              7_708_027,

            grossUpBases: [
              7_493_907,
            ],

            actualTaxAllowances: [
              114_120,
            ],
          });

        expect(
          result.initialTerRate,
        ).toBe(0.015);

        expect(
          result.finalTerRate,
        ).toBe(0.015);

        expect(
          result.oriTaxAllowance,
        ).toBe(114_120);

        expect(
          result.grossUpAdjustment,
        ).toBe(0);

        expect(
          result.brutoOri,
        ).toBe(7_708_027);

        expect(
          result.totalTax,
        ).toBe(115_620);
      },
    );

    it(
      "GT-GU-004 - Adjustment dapat mendorong bruto ke bracket berikutnya",
      () => {
        const result =
          calculateGrossUpRecalculation({
            taxYear: 2026,
            category: "A",

            // Base 24.000.000
            // + allowance aktual 2.400.000
            // = actual gross 26.400.000
            actualGross:
              26_400_000,

            grossUpBases: [
              24_000_000,
            ],

            actualTaxAllowances: [
              2_400_000,
            ],
          });

        expect(
          result.initialTerRate,
        ).toBe(0.10);

        expect(
          result.finalTerRate,
        ).toBe(0.11);

        expect(
          result.oriTaxAllowance,
        ).toBe(2_966_292);

        expect(
          result.grossUpAdjustment,
        ).toBe(566_292);

        expect(
          result.brutoOri,
        ).toBe(26_966_292);

        expect(
          result.totalTax,
        ).toBe(2_966_292);
      },
    );

    it(
      "Gross-up 0% menghasilkan allowance 0",
      () => {
        expect(
          calculateGrossUpAllowance({
            grossUpBase:
              5_000_000,

            terRate:
              0,
          }),
        ).toBe(0);
      },
    );
  },
);