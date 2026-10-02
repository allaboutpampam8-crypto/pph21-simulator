import { describe, expect, it } from "vitest";
import { formatPercent, formatRupiah } from "@/lib/formatters";

describe("formatters", () => {
  describe("formatPercent", () => {
    it("formats 0.0175 correctly as 1.75% without floating-point artifact", () => {
      expect(formatPercent(0.0175)).toBe("1.75%");
    });

    it("formats integer percentages cleanly", () => {
      expect(formatPercent(0.02)).toBe("2%");
      expect(formatPercent(0.11)).toBe("11%");
      expect(formatPercent(0)).toBe("0%");
    });

    it("formats rates with 1 or 2 decimal places", () => {
      expect(formatPercent(0.015)).toBe("1.5%");
      expect(formatPercent(0.0025)).toBe("0.25%");
      expect(formatPercent(0.0075)).toBe("0.75%");
      expect(formatPercent(0.0225)).toBe("2.25%");
    });

    it("caps maximum decimal places at 2", () => {
      expect(formatPercent(0.0123456)).toBe("1.23%");
    });

    it("handles invalid inputs safely", () => {
      expect(formatPercent(NaN)).toBe("0%");
    });
  });

  describe("formatRupiah", () => {
    it("formats Indonesian Rupiah numbers correctly", () => {
      expect(formatRupiah(1000000)).toBe("1.000.000");
      expect(formatRupiah(6278907)).toBe("6.278.907");
    });
  });
});
