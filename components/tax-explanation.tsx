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

  const salaryItem = incomeItems.find(
    (item) => item.type === "salary",
  );

  const salaryAmount = salaryItem?.amount ?? 0;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        {/* =====================================================
            HEADER
        ====================================================== */}
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

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            PPh 21 masa pajak dihitung berdasarkan total penghasilan bruto
            pada masa tersebut dan TER yang berlaku. Karena itu, ketika ada
            lembur, THR, bonus, atau penghasilan tambahan lainnya, total bruto
            dapat meningkat dan posisi TER juga dapat berubah.
          </p>
        </div>

        {/* =====================================================
            MAIN CALCULATION FLOW
        ====================================================== */}
        <div className="mt-6">
          <p className="text-sm font-bold text-slate-900">
            Dari mana angka PPh 21 ini berasal?
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Berikut alur sederhana perhitungan PPh 21 masa pajak.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  LANGKAH 1
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                  INPUT
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                Total Penghasilan Bruto
              </p>

              <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Rp {formatRupiah(grossIncome)}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Seluruh komponen penghasilan bruto pada masa pajak
                diperhitungkan bersama.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-blue-600">
                  LANGKAH 2
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-blue-600">
                  ENGINE
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                TER yang Berlaku
              </p>

              <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                {formatPercent(monthly.terRate)}
              </p>

              <p className="mt-2 text-xs leading-5 text-blue-700">
                Kategori TER {monthly.terCategory} untuk posisi total bruto
                tersebut.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  LANGKAH 3
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                  HASIL
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                PPh 21 Masa Pajak
              </p>

              <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Rp {formatRupiah(monthly.tax)}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Hasil simulasi PPh 21 untuk masa pajak ini.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            FORMULA
        ====================================================== */}
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-base">🧮</span>

            <div className="min-w-0">
              <p className="text-sm font-bold text-blue-900">
                Rumus sederhana yang digunakan
              </p>

              <div className="mt-3 rounded-xl bg-white p-3 text-center">
                <p className="text-xs font-medium text-slate-500">
                  PPh 21 Masa Pajak
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  Total Bruto × TER
                </p>

                <p className="mt-2 text-sm font-semibold text-blue-700">
                  Rp {formatRupiah(grossIncome)} ×{" "}
                  {formatPercent(monthly.terRate)}
                </p>

                <p className="mt-1 text-lg font-bold text-slate-950">
                  = Rp {formatRupiah(monthly.tax)}
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-blue-700">
                <strong>Penting:</strong> rumus di atas menjelaskan
                perhitungan PPh 21 masa pajak menggunakan total bruto dan TER.
                Ini bukan berarti setiap komponen seperti bonus atau lembur
                memiliki tarif PPh tersendiri.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            SOURCE OF GROSS
        ====================================================== */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Dari mana Total Bruto berasal?
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Simulator menggabungkan komponen penghasilan yang Anda
                masukkan pada masa pajak ini.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              SUMBER ANGKA
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {incomeItems
              .filter((item) => item.amount > 0)
              .map((item) => (
                <div
                  key={`${item.type}-${item.sequence}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {getPaymentLabel(item)}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Input penghasilan
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    Rp {formatRupiah(item.amount)}
                  </p>
                </div>
              ))}

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Total Bruto
                </p>

                <p className="text-[11px] text-slate-400">
                  Hasil penggabungan seluruh komponen
                </p>
              </div>

              <p className="text-base font-bold text-slate-950">
                Rp {formatRupiah(grossIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ADDITIONAL INCOME
        ====================================================== */}
        {additionalPayments.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Ada penghasilan tambahan
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Komponen berikut menambah total bruto masa pajak.
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

        {/* =====================================================
            WHY TER CAN CHANGE
        ====================================================== */}
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-base">⚠️</span>

            <div>
              <p className="text-sm font-bold text-amber-900">
                Kenapa tambahan penghasilan bisa membuat PPh meningkat?
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Ketika bonus, lembur, THR, atau tunjangan menambah total bruto,
                posisi penghasilan pada tabel TER dapat berubah. Jika masuk
                ke rentang TER yang lebih tinggi, persentase yang digunakan
                pada total bruto tersebut juga menjadi lebih tinggi.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            SALARY VS ADDITIONAL INCOME
        ====================================================== */}
        {salaryAmount > 0 && additionalPayments.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-sm font-bold text-slate-900">
              Cara membaca simulasi ini
            </p>

            <div className="mt-3 space-y-3 text-xs leading-5 text-slate-600">
              <div className="flex gap-3">
                <span className="font-bold text-blue-600">01</span>

                <p>
                  Gaji dan komponen penghasilan lainnya membentuk total bruto
                  masa pajak.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600">02</span>

                <p>
                  Ketika ada penghasilan tambahan, total bruto menjadi lebih
                  besar sehingga posisi TER perlu dilihat kembali.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600">03</span>

                <p>
                  PPh 21 masa pajak kemudian dihitung berdasarkan total bruto
                  dan TER yang berlaku pada posisi tersebut.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN TAKEAWAY
        ====================================================== */}
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-base">✅</span>

            <div>
              <p className="text-sm font-bold text-blue-900">
                Jadi, bukan berarti bonus atau THR langsung dikenakan tarif
                pajak khusus.
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Yang berubah adalah total penghasilan bruto pada masa pajak
                dan, apabila melewati batas rentang TER, persentase TER yang
                berlaku pada total bruto tersebut.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          TRANSITION TO DETAILED SIMULATION
      ====================================================== */}
      {additionalPayments.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
          <p className="text-xs leading-5 text-slate-500">
            <strong className="text-slate-700">
              Lihat simulasi di bawah:
            </strong>{" "}
            bagian berikut akan menunjukkan perubahan bruto, TER, dan dampak
            PPh berdasarkan urutan pembayaran sebagai ilustrasi edukasi.
          </p>
        </div>
      )}
    </section>
  );
}