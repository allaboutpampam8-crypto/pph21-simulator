import { describe, expect, it } from "vitest";

import {
  type TERBracket,
} from "@/config/tax/2026";

import {
  getTaxConfig,
} from "@/config/tax";

import { getTER } from "./ter";

const config = getTaxConfig(2026);

function testTER(
  category: "A" | "B" | "C",
  gross: number,
) {
  return getTER(
    category,
    gross,
    {
      TER_A: config.TER_A,
      TER_B: config.TER_B,
      TER_C: config.TER_C,
    },
  );
}

describe("TER boundary - Category A", () => {
  testTERBoundaries("A", config.TER_A);
});

describe("TER boundary - Category B", () => {
  testTERBoundaries("B", config.TER_B);
});

describe("TER boundary - Category C", () => {
  testTERBoundaries("C", config.TER_C);
});

function testTERBoundaries(
  category: "A" | "B" | "C",
  brackets: TERBracket[],
) {
  describe(`Category ${category}`, () => {
    it(
      "tidak memiliki gap atau overlap antar bracket",
      () => {
        for (
          let i = 1;
          i < brackets.length;
          i++
        ) {
          const previous =
            brackets[i - 1];

          const current =
            brackets[i];

          expect(
            previous.max,
          ).not.toBeNull();

          expect(
            current.min,
          ).toBe(
            previous.max! + 1,
          );
        }
      },
    );

    brackets.forEach(
      (bracket, index) => {
        it(
          `bracket ${index + 1} memiliki minimum ${bracket.min}`,
          () => {
            expect(
              testTER(
                category,
                bracket.min,
              ).rate,
            ).toBe(
              bracket.rate,
            );
          },
        );

        if (
          bracket.max !== null
        ) {
          it(
            `bracket ${index + 1} memiliki maximum ${bracket.max}`,
            () => {
              expect(
                testTER(
                  category,
                  bracket.max!,
                ).rate,
              ).toBe(
                bracket.rate,
              );
            },
          );

          if (
            index <
            brackets.length - 1
          ) {
            const nextBracket =
              brackets[index + 1];

            it(
              `berpindah ke bracket berikutnya setelah ${bracket.max}`,
              () => {
                expect(
                  testTER(
                    category,
                    bracket.max! + 1,
                  ).rate,
                ).toBe(
                  nextBracket.rate,
                );
              },
            );
          }
        }

        if (index > 0) {
          const previousBracket =
            brackets[index - 1];

          it(
            `angka sebelum minimum ${bracket.min} masih berada di bracket sebelumnya`,
            () => {
              expect(
                testTER(
                  category,
                  bracket.min - 1,
                ).rate,
              ).toBe(
                previousBracket.rate,
              );
            },
          );
        }
      },
    );
  });
}