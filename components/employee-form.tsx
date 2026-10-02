"use client";

import type { TaxpayerStatus } from "@/lib/tax-engine/types";

interface EmployeeFormProps {
  status: TaxpayerStatus;
  month: number;
  isFinalMonth: boolean;
  monthsWorked: number;
  taxSubjectStartedMidYear: boolean;

  onStatusChange: (status: TaxpayerStatus) => void;
  onMonthChange: (month: number) => void;
  onFinalMonthChange: (value: boolean) => void;
  onMonthsWorkedChange: (value: number) => void;
  onTaxSubjectStartedMidYearChange: (value: boolean) => void;
}

const statusOptions: TaxpayerStatus[] = [
  "TK/0",
  "TK/1",
  "TK/2",
  "TK/3",
  "K/0",
  "K/1",
  "K/2",
  "K/3",
];

const monthOptions = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function EmployeeForm({
  status,
  month,
  isFinalMonth,
  monthsWorked,
  taxSubjectStartedMidYear,
  onStatusChange,
  onMonthChange,
  onFinalMonthChange,
  onMonthsWorkedChange,
  onTaxSubjectStartedMidYearChange,
}: EmployeeFormProps) {
  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
            01
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Data simulasi
            </p>

            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
              Data Pegawai
            </h2>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Tentukan status PTKP dan masa pajak yang ingin Anda simulasikan.
        </p>
      </div>

      {/* Basic tax data */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Status PTKP
          </label>

          <div className="relative">
            <select
              id="status"
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as TaxpayerStatus)
              }
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 pr-10 text-sm font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            Contoh: TK/0 = tidak kawin, tanpa tanggungan.
          </p>
        </div>

        <div>
          <label
            htmlFor="month"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Masa Pajak
          </label>

          <div className="relative">
            <select
              id="month"
              value={month}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 pr-10 text-sm font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              {monthOptions.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            Pilih bulan yang ingin Anda hitung.
          </p>
        </div>
      </div>

      {/* Final month mode */}
      <div
        className={`mt-5 rounded-2xl border p-4 transition-all duration-200 ${
          isFinalMonth
            ? "border-blue-300/80 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/10"
            : "border-slate-200/90 bg-white hover:border-slate-300"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <input
            id="isFinalMonth"
            type="checkbox"
            checked={isFinalMonth}
            onChange={(event) => onFinalMonthChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 transition focus:ring-blue-500 cursor-pointer"
          />

          <div className="min-w-0">
            <label
              htmlFor="isFinalMonth"
              className="cursor-pointer text-sm font-bold text-slate-800"
            >
              Saya sedang menghitung masa pajak terakhir
            </label>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Gunakan pilihan ini jika Anda ingin menghitung PPh 21 pada masa pajak terakhir
              dan melakukan perhitungan akhir berdasarkan total penghasilan selama periode.
            </p>
          </div>
        </div>
      </div>

      {/* Final mode explanation and settings */}
      {isFinalMonth && (
        <div className="mt-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4.5 sm:p-5">
          <div className="mb-4 rounded-xl border border-blue-100 bg-white p-4 shadow-xs">
            <p className="text-sm font-semibold text-blue-950">
              Mode perhitungan akhir
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Pada masa pajak terakhir, simulator menggunakan total penghasilan
              bruto selama periode dan membandingkannya dengan PPh 21 yang
              sudah dipotong sebelumnya.
            </p>
          </div>

          <div>
            <label
              htmlFor="monthsWorked"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Berapa bulan Anda menerima penghasilan tahun ini?
            </label>

            <div className="relative">
              <select
                id="monthsWorked"
                value={monthsWorked}
                onChange={(event) =>
                  onMonthsWorkedChange(Number(event.target.value))
                }
                className="w-full appearance-none rounded-2xl border border-blue-200/80 bg-white px-4 py-3.5 pr-10 text-sm font-medium text-slate-900 outline-none transition-all hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (monthCount) => (
                    <option key={monthCount} value={monthCount}>
                      {monthCount} bulan
                    </option>
                  ),
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-blue-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              Hitung berdasarkan jumlah bulan Anda menerima penghasilan dalam
              tahun pajak ini.
            </p>
          </div>

          {monthsWorked < 12 && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <input
                  id="taxSubjectStartedMidYear"
                  type="checkbox"
                  checked={taxSubjectStartedMidYear}
                  onChange={(event) =>
                    onTaxSubjectStartedMidYearChange(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 transition focus:ring-blue-500 cursor-pointer"
                />

                <div>
                  <label
                    htmlFor="taxSubjectStartedMidYear"
                    className="cursor-pointer text-sm font-semibold text-slate-800"
                  >
                    Kewajiban pajak saya baru dimulai tahun ini
                  </label>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Jika ya, penghasilan neto dapat disetahunkan dan pajaknya
                    disesuaikan dengan periode tersebut.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-blue-200/60 bg-blue-100/60 p-3.5">
            <p className="text-xs leading-5 text-blue-800">
              <strong>Catatan:</strong> bekerja kurang dari 12 bulan tidak
              otomatis berarti penghasilan harus disetahunkan. Simulator akan
              membedakan kondisi berdasarkan status kewajiban pajak.
            </p>
          </div>
        </div>
      )}

      {/* Tax year */}
      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <p className="text-sm font-semibold text-slate-800">
              Tahun Pajak 2026
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-xs">
            Konfigurasi aktif
          </span>
        </div>

        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Simulator saat ini menggunakan konfigurasi PPh 21 tahun 2026.
        </p>
      </div>
    </section>
  );
}
