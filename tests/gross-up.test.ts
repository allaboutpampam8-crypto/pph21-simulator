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

            grossUpBase:
              7_493_907,

            actualTaxAllowance:
              114_120,
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

            grossUpBase:
              6_463_907,

            actualTaxAllowance:
              0,
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

        expect(
          result.grossUpAdjustment,
        ).toBe(639_288);

        expect(
          result.brutoOri,
        ).toBe(21_211_130);
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

            grossUpBase:
              7_493_907,

            actualTaxAllowance:
              114_120,
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
      },
    );

    it(
      "GT-GU-004 - Adjustment dapat mendorong bruto ke bracket berikutnya",
      () => {
        const result =
          calculateGrossUpRecalculation({
            taxYear: 2026,
            category: "A",

            actualGross:
              26_300_000,

            grossUpBase:
              24_000_000,

            actualTaxAllowance:
              2_400_000,
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
        ).toBe(26_866_292);
      },
    );

    it(
      "Gross-up 0% menghasilkan allowance 0",
      () => {
        expect(
          calculateGrossUpAllowance({
            grossUpBase:
              5_000_000,
            terRate: 0,
          }),
        ).toBe(0);
      },
    );
  },
);