"use client";

import type {
  IncomeItem,
  MonthlyTaxResult,
} from "@/lib/tax-engine/types";

interface TaxExplanationProps {
  grossIncome: number;
  monthly: MonthlyTaxResult;
  incomeItems: IncomeItem[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(rate: number) {
  return `${rate * 100}%`;
}

function getPaymentLabel(item: IncomeItem) {
  switch (item.type) {
    case "salary":
      return "Gaji Pokok";
    case "allowance":
      return "Tunjangan";
    case "overtime":
      return "Lembur";
    case "holiday_allowance":
      return "THR";
    case "bonus":
      return "Bonus";
    case "incentive":
      return "Insentif";
    case "other":
      return "Penghasilan Lainnya";
    default:
      return item.name;
  }
}

export default function TaxExplanation({
  grossIncome,
  monthly,
  incomeItems,
}: TaxExplanationProps) {
  const additionalPayments = incomeItems.filter(
    (item) => item.type !== "salary" && item.amount > 0,
  );

  const additionalIncome = additionalPayments.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-base">
              💡
            </span>

            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Penjelasan
            </p>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
            Kenapa PPh 21 saya bisa naik?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Karena PPh 21 masa pajak menggunakan total penghasilan bruto pada
            masa tersebut. Ketika penghasilan bertambah, jumlah bruto dan
            posisi pada tabel TER dapat ikut berubah.
          </p>
        </div>

        {/* Simple flow */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              1 · Total bruto
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              Rp {formatRupiah(grossIncome)}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Semua penghasilan bruto pada masa pajak digabungkan.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-700">
              2 · TER saat ini
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {formatPercent(monthly.terRate)}
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Kategori TER {monthly.terCategory} untuk jumlah bruto tersebut.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              3 · PPh 21
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              Rp {formatRupiah(monthly.tax)}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Hasil simulasi masa pajak ini.
            </p>
          </div>
        </div>

        {/* Additional income summary */}
        {additionalPayments.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Ada penghasilan tambahan
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Penghasilan berikut menambah total bruto masa pajak.
                </p>
              </div>

              <p className="text-sm font-bold text-slate-900">
                +Rp {formatRupiah(additionalIncome)}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {additionalPayments.map((item) => (
                <span
                  key={`${item.type}-${item.sequence}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <span>{getPaymentLabel(item)}</span>
                  <span className="text-slate-400">
                    Rp {formatRupiah(item.amount)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main takeaway */}
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-base">⚠️</span>

            <div>
              <p className="text-sm font-bold text-amber-900">
                Bonus, lembur, THR, dan tunjangan bukan punya tarif PPh sendiri
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Komponen tersebut menambah penghasilan bruto pada masa pajak.
                Karena TER ditentukan berdasarkan jumlah bruto, kenaikan total
                bruto dapat membuat TER yang berlaku menjadi lebih tinggi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transition to detailed simulation */}
      {additionalPayments.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
          <p className="text-xs leading-5 text-slate-500">
            <strong className="text-slate-700">
              Lihat simulasi di bawah:
            </strong>{" "}
            kita akan melihat perubahan bruto, TER, dan dampak PPh berdasarkan
            urutan pembayaran sebagai ilustrasi edukasi.
          </p>
        </div>
      )}
    </section>
  );
}
