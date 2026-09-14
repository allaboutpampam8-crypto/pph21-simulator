"use client";

export interface IncomeFormValues {
  salary: number;
  allowance: number;
  overtime: number;
  holidayAllowance: number;
  bonus: number;
  other: number;
}

export interface FinalDeductionValues {
  pensionContribution: number;
  religiousContribution: number;
  previousTaxWithheld: number;
}

interface IncomeFormProps {
  values: IncomeFormValues;
  deductions: FinalDeductionValues;
  isFinalMonth: boolean;
  finalGrossIncome: number;

  onChange: (
    field: keyof IncomeFormValues,
    value: number,
  ) => void;

  onDeductionChange: (
    field: keyof FinalDeductionValues,
    value: number,
  ) => void;

  onFinalGrossIncomeChange: (value: number) => void;
}

const fields: {
  key: keyof IncomeFormValues;
  label: string;
  description: string;
}[] = [
  {
    key: "salary",
    label: "Gaji Pokok",
    description: "Penghasilan tetap",
  },
  {
    key: "allowance",
    label: "Tunjangan",
    description: "Tunjangan yang masuk sebagai bruto",
  },
  {
    key: "overtime",
    label: "Lembur",
    description: "Pembayaran lembur",
  },
  {
    key: "holidayAllowance",
    label: "THR",
    description: "Tunjangan Hari Raya",
  },
  {
    key: "bonus",
    label: "Bonus",
    description: "Bonus atau insentif",
  },
  {
    key: "other",
    label: "Penghasilan Lainnya",
    description: "Komponen penghasilan lainnya",
  },
];

const deductionFields: {
  key: keyof FinalDeductionValues;
  label: string;
  description: string;
}[] = [
  {
    key: "pensionContribution",
    label: "Iuran Pensiun / Hari Tua",
    description:
      "Iuran yang memenuhi ketentuan sebagai pengurang",
  },
  {
    key: "religiousContribution",
    label: "Zakat / Sumbangan Keagamaan Wajib",
    description:
      "Yang dibayarkan melalui pemberi kerja dan memenuhi ketentuan",
  },
  {
    key: "previousTaxWithheld",
    label: "PPh 21 yang Sudah Dipotong",
    description:
      "PPh 21 yang telah dipotong sebelum masa pajak terakhir",
  },
];

function formatInputValue(value: number) {
  if (value === 0) {
    return "";
  }

  return new Intl.NumberFormat("id-ID").format(value);
}

function parseInputValue(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function IncomeForm({
  values,
  deductions,
  isFinalMonth,
  finalGrossIncome,
  onChange,
  onDeductionChange,
  onFinalGrossIncomeChange,
}: IncomeFormProps) {
  const total = Object.values(values).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
            02
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {isFinalMonth ? "Perhitungan akhir" : "Masa pajak"}
            </p>

            <h2 className="mt-0.5 text-xl font-bold text-slate-900">
              {isFinalMonth ? "Penghasilan Periode" : "Penghasilan Bulan Ini"}
            </h2>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isFinalMonth
            ? "Masukkan total penghasilan bruto selama periode yang diperhitungkan. Rincian penghasilan bulan berjalan tidak diperlukan pada mode ini."
            : "Masukkan seluruh komponen penghasilan bruto yang Anda terima pada masa pajak ini."}
        </p>
      </div>

      {/* Regular-month income */}
      {!isFinalMonth && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Komponen Penghasilan
            </p>
            <span className="text-xs text-slate-400">
              Isi yang Anda terima
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.key}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor={field.key}
                      className="text-sm font-semibold text-slate-800"
                    >
                      {field.label}
                    </label>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {field.description}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    Rp
                  </span>
                </div>

                <input
                  id={field.key}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatInputValue(values[field.key])}
                  onChange={(event) =>
                    onChange(
                      field.key,
                      parseInputValue(event.target.value),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-right text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            ))}
          </div>

          {/* Regular-month gross total */}
          <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">
              Total Penghasilan Bruto Bulan Ini
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight">
              Rp {formatRupiah(total)}
            </p>
          </div>
        </>
      )}

      {/* Final-period income */}
      {isFinalMonth && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-4">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
              Input utama
            </span>
            <p className="text-sm font-semibold text-blue-900">
              Total Penghasilan Bruto Selama Periode
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              Masukkan total penghasilan bruto dari seluruh masa pajak yang
              diperhitungkan sampai masa pajak terakhir.
            </p>
          </div>

          <div className="mb-2 flex items-start justify-between gap-4">
            <label
              htmlFor="finalGrossIncome"
              className="text-sm font-semibold text-slate-800"
            >
              Total Penghasilan Bruto Periode
            </label>

            <span className="text-xs font-medium text-slate-400">
              Rp
            </span>
          </div>

          <input
            id="finalGrossIncome"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatInputValue(finalGrossIncome)}
            onChange={(event) =>
              onFinalGrossIncomeChange(
                parseInputValue(event.target.value),
              )
            }
            className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-right text-lg font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs leading-5 text-blue-700">
            Contoh: jika total bruto dari Januari sampai masa pajak terakhir
            adalah Rp240.000.000, masukkan Rp240.000.000 di sini.
          </p>
        </div>
      )}

      {/* Final deductions */}
      {isFinalMonth && (
        <div className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Data tambahan
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Pengurang & Potongan
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Isi jika ada. Jika tidak ada, biarkan Rp0.
            </p>
          </div>

          <div className="space-y-3">
            {deductionFields.map((field) => (
              <div
                key={field.key}
                className="rounded-2xl border border-blue-100 bg-blue-50 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor={field.key}
                      className="text-sm font-semibold text-slate-800"
                    >
                      {field.label}
                    </label>

                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {field.description}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    Rp
                  </span>
                </div>

                <input
                  id={field.key}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatInputValue(
                    deductions[field.key],
                  )}
                  onChange={(event) =>
                    onDeductionChange(
                      field.key,
                      parseInputValue(
                        event.target.value,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-right text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs leading-5 text-amber-800">
              <strong>Catatan:</strong> Biaya jabatan
              dihitung otomatis oleh simulator sesuai ketentuan yang berlaku.
              Anda tidak perlu memasukkannya secara manual.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}