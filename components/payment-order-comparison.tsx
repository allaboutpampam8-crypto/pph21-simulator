"use client";

import { useEffect, useMemo, useState } from "react";

import { calculatePaymentImpactForOrder } from "@/lib/tax-engine/payment-impact";

import type {
  IncomeItem,
  PaymentImpactResult,
  TERCategory,
} from "@/lib/tax-engine/types";

interface PaymentOrderComparisonProps {
  taxYear: number;
  payments: IncomeItem[];
  category: TERCategory;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function moveItem(
  items: IncomeItem[],
  index: number,
  direction: -1 | 1,
) {
  const newIndex = index + direction;

  if (
    newIndex < 0 ||
    newIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];

  [next[index], next[newIndex]] = [
    next[newIndex],
    next[index],
  ];

  return next.map((item, position) => ({
    ...item,
    sequence: position + 1,
  }));
}

export default function PaymentOrderComparison({
  taxYear,
  payments,
  category,
}: PaymentOrderComparisonProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [alternativeOrder, setAlternativeOrder] =
    useState<IncomeItem[]>(payments);

  const [isApplied, setIsApplied] =
    useState(false);

  useEffect(() => {
    setAlternativeOrder(payments);
    setIsApplied(false);
  }, [payments]);

  const alternativeResult =
    useMemo<PaymentImpactResult[] | null>(() => {
      if (!isApplied) {
        return null;
      }

      return calculatePaymentImpactForOrder(
        {
          taxYear,
          category,
          payments,
        },
        alternativeOrder,
      );
    }, [
      isApplied,
      taxYear,
      category,
      payments,
      alternativeOrder,
    ]);

  if (payments.length < 2) {
    return null;
  }

  const hasChangedOrder =
    alternativeOrder.some(
      (item, index) =>
        item.name !== payments[index]?.name,
    );

  const handleMove = (
    index: number,
    direction: -1 | 1,
  ) => {
    setAlternativeOrder((current) =>
      moveItem(
        current,
        index,
        direction,
      ),
    );

    setIsApplied(false);
  };

  const handleReset = () => {
    setAlternativeOrder(
      payments.map((item, index) => ({
        ...item,
        sequence: index + 1,
      })),
    );

    setIsApplied(false);
  };

  const handleApply = () => {
    setIsApplied(true);
  };

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen((current) => !current)
        }
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-600">
            🔄 COBA URUTAN PEMBAYARAN LAIN
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Bagaimana jika urutannya berbeda?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ubah urutan pembayaran untuk melihat
            bagaimana dampak PPh berubah secara
            simulasi.
          </p>
        </div>

        <span
          aria-hidden="true"
          className={`shrink-0 text-xl text-blue-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ↓
        </span>
      </button>

      {isOpen && (
        <div className="mt-6">
          {/* Explanation */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-900">
              Fitur ini hanya digunakan untuk
              membandingkan{" "}
              <strong>urutan simulasi</strong>.
              PPh 21 resmi masa pajak tetap dihitung
              berdasarkan total penghasilan bruto dan
              TER yang berlaku.
            </p>
          </div>

          {/* Order list */}
          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Atur urutan pembayaran
            </p>

            <div className="space-y-2">
              {alternativeOrder.map(
                (payment, index) => {
                  const isFirst = index === 0;
                  const isLast =
                    index ===
                    alternativeOrder.length - 1;

                  return (
                    <div
                      key={`${payment.name}-${payment.type}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      {/* Number */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 shadow-sm">
                        {index + 1}
                      </div>

                      {/* Payment */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {payment.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Rp{" "}
                          {formatRupiah(
                            payment.amount,
                          )}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Pindahkan ${payment.name} ke atas`}
                          disabled={isFirst}
                          onClick={() =>
                            handleMove(
                              index,
                              -1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          aria-label={`Pindahkan ${payment.name} ke bawah`}
                          disabled={isLast}
                          onClick={() =>
                            handleMove(
                              index,
                              1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasChangedOrder}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Terapkan Urutan
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Kembalikan
            </button>
          </div>

          {/* Alternative result */}
          {alternativeResult && (
            <div className="mt-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-blue-600">
                  HASIL SIMULASI ALTERNATIF
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Dampak berdasarkan urutan baru
                </h3>
              </div>

              <div className="space-y-3">
                {alternativeResult.map(
                  (item, index) => (
                    <div
                      key={`${item.paymentName}-${item.sequence}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600 shadow-sm">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.paymentName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Rp{" "}
                                {formatRupiah(
                                  item.paymentAmount,
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                TER Saat Ini
                              </p>

                              <p className="font-bold text-slate-900">
                                {item.terRate * 100}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-white p-3">
                              <p className="text-xs text-slate-500">
                                Bruto Kumulatif
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-900">
                                Rp{" "}
                                {formatRupiah(
                                  item.cumulativeGross,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-3">
                              <p className="text-xs text-slate-500">
                                Dampak PPh
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-900">
                                +Rp{" "}
                                {formatRupiah(
                                  item.paymentImpact,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Final comparison */}
              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900">
                  Total simulasi kumulatif tetap sama
                </p>

                <p className="mt-1 text-sm leading-6 text-green-800">
                  Setelah seluruh pembayaran
                  diperhitungkan, total PPh simulasi
                  tetap{" "}
                  <strong>
                    Rp{" "}
                    {formatRupiah(
                      alternativeResult[
                        alternativeResult.length - 1
                      ].simulatedCumulativeTax,
                    )}
                  </strong>
                  .
                </p>
              </div>

              {/* Important note */}
              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs leading-5 text-amber-800">
                  <strong>Penting:</strong> perubahan
                  urutan hanya memengaruhi tampilan
                  dampak pembayaran dalam simulasi.
                  Ini bukan berarti setiap pembayaran
                  memiliki tarif PPh tersendiri dan
                  bukan perubahan terhadap PPh 21
                  resmi masa pajak.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
