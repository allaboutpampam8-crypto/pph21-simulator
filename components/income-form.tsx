"use client";

export type PayrollTreatment =
  | "GROSS"
  | "GROSS_UP";

export interface IncomeFormValues {
  salary: number;
  allowance: number;
  overtime: number;
  holidayAllowance: number;
  bonus: number;
  other: number;
}

export interface PayrollTreatmentValues {
  salary: PayrollTreatment;
  allowance: PayrollTreatment;
  overtime: PayrollTreatment;
  holidayAllowance: PayrollTreatment;
  bonus: PayrollTreatment;
  other: PayrollTreatment;
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

  payrollTreatments: PayrollTreatmentValues;

  onChange: (
    field: keyof IncomeFormValues,
    value: number,
  ) => void;

  onDeductionChange: (
    field: keyof FinalDeductionValues,
    value: number,
  ) => void;

  onFinalGrossIncomeChange: (
    value: number,
  ) => void;

  onPayrollTreatmentChange: (
    field: keyof PayrollTreatmentValues,
    value: PayrollTreatment,
  ) => void;
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
    description:
      "Tunjangan yang masuk sebagai bruto",
  },
  {
    key: "overtime",
    label: "Lembur",
    description:
      "Pembayaran lembur",
  },
  {
    key: "holidayAllowance",
    label: "THR",
    description:
      "Tunjangan Hari Raya",
  },
  {
    key: "bonus",
    label: "Bonus",
    description:
      "Bonus atau insentif",
  },
  {
    key: "other",
    label: "Penghasilan Lainnya",
    description:
      "Komponen penghasilan lainnya",
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

function formatInputValue(
  value: number,
) {
  if (value === 0) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID",
  ).format(value);
}

function parseInputValue(
  value: string,
) {
  const digits =
    value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits);
}

function formatRupiah(
  value: number,
) {
  return new Intl.NumberFormat(
    "id-ID",
  ).format(value);
}

export default function IncomeForm({
  values,
  deductions,
  isFinalMonth,
  finalGrossIncome,
  payrollTreatments,
  onChange,
  onDeductionChange,
  onFinalGrossIncomeChange,
  onPayrollTreatmentChange,
}: IncomeFormProps) {
  const total =
    Object.values(values).reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm sm:p-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-5">
        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
            02
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {isFinalMonth
                ? "Perhitungan akhir"
                : "Masa pajak"}
            </p>

            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
              {isFinalMonth
                ? "Penghasilan Periode"
                : "Penghasilan Bulan Ini"}
            </h2>
          </div>

        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isFinalMonth
            ? "Masukkan total penghasilan bruto selama periode yang diperhitungkan. Rincian penghasilan bulan berjalan tidak diperlukan pada mode ini."
            : "Masukkan seluruh komponen penghasilan bruto yang Anda terima pada masa pajak ini."}
        </p>
      </div>


      {/* =====================================================
          REGULAR MONTH
      ====================================================== */}

      {!isFinalMonth && (
        <>
          <div className="mb-3.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Komponen Penghasilan
            </p>

            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Isi yang Anda terima
            </span>
          </div>


          <div className="space-y-3.5">

            {fields.map((field) => {
              const treatment =
                payrollTreatments[field.key];

              const hasValue = values[field.key] > 0;

              return (
                <div
                  key={field.key}
                  className={`rounded-2xl border p-4 transition-all ${
                    hasValue
                      ? "border-blue-200/80 bg-blue-50/20 shadow-xs"
                      : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80 hover:border-slate-300/80"
                  }`}
                >

                  {/* -----------------------------------------
                      Income Header
                  ------------------------------------------ */}

                  <div className="mb-2.5 flex items-start justify-between gap-4">

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

                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      Rp
                    </span>

                  </div>


                  {/* -----------------------------------------
                      Income Amount
                  ------------------------------------------ */}

                  <input
                    id={field.key}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatInputValue(
                      values[field.key],
                    )}
                    onChange={(event) =>
                      onChange(
                        field.key,
                        parseInputValue(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-right font-mono text-base font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-lg"
                  />


                  {/* -----------------------------------------
                      Payroll Treatment
                  ------------------------------------------ */}

                  {values[field.key] > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">

                      <p className="mb-2 text-xs font-semibold text-slate-600">
                        Perlakuan Payroll
                      </p>

                      <div className="grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onPayrollTreatmentChange(
                              field.key,
                              "GROSS",
                            )
                          }
                          className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                            treatment === "GROSS"
                              ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          GROSS
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onPayrollTreatmentChange(
                              field.key,
                              "GROSS_UP",
                            )
                          }
                          className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                            treatment === "GROSS_UP"
                              ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          GROSS-UP
                        </button>

                      </div>

                    </div>
                  )}


                  {/* -----------------------------------------
                      GROSS-UP INFORMATION
                  ------------------------------------------ */}

                  {values[field.key] > 0 &&
                    treatment === "GROSS_UP" && (
                      <div className="mt-3.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5">

                        <p className="text-xs font-semibold text-amber-900">
                          Mekanisme Gross-Up
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-amber-700">
                          Nilai yang Anda masukkan adalah
                          penghasilan sebelum tunjangan PPh.
                          Tunjangan PPh akan dihitung otomatis
                          oleh simulator.
                        </p>

                        <div className="mt-2.5 rounded-lg border border-amber-200/60 bg-white/80 p-3 shadow-xs">

                          <div className="flex items-start gap-2">

                            <div className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                              i
                            </div>

                            <p className="text-[11px] leading-5 text-amber-800">
                              <strong>
                                Tidak perlu memasukkan
                                tunjangan pajak secara manual.
                              </strong>{" "}
                              Simulator akan menghitung
                              tunjangan PPh dan melakukan
                              penyesuaian Gross-Up sesuai
                              posisi penghasilan kumulatif.
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                </div>
              );
            })}

          </div>


          {/* =================================================
              GROSS TOTAL
          ================================================== */}

          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-white shadow-sm sm:p-6 border border-slate-800">

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Penghasilan Bruto Bulan Ini
              </p>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Rp {formatRupiah(total)}
            </p>

          </div>


          {/* =================================================
              EDUCATIONAL NOTE
          ================================================== */}

          <div className="mt-4 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-4.5">

            <p className="text-xs leading-5 text-blue-900">
              <strong>GROSS</strong> berarti komponen
              penghasilan ditanggung pajaknya oleh pegawai.
              <br />

              <strong>GROSS-UP</strong> berarti terdapat
              tunjangan pajak dari pemberi kerja.
            </p>

            <p className="mt-2 text-[11px] leading-5 text-blue-800">
              Pada mode GROSS-UP, cukup masukkan
              penghasilan sebelum tunjangan PPh.
              Tunjangan pajak dihitung otomatis oleh
              simulator.
            </p>

            <p className="mt-2 text-[11px] leading-5 text-blue-700">
              Pilihan GROSS / GROSS-UP digunakan untuk
              simulasi mekanisme payroll dan tidak mengubah
              rumus PPh 21 resmi.
            </p>

          </div>
        </>
      )}


      {/* =====================================================
          FINAL PERIOD
      ====================================================== */}

      {isFinalMonth && (
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-5">

          <div className="mb-4">

            <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-xs">
              Input utama
            </span>

            <p className="mt-2.5 text-base font-bold text-blue-950">
              Total Penghasilan Bruto Selama Periode
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              Masukkan total penghasilan bruto dari seluruh masa pajak
              yang diperhitungkan sampai masa pajak terakhir.
            </p>

          </div>


          <div className="mb-2 flex items-start justify-between gap-4">

            <label
              htmlFor="finalGrossIncome"
              className="text-sm font-semibold text-slate-800"
            >
              Total Penghasilan Bruto Periode
            </label>

            <span className="rounded-md bg-blue-100/70 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Rp
            </span>

          </div>


          <input
            id="finalGrossIncome"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatInputValue(
              finalGrossIncome,
            )}
            onChange={(event) =>
              onFinalGrossIncomeChange(
                parseInputValue(
                  event.target.value,
                ),
              )
            }
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3.5 text-right font-mono text-xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />


          <p className="mt-2 text-xs leading-5 text-blue-700">
            Contoh: jika total bruto dari Januari sampai masa pajak
            terakhir adalah Rp240.000.000, masukkan Rp240.000.000 di sini.
          </p>

        </div>
      )}


      {/* =====================================================
          FINAL DEDUCTIONS
      ====================================================== */}

      {isFinalMonth && (
        <div className="mt-6">

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Data tambahan
            </p>

            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
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
                className="rounded-2xl border border-blue-100/80 bg-blue-50/40 p-4 transition-all hover:bg-blue-50/70"
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

                  <span className="rounded-md bg-blue-100/60 px-2 py-0.5 text-xs font-semibold text-blue-700">
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
                  className="w-full rounded-xl border border-blue-200/80 bg-white px-4 py-3 text-right font-mono text-base font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>
            ))}

          </div>


          <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">

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