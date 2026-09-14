"use client";

import { useState } from "react";

import type {
  TaxSimulationResult,
} from "@/lib/tax-engine/types";

interface TaxCalculationDetailProps {
  result: TaxSimulationResult;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value * 100}%`;
}

export default function TaxCalculationDetail({
  result,
}: TaxCalculationDetailProps) {
  const [isOpen, setIsOpen] = useState(false);

  const monthly = result.monthly;
  const final = result.final;
  const partYear = result.partYear;

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div>
          <p className="text-sm font-semibold text-blue-600">
            🔎 DETAIL PERHITUNGAN
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Dari mana angka PPh 21 ini berasal?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buka untuk melihat dasar perhitungan PPh 21
            yang digunakan oleh simulator.
          </p>
        </div>

        <span
          className={`shrink-0 text-xl text-blue-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ↓
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 sm:px-6 sm:pb-6">
          {/* Monthly */}
          {monthly && (
            <div className="pt-5">
              <p className="text-sm font-semibold text-blue-600">
                MASA PAJAK BIASA
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Perhitungan berdasarkan TER
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    Penghasilan Bruto
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    Rp {formatRupiah(monthly.grossIncome)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    Kategori TER
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {monthly.terCategory}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    TER
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {formatPercent(monthly.terRate)}
                  </span>
                </div>
              </div>

              {/* Formula */}
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Rumus simulasi
                </p>

                <p className="mt-3 text-base font-medium text-blue-950">
                  Rp {formatRupiah(monthly.grossIncome)}
                  {" × "}
                  {formatPercent(monthly.terRate)}
                </p>

                <div className="my-3 border-t border-blue-100" />

                <p className="text-lg font-bold text-slate-950">
                  = Rp {formatRupiah(monthly.tax)}
                </p>
              </div>

              {/* Result */}
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-900 p-4 text-white">
                <span className="text-sm">
                  PPh 21 Masa Pajak
                </span>

                <span className="text-base font-bold">
                  Rp {formatRupiah(monthly.tax)}
                </span>
              </div>
            </div>
          )}

          {/* Final */}
          {final && (
            <div className="pt-5">
              <p className="text-sm font-semibold text-blue-600">
                MASA PAJAK TERAKHIR
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Perhitungan akhir tahun
              </h3>

              <div className="mt-4 space-y-3">
                <DetailRow
                  label="Penghasilan Bruto"
                  value={final.grossIncome}
                />

                <DetailRow
                  label="Biaya Jabatan"
                  value={final.jobExpense}
                  negative
                />

                <DetailRow
                  label="Iuran Pensiun / Hari Tua"
                  value={final.pensionContribution}
                  negative
                />

                <DetailRow
                  label="Zakat / Sumbangan Keagamaan"
                  value={final.religiousContribution}
                  negative
                />

                <DetailRow
                  label="Penghasilan Neto"
                  value={final.netIncome}
                  emphasized
                />

                <DetailRow
                  label="PTKP"
                  value={final.ptkp}
                  negative
                />

                <DetailRow
                  label="PKP"
                  value={final.taxableIncome}
                  emphasized
                />
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Perhitungan PPh
                </p>

                <div className="mt-4 space-y-3">
                  <DetailRow
                    label="PPh berdasarkan Pasal 17"
                    value={final.annualTax}
                  />

                  <DetailRow
                    label="PPh yang sudah dipotong"
                    value={final.previousTaxWithheld}
                    negative
                  />
                </div>

                <div className="my-4 border-t border-blue-100" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    PPh 21 Masa Terakhir
                  </span>

                  <span className="text-base font-bold text-slate-950">
                    Rp {formatRupiah(final.finalTax)}
                  </span>
                </div>

                {final.overpayment > 0 && (
                  <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3">
                    <p className="text-xs leading-5 text-green-800">
                      Terdapat kelebihan pemotongan sebesar{" "}
                      <strong>
                        Rp {formatRupiah(final.overpayment)}
                      </strong>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Part Year */}
          {partYear && (
            <div className="pt-5">
              <p className="text-sm font-semibold text-blue-600">
                MASA PAJAK TERAKHIR — PART-YEAR
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Perhitungan penghasilan sebagian tahun
              </h3>

              <div className="mt-4 space-y-3">
                <DetailRow
                  label="Penghasilan Bruto"
                  value={partYear.grossIncome}
                />

                <DetailRow
                  label="Biaya Jabatan"
                  value={partYear.jobExpense}
                  negative
                />

                <DetailRow
                  label="Iuran Pensiun / Hari Tua"
                  value={partYear.pensionContribution}
                  negative
                />

                <DetailRow
                  label="Zakat / Sumbangan Keagamaan"
                  value={partYear.religiousContribution}
                  negative
                />

                <DetailRow
                  label="Penghasilan Neto Aktual"
                  value={partYear.netIncome}
                  emphasized
                />

                <DetailRow
                  label="Neto Disetahunkan"
                  value={partYear.annualizedNetIncome}
                  emphasized
                />

                <DetailRow
                  label="PTKP"
                  value={partYear.ptkp}
                  negative
                />

                <DetailRow
                  label="PKP"
                  value={partYear.taxableIncome}
                  emphasized
                />
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Perhitungan PPh
                </p>

                <div className="mt-4 space-y-3">
                  <DetailRow
                    label="PPh berdasarkan penghasilan disetahunkan"
                    value={partYear.annualTax}
                  />

                  <DetailRow
                    label="PPh setelah prorata"
                    value={partYear.proratedTax}
                  />

                  <DetailRow
                    label="PPh yang sudah dipotong"
                    value={partYear.previousTaxWithheld}
                    negative
                  />
                </div>

                <div className="my-4 border-t border-blue-100" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    PPh 21 Masa Terakhir
                  </span>

                  <span className="text-base font-bold text-slate-950">
                    Rp {formatRupiah(partYear.finalTax)}
                  </span>
                </div>

                {partYear.overpayment > 0 && (
                  <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3">
                    <p className="text-xs leading-5 text-green-800">
                      Terdapat kelebihan pemotongan sebesar{" "}
                      <strong>
                        Rp {formatRupiah(partYear.overpayment)}
                      </strong>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Educational note */}
          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs leading-5 text-amber-800">
              <strong>Catatan:</strong> Detail ini menampilkan
              hasil perhitungan dari simulator berdasarkan
              data yang Anda masukkan. Hasil bukan merupakan
              bukti potong atau dokumen perpajakan resmi.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

interface DetailRowProps {
  label: string;
  value: number;
  negative?: boolean;
  emphasized?: boolean;
}

function DetailRow({
  label,
  value,
  negative = false,
  emphasized = false,
}: DetailRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl p-4 ${
        emphasized
          ? "bg-blue-50"
          : "bg-slate-50"
      }`}
    >
      <span
        className={`text-sm ${
          emphasized
            ? "font-semibold text-slate-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          emphasized
            ? "font-bold text-slate-950"
            : "font-semibold text-slate-900"
        }`}
      >
        {negative && value > 0 ? "- " : ""}
        Rp {formatRupiah(value)}
      </span>
    </div>
  );
}