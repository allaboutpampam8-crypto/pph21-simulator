import { describe, expect, it } from "vitest";

import { calculateGrossUpPayments } from "@/lib/tax-engine/gross-up-payment";

describe("Gross-Up Payment Engine - Tahap 2D", () => {
  it("GT-RE-GU-001 - Gross-Up → Gross menghasilkan re-gross-up sesuai payroll aktual", () => {
    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          id: "salary-1",
          name: "Gaji",

          // Penghasilan sebelum tambahan tunjangan PPh.
          // Tunjangan PPh dihitung otomatis oleh engine.
          amount: 7_493_907,

          treatment: "GROSS_UP",
        },

        {
          id: "bonus-1",
          name: "Bonus",

          // Bonus sudah merupakan bruto.
          amount: 18_124_108,

          treatment: "GROSS",
        },
      ],
    });

    expect(result).toHaveLength(2);

    const salary = result[0];
    const bonus = result[1];

    // =========================
    // SALARY
    // =========================

    // Base 7.493.907
    // + tunjangan PPh 114.120
    // = gross aktual 7.608.027
    expect(salary.cumulativeActualGross).toBe(7_608_027);

    expect(salary.terRate).toBe(0.015);

    expect(salary.finalTerRate).toBe(0.015);

    expect(salary.actualTaxAllowance).toBe(114_120);

    expect(salary.oriTaxAllowance).toBe(114_120);

    expect(salary.grossUpAdjustment).toBe(0);

    expect(salary.brutoOri).toBe(7_608_027);

    expect(salary.cumulativeTax).toBe(114_120);

    expect(salary.paymentTaxImpact).toBe(114_120);

    // =========================
    // BONUS
    // =========================

    expect(bonus.cumulativeActualGross).toBe(25_732_135);

    // TER berdasarkan gross aktual
    expect(bonus.terRate).toBe(0.1);

    // Setelah re-gross-up,
    // bruto ori masuk TER 11%.
    expect(bonus.finalTerRate).toBe(0.11);

    expect(bonus.oriTaxAllowance).toBe(926_213);

    expect(bonus.grossUpAdjustment).toBe(812_093);

    expect(bonus.brutoOri).toBe(26_544_228);

    expect(bonus.cumulativeTax).toBe(2_919_865);

    // Total PPh setelah re-gross-up
    // dikurangi PPh yang sudah muncul
    // pada salary.
    expect(bonus.paymentTaxImpact).toBe(2_805_745);
  });

  it("GT-RE-GU-002 - Gross → Gross-Up tidak menghasilkan adjustment jika TER sudah sesuai", () => {
    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",

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

          // Penghasilan sebelum tambahan tunjangan PPh.
          // Tunjangan PPh dihitung otomatis.
          amount: 6_463_907,

          treatment: "GROSS_UP",
        },
      ],
    });

    expect(result).toHaveLength(2);

    const bonus = result[0];
    const salary = result[1];

    // =========================
    // BONUS
    // =========================

    expect(bonus.cumulativeActualGross).toBe(13_468_647);

    expect(bonus.terRate).toBe(0.05);

    expect(bonus.cumulativeTax).toBe(673_432);

    expect(bonus.paymentTaxImpact).toBe(673_432);

    // =========================
    // SALARY GROSS-UP
    // =========================

    // Base 6.463.907
    // + tunjangan PPh 639.288
    // = gross aktual 7.103.195
    //
    // Kumulatif:
    // 13.468.647 + 7.103.195
    // = 20.571.842
    expect(salary.cumulativeActualGross).toBe(20_571_842);

    expect(salary.terRate).toBe(0.09);

    expect(salary.finalTerRate).toBe(0.09);

    expect(salary.actualTaxAllowance).toBe(639_288);

    expect(salary.oriTaxAllowance).toBe(639_288);

    expect(salary.grossUpAdjustment).toBe(0);

    expect(salary.brutoOri).toBe(20_571_842);

    expect(salary.cumulativeTax).toBe(1_851_466);

    expect(salary.paymentTaxImpact).toBe(1_178_034);
  });

  it("GT-RE-GU-003 - Gross-Up → Gross tanpa perubahan TER tidak menghasilkan adjustment", () => {
    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          id: "salary-1",
          name: "Gaji",

          // Base sebelum tunjangan PPh.
          amount: 7_493_907,

          treatment: "GROSS_UP",
        },

        {
          id: "bonus-1",
          name: "Bonus",

          amount: 100_000,

          treatment: "GROSS",
        },
      ],
    });

    expect(result).toHaveLength(2);

    const salary = result[0];
    const bonus = result[1];

    expect(salary.grossUpAdjustment).toBe(0);

    expect(salary.finalTerRate).toBe(0.015);

    expect(bonus.cumulativeActualGross).toBe(7_708_027);

    expect(bonus.terRate).toBe(0.015);

    expect(bonus.finalTerRate).toBe(0.015);

    expect(bonus.grossUpAdjustment).toBe(0);

    expect(bonus.brutoOri).toBe(7_708_027);
  });

  it("GT-RE-GU-004 - GROSS_UP langsung menghitung tunjangan PPh pada TER final", () => {
    const payments = [
      {
        id: "salary-1",
        name: "Gaji",

        // Input GROSS_UP adalah penghasilan
        // sebelum tambahan tunjangan PPh.
        amount: 24_000_000,

        treatment: "GROSS_UP" as const,
      },
    ];

    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",
      payments,
    });

    expect(result).toHaveLength(1);

    const payment = result[0];

    // =========================
    // INPUT
    // =========================

    // Amount tetap merupakan
    // penghasilan sebelum tunjangan PPh.
    expect(payment.amount).toBe(24_000_000);

    // =========================
    // GROSS-UP
    // =========================

    // Tunjangan PPh dihitung otomatis
    // pada TER final 11%.
    expect(payment.actualTaxAllowance).toBe(2_966_292);

    expect(payment.grossUpBase).toBe(24_000_000);

    // =========================
    // BRUTO AKTUAL
    // =========================

    // 24.000.000 + 2.966.292
    // = 26.966.292
    expect(payment.cumulativeActualGross).toBe(26_966_292);

    // Karena allowance sejak awal
    // sudah dihitung pada bracket final,
    // tidak diperlukan adjustment tambahan.
    expect(payment.grossUpAdjustment).toBe(0);

    expect(payment.brutoOri).toBe(26_966_292);

    // =========================
    // TER
    // =========================

    expect(payment.terRate).toBe(0.11);

    expect(payment.finalTerRate).toBe(0.11);

    // =========================
    // TAX
    // =========================

    expect(payment.oriTaxAllowance).toBe(2_966_292);

    expect(payment.cumulativeTax).toBe(2_966_292);

    expect(payment.paymentTaxImpact).toBe(2_966_292);
  });

  it("GT-RE-GU-005 - GROSS_UP menghitung tunjangan PPh secara otomatis", () => {
    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          id: "salary-1",
          name: "Gaji",

          // User hanya memasukkan penghasilan
          // sebelum tambahan tunjangan PPh.
          amount: 7_493_907,

          treatment: "GROSS_UP",
        },
      ],
    });

    expect(result).toHaveLength(1);

    const salary = result[0];

    expect(salary.actualTaxAllowance).toBe(114_120);

    expect(salary.grossUpBase).toBe(7_493_907);

    expect(salary.cumulativeActualGross).toBe(7_608_027);

    expect(salary.brutoOri).toBe(7_608_027);

    expect(salary.cumulativeTax).toBe(114_120);
  });

  it("GT-RE-GU-006 - GROSS_UP amount merepresentasikan penghasilan sebelum tunjangan PPh", () => {
    const result = calculateGrossUpPayments({
      taxYear: 2026,
      category: "A",

      payments: [
        {
          id: "salary-1",
          name: "Gaji",

          // Amount adalah penghasilan sebelum
          // tunjangan PPh.
          amount: 7_493_907,

          treatment: "GROSS_UP",
        },
      ],
    });

    expect(result).toHaveLength(1);

    const salary = result[0];

    // Base = amount yang dimasukkan user.
    expect(salary.grossUpBase).toBe(7_493_907);

    // Allowance dihitung otomatis.
    expect(salary.actualTaxAllowance).toBe(114_120);

    // Base + allowance.
    expect(salary.cumulativeActualGross).toBe(
      7_493_907 + 114_120,
    );
  });
});