"use client";

import { useState } from "react";
import type { TaxSimulationResult } from "@/lib/tax-engine/types";

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
          <p className="text-sm font-semibold tracking-wide text-slate-500">
            🔎 DETAIL PERHITUNGAN
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Lihat cara angka PPh 21 dihitung
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Bagian ini menampilkan angka pembentuk dan rumus yang digunakan
            simulator. Buka jika Anda ingin memeriksa perhitungannya secara
            lebih rinci.
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ↓
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 sm:px-6 sm:pb-6">
          {/* =========================================================
              MONTHLY
          ========================================================= */}
          {monthly && (
            <div className="pt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Masa Pajak Biasa
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Perhitungan PPh 21 dengan TER
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Pada masa pajak biasa, PPh 21 dihitung berdasarkan penghasilan
                  bruto masa pajak dan TER yang berlaku.
                </p>
              </div>

              {/* Step 1 */}
              <div className="mt-5">
                <StepTitle number="1" title="Penghasilan bruto" />

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <DetailRow
                    label="Total Penghasilan Bruto"
                    value={monthly.grossIncome}
                    emphasized
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="mt-5">
                <StepTitle number="2" title="TER yang digunakan" />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailRow
                    label="Kategori TER"
                    textValue={monthly.terCategory}
                  />

                  <DetailRow
                    label="TER yang Berlaku"
                    textValue={formatPercent(monthly.terRate)}
                    emphasized
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="mt-5">
                <StepTitle number="3" title="Perhitungan PPh 21" />

                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Rumus
                  </p>

                  <div className="mt-4 space-y-3">
                    <FormulaRow
                      label="Penghasilan Bruto"
                      value={`Rp ${formatRupiah(monthly.grossIncome)}`}
                    />

                    <FormulaRow
                      label="× TER"
                      value={formatPercent(monthly.terRate)}
                    />

                    <div className="border-t border-blue-100 pt-3">
                      <FormulaRow
                        label="PPh 21 Masa Pajak"
                        value={`Rp ${formatRupiah(monthly.tax)}`}
                        emphasized
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              FINAL YEAR
          ========================================================= */}
          {final && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Masa Pajak Terakhir
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Perhitungan PPh 21 akhir tahun
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Pada masa pajak terakhir, simulator menggunakan perhitungan
                  PPh tahunan dan memperhitungkan PPh yang sudah dipotong
                  sebelumnya.
                </p>
              </div>

              {/* Step 1 */}
              <div className="mt-5">
                <StepTitle number="1" title="Pembentukan penghasilan neto" />

                <div className="mt-3 space-y-2">
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
                </div>
              </div>

              {/* Step 2 */}
              <div className="mt-5">
                <StepTitle
                  number="2"
                  title="Pembentukan Penghasilan Kena Pajak"
                />

                <div className="mt-3 space-y-2">
                  <DetailRow label="Penghasilan Neto" value={final.netIncome} />

                  <DetailRow label="PTKP" value={final.ptkp} negative />

                  <DetailRow
                    label="Penghasilan Kena Pajak (PKP)"
                    value={final.taxableIncome}
                    emphasized
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="mt-5">
                <StepTitle number="3" title="Pembentukan PPh 21" />

                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="space-y-2">
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

                  <DetailRow
                    label="PPh 21 Masa Terakhir"
                    value={final.finalTax}
                    emphasized
                  />
                </div>

                {final.overpayment > 0 && (
                  <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs leading-5 text-green-800">
                      Terdapat kelebihan pemotongan sebesar{" "}
                      <strong>Rp {formatRupiah(final.overpayment)}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              PART YEAR
          ========================================================= */}
          {partYear && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Masa Pajak Terakhir — Part-Year
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Perhitungan untuk penghasilan sebagian tahun
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Perhitungan ini digunakan ketika penghasilan hanya diperoleh
                  selama sebagian tahun pajak.
                </p>
              </div>

              {/* Step 1 */}
              <div className="mt-5">
                <StepTitle number="1" title="Pembentukan penghasilan neto" />

                <div className="mt-3 space-y-2">
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
                </div>
              </div>

              {/* Step 2 */}
              <div className="mt-5">
                <StepTitle
                  number="2"
                  title="Penyesuaian penghasilan untuk perhitungan tahunan"
                />

                <div className="mt-3 space-y-2">
                  <DetailRow
                    label="Neto Disetahunkan"
                    value={partYear.annualizedNetIncome}
                    emphasized
                  />

                  <DetailRow label="PTKP" value={partYear.ptkp} negative />

                  <DetailRow
                    label="Penghasilan Kena Pajak (PKP)"
                    value={partYear.taxableIncome}
                    emphasized
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="mt-5">
                <StepTitle number="3" title="Pembentukan PPh 21" />

                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="space-y-2">
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

                  <DetailRow
                    label="PPh 21 Masa Terakhir"
                    value={partYear.finalTax}
                    emphasized
                  />
                </div>

                {partYear.overpayment > 0 && (
                  <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs leading-5 text-green-800">
                      Terdapat kelebihan pemotongan sebesar{" "}
                      <strong>Rp {formatRupiah(partYear.overpayment)}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              FOOTNOTE
          ========================================================= */}
          <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs leading-5 text-amber-800">
              <strong>Catatan:</strong> bagian ini merupakan jejak perhitungan
              dari simulator berdasarkan data yang dimasukkan. Hasil simulasi
              bukan merupakan bukti potong atau dokumen perpajakan resmi.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ===============================================================
   STEP TITLE
=============================================================== */

interface StepTitleProps {
  number: string;
  title: string;
}

function StepTitle({ number, title }: StepTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
        {number}
      </div>

      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    </div>
  );
}

/* ===============================================================
   DETAIL ROW
=============================================================== */

interface DetailRowProps {
  label: string;
  value?: number;
  textValue?: string;
  negative?: boolean;
  emphasized?: boolean;
}

function DetailRow({
  label,
  value,
  textValue,
  negative = false,
  emphasized = false,
}: DetailRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl p-4 ${
        emphasized ? "bg-white ring-1 ring-blue-100" : "bg-slate-50"
      }`}
    >
      <span
        className={`text-sm ${
          emphasized ? "font-semibold text-slate-700" : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-right text-sm ${
          emphasized
            ? "font-bold text-slate-950"
            : "font-semibold text-slate-900"
        }`}
      >
        {textValue !== undefined
          ? textValue
          : value !== undefined
            ? `${negative && value > 0 ? "- " : ""}Rp ${formatRupiah(value)}`
            : "-"}
      </span>
    </div>
  );
}

/* ===============================================================
   FORMULA ROW
=============================================================== */

interface FormulaRowProps {
  label: string;
  value: string;
  emphasized?: boolean;
}

function FormulaRow({ label, value, emphasized = false }: FormulaRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-sm ${
          emphasized ? "font-semibold text-slate-800" : "text-slate-600"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-right ${
          emphasized
            ? "text-base font-bold text-slate-950"
            : "text-sm font-semibold text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
