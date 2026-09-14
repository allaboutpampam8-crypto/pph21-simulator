"use client";

import { useState } from "react";

import EmployeeForm from "@/components/employee-form";
import IncomeForm, {
  type FinalDeductionValues,
  type IncomeFormValues,
} from "@/components/income-form";

import PaymentImpact from "@/components/payment-impact";
import PaymentOrderComparison from "@/components/payment-order-comparison";
import TaxExplanation from "@/components/tax-explanation";
import TaxCalculationDetail from "@/components/tax-calculation-detail";

import { simulateTax } from "@/lib/tax-engine";

import type {
  IncomeItem,
  TaxpayerStatus,
  TaxSimulationResult,
} from "@/lib/tax-engine/types";

const initialIncome: IncomeFormValues = {
  salary: 0,
  allowance: 0,
  overtime: 0,
  holidayAllowance: 0,
  bonus: 0,
  other: 0,
};

const TAX_YEAR = 2026;

function getIncomeTotal(values: IncomeFormValues) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [status, setStatus] = useState<TaxpayerStatus>("TK/0");

  const [month, setMonth] = useState<number>(9);

  const [isFinalMonth, setIsFinalMonth] = useState<boolean>(false);

  const [monthsWorked, setMonthsWorked] = useState<number>(12);

  const [taxSubjectStartedMidYear, setTaxSubjectStartedMidYear] =
    useState<boolean>(false);

  const [income, setIncome] = useState<IncomeFormValues>(initialIncome);

  const [finalGrossIncome, setFinalGrossIncome] = useState<number>(0);

  const [deductions, setDeductions] = useState<FinalDeductionValues>({
    pensionContribution: 0,
    religiousContribution: 0,
    previousTaxWithheld: 0,
  });

  const [result, setResult] = useState<TaxSimulationResult | null>(null);

  const [simulationIncomeItems, setSimulationIncomeItems] = useState<
    IncomeItem[]
  >([]);

  const handleIncomeChange = (field: keyof IncomeFormValues, value: number) => {
    setIncome((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFinalGrossIncomeChange = (value: number) => {
    setFinalGrossIncome(value);
  };

  const handleDeductionChange = (
    field: keyof FinalDeductionValues,
    value: number,
  ) => {
    setDeductions((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSimulate = () => {
    const incomeItems = [
      {
        name: "Gaji Pokok",
        amount: income.salary,
        type: "salary" as const,
        sequence: 1,
      },
      {
        name: "Tunjangan",
        amount: income.allowance,
        type: "allowance" as const,
        sequence: 2,
      },
      {
        name: "Lembur",
        amount: income.overtime,
        type: "overtime" as const,
        sequence: 3,
      },
      {
        name: "THR",
        amount: income.holidayAllowance,
        type: "holiday_allowance" as const,
        sequence: 4,
      },
      {
        name: "Bonus",
        amount: income.bonus,
        type: "bonus" as const,
        sequence: 5,
      },
      {
        name: "Penghasilan Lainnya",
        amount: income.other,
        type: "other" as const,
        sequence: 6,
      },
    ].filter((item) => item.amount > 0);

    if (!isFinalMonth && incomeItems.length === 0) {
      setResult(null);
      return;
    }

    if (isFinalMonth && finalGrossIncome <= 0) {
      setResult(null);
      return;
    }

    setSimulationIncomeItems(incomeItems);

    const simulation = simulateTax(
      {
        profile: {
          taxYear: TAX_YEAR,
          status,
          month,
          isFinalMonth,
          monthsWorked,
          taxSubjectStartedMidYear,
        },

        incomeItems,

        finalGrossIncome: isFinalMonth ? finalGrossIncome : undefined,

        pensionContribution: deductions.pensionContribution,

        religiousContribution: deductions.religiousContribution,
      },
      {
        includePaymentImpact: !isFinalMonth,

        previousTaxWithheld: deductions.previousTaxWithheld,
      },
    );

    setResult(simulation);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              PPh 21 Simulator
            </p>

            <p className="text-xs text-slate-500">
              Simulasi edukasi pajak penghasilan
            </p>
          </div>

          <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {TAX_YEAR}
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Simulasi PPh 21
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Pahami PPh 21 Anda
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Simulasikan bagaimana gaji, lembur, THR, dan bonus memengaruhi
              potongan PPh 21 Anda.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM
      ====================================================== */}
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6">
          <EmployeeForm
            status={status}
            month={month}
            isFinalMonth={isFinalMonth}
            monthsWorked={monthsWorked}
            taxSubjectStartedMidYear={taxSubjectStartedMidYear}
            onStatusChange={setStatus}
            onMonthChange={setMonth}
            onFinalMonthChange={setIsFinalMonth}
            onMonthsWorkedChange={setMonthsWorked}
            onTaxSubjectStartedMidYearChange={setTaxSubjectStartedMidYear}
          />

          <IncomeForm
            values={income}
            deductions={deductions}
            isFinalMonth={isFinalMonth}
            finalGrossIncome={finalGrossIncome}
            onChange={handleIncomeChange}
            onDeductionChange={handleDeductionChange}
            onFinalGrossIncomeChange={handleFinalGrossIncomeChange}
          />

          <button
            type="button"
            onClick={handleSimulate}
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            Simulasikan PPh 21 →
          </button>

          {isFinalMonth && finalGrossIncome <= 0 && (
            <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Untuk masa pajak terakhir, isi{" "}
              <strong>Total Penghasilan Bruto Periode</strong>
              sebelum menjalankan simulasi.
            </p>
          )}

          {isFinalMonth &&
            finalGrossIncome > 0 &&
            finalGrossIncome < getIncomeTotal(income) && (
              <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-800">
                Total bruto periode tidak boleh lebih kecil daripada bruto masa
                pajak terakhir.
              </p>
            )}
        </div>

        {/* =====================================================
            RESULT
        ====================================================== */}
        {result && (
          <section className="mt-8">
            {/* =================================================
                MONTHLY RESULT
            ================================================== */}
            {result.monthly && (
              <>
                <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-blue-600">
                      HASIL SIMULASI
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      PPh 21 Masa Pajak
                    </h2>
                  </div>

                  {/* PPh */}
                  <div className="rounded-3xl bg-blue-50 p-6">
                    <p className="text-sm font-medium text-blue-700">
                      PPh 21 yang disimulasikan
                    </p>

                    <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                      Rp {formatRupiah(result.monthly.tax)}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Total Bruto</p>

                      <p className="mt-1 text-base font-bold text-slate-900">
                        Rp {formatRupiah(result.monthly.grossIncome)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Kategori TER</p>

                      <p className="mt-1 text-base font-bold text-slate-900">
                        {result.monthly.terCategory}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">TER Saat Ini</p>

                      <p className="mt-1 text-base font-bold text-slate-900">
                        {result.monthly.terRate * 100}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* =============================================
                    PAYMENT IMPACT 2.0
                ============================================== */}
                <TaxExplanation
                  grossIncome={result.monthly.grossIncome}
                  monthly={result.monthly}
                  incomeItems={simulationIncomeItems}
                />
                <TaxCalculationDetail result={result} />
                {result.paymentImpact && result.paymentImpact.length > 0 && (
                  <>
                    <PaymentImpact items={result.paymentImpact} />

                    <PaymentOrderComparison
                      taxYear={TAX_YEAR}
                      payments={simulationIncomeItems}
                      category={result.monthly.terCategory}
                    />
                  </>
                )}
              </>
            )}

            {/* =================================================
                FINAL RESULT
            ================================================== */}
            {result.final && (
              <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-blue-600">
                    HASIL PERHITUNGAN AKHIR
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    PPh 21 Masa Pajak Terakhir
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Perhitungan akhir membandingkan PPh 21 yang seharusnya
                    terutang selama periode perhitungan dengan PPh 21 yang sudah
                    dipotong sebelumnya.
                  </p>
                </div>

                {/* Final Tax Hero */}
                <div className="rounded-3xl bg-blue-50 p-6">
                  <p className="text-sm font-medium text-blue-700">
                    {result.final.finalTax > 0
                      ? "PPh 21 yang Masih Harus Dipotong"
                      : result.final.overpayment > 0
                        ? "Kelebihan Pemotongan PPh 21"
                        : "PPh 21 Final"}
                  </p>

                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                    Rp{" "}
                    {formatRupiah(
                      result.final.finalTax > 0
                        ? result.final.finalTax
                        : result.final.overpayment,
                    )}
                  </p>

                  <p className="mt-2 text-sm leading-5 text-blue-700">
                    {result.final.finalTax > 0
                      ? "Ini adalah selisih PPh 21 yang masih perlu dipotong pada masa pajak terakhir."
                      : result.final.overpayment > 0
                        ? "PPh 21 yang telah dipotong sebelumnya lebih besar daripada PPh 21 yang terutang."
                        : "PPh 21 yang sudah dipotong sebelumnya sama dengan PPh 21 yang terutang."}
                  </p>
                </div>

                {/* Annual Summary */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Penghasilan Bruto Periode
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.final.grossIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Penghasilan Neto</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.final.netIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">PTKP</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.final.ptkp)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">PKP</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.final.taxableIncome)}
                    </p>
                  </div>
                </div>

                {/* How the final tax is formed */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Bagaimana hasil akhirnya?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      PPh 21 terutang dibandingkan dengan jumlah PPh 21 yang
                      sudah dipotong pada masa-masa sebelumnya.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-600">
                        PPh 21 terutang selama periode
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Rp {formatRupiah(result.final.annualTax)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-600">
                        PPh 21 sudah dipotong
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Rp {formatRupiah(result.final.previousTaxWithheld)}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-900">
                          {result.final.finalTax > 0
                            ? "Masih harus dipotong"
                            : result.final.overpayment > 0
                              ? "Kelebihan pemotongan"
                              : "Selisih"}
                        </span>

                        <span className="text-base font-bold text-slate-900">
                          Rp{" "}
                          {formatRupiah(
                            result.final.finalTax > 0
                              ? result.final.finalTax
                              : result.final.overpayment,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overpayment */}
                {result.final.overpayment > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Terdapat kelebihan pemotongan
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-800">
                      Jumlah PPh 21 yang sudah dipotong lebih besar daripada PPh
                      21 yang terutang sebesar Rp{" "}
                      {formatRupiah(result.final.overpayment)}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                PART YEAR RESULT
            ================================================== */}
            {result.partYear && (
              <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-blue-600">
                    HASIL PERHITUNGAN AKHIR
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    PPh 21 Masa Pajak Terakhir
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Perhitungan ini menggunakan mekanisme part-year karena
                    penghasilan hanya diperoleh sebagian tahun.
                  </p>
                </div>

                {/* Part Year Tax */}
                <div className="rounded-3xl bg-blue-50 p-6">
                  <p className="text-sm font-medium text-blue-700">
                    PPh 21 Final
                  </p>

                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                    Rp {formatRupiah(result.partYear.finalTax)}
                  </p>
                </div>

                {/* Part Year Summary */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Penghasilan Bruto</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.grossIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Penghasilan Neto Aktual
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.netIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Neto Disetahunkan</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.annualizedNetIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">PKP</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.taxableIncome)}
                    </p>
                  </div>
                </div>

                {/* Part Year Detail */}
                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      PPh berdasarkan penghasilan disetahunkan
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      Rp {formatRupiah(result.partYear.annualTax)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      PPh setelah prorata
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      Rp {formatRupiah(result.partYear.proratedTax)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      PPh 21 yang sudah dipotong
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      Rp {formatRupiah(result.partYear.previousTaxWithheld)}
                    </span>
                  </div>
                </div>

                {/* Overpayment */}
                {result.partYear.overpayment > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Terdapat kelebihan pemotongan
                    </p>

                    <p className="mt-1 text-sm text-amber-800">
                      Rp {formatRupiah(result.partYear.overpayment)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}
        {!result && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">
              Hasil simulasi akan muncul di sini
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Masukkan minimal satu komponen penghasilan, kemudian tekan tombol
              Simulasikan PPh 21.
            </p>
          </div>
        )}

        {/* =====================================================
            DISCLAIMER
        ====================================================== */}
        <div className="mt-8 pb-10 text-center">
          <p className="mx-auto max-w-2xl text-xs leading-5 text-slate-400">
            Simulator ini dibuat untuk tujuan edukasi dan simulasi. Hasil dapat
            berbeda dengan perhitungan payroll sebenarnya apabila terdapat
            komponen, status, atau kondisi perpajakan yang belum tercakup dalam
            simulator.
          </p>
        </div>
      </div>
    </main>
  );
}
