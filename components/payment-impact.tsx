"use client";

import { useState } from "react";

import type { PaymentImpactResult } from "@/lib/tax-engine/types";

interface PaymentImpactProps {
  items: PaymentImpactResult[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value * 100}%`;
}

function getExplanation(
  item: PaymentImpactResult,
  index: number,
) {
  if (index === 0) {
    return `Setelah ${item.paymentName.toLowerCase()} diterima, bruto kumulatif menjadi Rp ${formatRupiah(
      item.cumulativeGross,
    )}. Dengan bruto tersebut, TER yang berlaku adalah ${formatPercent(
      item.terRate,
    )}.`;
  }

  return `Setelah ${item.paymentName.toLowerCase()} ditambahkan, bruto kumulatif menjadi Rp ${formatRupiah(
    item.cumulativeGross,
  )}. TER yang berlaku pada titik ini adalah ${formatPercent(
    item.terRate,
  )}. Dampak PPh pada pembayaran ini dalam simulasi adalah Rp ${formatRupiah(
    item.paymentImpact,
  )}.`;
}

export default function PaymentImpact({
  items,
}: PaymentImpactProps) {
  const [openSequence, setOpenSequence] =
    useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-600">
          KENAPA PPh SAYA NAIK?
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Dampak berdasarkan urutan pembayaran
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Lihat bagaimana setiap pembayaran mengubah
          bruto kumulatif, TER, dan dampak PPh dalam
          simulasi.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {items.map((item, index) => {
          const isOpen =
            openSequence === item.sequence;

          const isLast =
            index === items.length - 1;

          return (
            <div
              key={`${item.paymentName}-${item.sequence}`}
              className="relative flex gap-4"
            >
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[17px] top-9 h-[calc(100%-16px)] w-px bg-blue-100" />
              )}

              {/* Number */}
              <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-sm font-bold text-blue-600 shadow-sm">
                {index + 1}
              </div>

              {/* Card */}
              <div className="mb-4 min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.paymentName}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      +Rp{" "}
                      {formatRupiah(
                        item.paymentAmount,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-2 text-left shadow-sm sm:min-w-[100px] sm:text-right">
                    <p className="text-[11px] text-slate-400">
                      TER Saat Ini
                    </p>

                    <p className="text-base font-bold text-slate-900">
                      {formatPercent(
                        item.terRate,
                      )}
                    </p>
                  </div>
                </div>

                {/* Detail */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-400">
                      Bruto Kumulatif
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      Rp{" "}
                      {formatRupiah(
                        item.cumulativeGross,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-slate-400">
                      Dampak PPh pada Pembayaran Ini
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      +Rp{" "}
                      {formatRupiah(
                        item.paymentImpact,
                      )}
                    </p>
                  </div>
                </div>

                {/* Why button */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenSequence(
                      isOpen
                        ? null
                        : item.sequence,
                    )
                  }
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span>
                    {isOpen
                      ? "Tutup penjelasan"
                      : "Kenapa?"}
                  </span>

                  <span
                    className={`transition-transform ${
                      isOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {/* Explanation */}
                {isOpen && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm leading-6 text-blue-950">
                      {getExplanation(
                        item,
                        index,
                      )}
                    </p>

                    <div className="mt-3 border-t border-blue-100 pt-3">
                      <p className="text-xs leading-5 text-blue-800">
                        <strong>Penting:</strong>{" "}
                        dampak PPh di atas merupakan
                        simulasi berdasarkan urutan
                        pembayaran. Ini bukan berarti{" "}
                        {item.paymentName.toLowerCase()}{" "}
                        memiliki tarif PPh tersendiri.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          <strong>Catatan edukasi:</strong> Dampak PPh
          per pembayaran digunakan untuk membantu
          memahami perubahan PPh ketika penghasilan
          ditambahkan secara bertahap. Perhitungan PPh 21
          masa pajak tetap menggunakan total penghasilan
          bruto dan TER yang berlaku.
        </p>
      </div>
    </section>
  );
}