import { getTaxConfig } from "@/config/tax";
import { getTER } from "./ter";

import type {
  PaymentImpactInput,
  PaymentImpactResult,
  IncomeItem,
} from "./types";


export function calculatePaymentImpact(
  input: PaymentImpactInput,
): PaymentImpactResult[] {
  validateInput(input);

  const payments = [
    ...input.payments,
  ].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return calculateFromOrderedPayments(
    input,
    payments,
  );
}


export function calculatePaymentImpactForOrder(
  input: PaymentImpactInput,
  orderedPayments: IncomeItem[],
): PaymentImpactResult[] {
  validateInput(input);

  if (
    orderedPayments.length === 0
  ) {
    throw new Error(
      "Order pembayaran alternatif tidak boleh kosong.",
    );
  }

  if (
    orderedPayments.length !==
    input.payments.length
  ) {
    throw new Error(
      "Jumlah pembayaran pada order alternatif harus sama dengan input.",
    );
  }

  validateAlternativeOrder(
    input.payments,
    orderedPayments,
  );

  return calculateFromOrderedPayments(
    input,
    orderedPayments,
  );
}


function calculateFromOrderedPayments(
  input: PaymentImpactInput,
  payments: IncomeItem[],
): PaymentImpactResult[] {
  const config = getTaxConfig(
    input.taxYear,
  );

  const results: PaymentImpactResult[] = [];

  let cumulativeGross = 0;
  let previousSimulatedTax = 0;

  for (
    let index = 0;
    index < payments.length;
    index++
  ) {
    const payment = payments[index];

    cumulativeGross +=
      payment.amount;

    const ter = getTER(
      input.category,
      cumulativeGross,
      {
        TER_A: config.TER_A,
        TER_B: config.TER_B,
        TER_C: config.TER_C,
      },
    );

    /**
     * Catatan:
     *
     * Ini adalah simulasi edukatif
     * untuk menunjukkan dampak perubahan
     * cumulative gross terhadap PPh.
     *
     * Bukan berarti setiap pembayaran
     * secara hukum dikenakan TER secara
     * terpisah.
     */
    const simulatedCumulativeTax =
      Math.round(
        cumulativeGross *
          ter.rate,
      );

    const paymentImpact =
      simulatedCumulativeTax -
      previousSimulatedTax;

    results.push({
      sequence: index + 1,

      paymentName:
        payment.name,

      paymentAmount:
        payment.amount,

      cumulativeGross,

      terCategory:
        ter.category,

      terRate:
        ter.rate,

      simulatedCumulativeTax,

      paymentImpact,
    });

    previousSimulatedTax =
      simulatedCumulativeTax;
  }

  return results;
}


function validateAlternativeOrder(
  originalPayments: IncomeItem[],
  orderedPayments: IncomeItem[],
): void {
  /**
   * Setiap payment harus muncul tepat
   * satu kali pada order alternatif.
   *
   * Kita tidak menggunakan sequence sebagai
   * identitas karena sequence memang boleh
   * berubah secara konseptual ketika user
   * melakukan What If.
   *
   * Identitas payment dibentuk dari:
   * - name
   * - amount
   * - type
   */

  const originalKeys =
    originalPayments.map(
      createPaymentIdentity,
    );

  const alternativeKeys =
    orderedPayments.map(
      createPaymentIdentity,
    );

  const originalCounts =
    countOccurrences(originalKeys);

  const alternativeCounts =
    countOccurrences(alternativeKeys);

  if (
    originalCounts.size !==
    alternativeCounts.size
  ) {
    throw new Error(
      "Order alternatif harus menggunakan pembayaran yang sama.",
    );
  }

  for (
    const [
      key,
      count,
    ] of originalCounts
  ) {
    if (
      alternativeCounts.get(key) !==
      count
    ) {
      throw new Error(
        "Order alternatif harus menggunakan setiap pembayaran tepat satu kali.",
      );
    }
  }
}


function createPaymentIdentity(
  payment: IncomeItem,
): string {
  return JSON.stringify([
    payment.name,
    payment.amount,
    payment.type,
  ]);
}


function countOccurrences(
  values: string[],
): Map<string, number> {
  const counts = new Map<
    string,
    number
  >();

  for (
    const value of values
  ) {
    counts.set(
      value,
      (counts.get(value) ?? 0) + 1,
    );
  }

  return counts;
}


function validateInput(
  input: PaymentImpactInput,
): void {
  if (
    !Number.isInteger(
      input.taxYear,
    ) ||
    input.taxYear < 2000
  ) {
    throw new Error(
      "Tahun pajak tidak valid.",
    );
  }

  if (
    input.payments.length === 0
  ) {
    throw new Error(
      "Minimal harus ada satu pembayaran.",
    );
  }

  for (
    const payment of input.payments
  ) {
    if (
      !Number.isFinite(
        payment.amount,
      )
    ) {
      throw new Error(
        `Nominal "${payment.name}" harus berupa angka yang valid.`,
      );
    }

    if (
      payment.amount < 0
    ) {
      throw new Error(
        `Nominal "${payment.name}" tidak boleh negatif.`,
      );
    }

    if (
      !Number.isInteger(
        payment.sequence,
      ) ||
      payment.sequence < 1
    ) {
      throw new Error(
        `Sequence "${payment.name}" harus berupa bilangan bulat positif.`,
      );
    }
  }
}