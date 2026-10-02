"use client";

import { useState } from "react";

import EmployeeForm from "@/components/employee-form";
import IncomeForm, {
  type FinalDeductionValues,
  type IncomeFormValues,
  type PayrollTreatment,
  type PayrollTreatmentValues,
} from "@/components/income-form";

import PaymentImpact from "@/components/payment-impact";
import PaymentOrderComparison from "@/components/payment-order-comparison";
import TaxExplanation from "@/components/tax-explanation";
import TaxCalculationDetail from "@/components/tax-calculation-detail";

import { simulateTax } from "@/lib/tax-engine";
import { getTaxConfig } from "@/config/tax";
import { calculateGrossUpPayments } from "@/lib/tax-engine/gross-up-payment";

import type {
  GrossUpPayment,
  IncomeItem,
  TaxpayerStatus,
  TaxSimulationResult,
} from "@/lib/tax-engine/types";

import PayrollOrder, { type PayrollOrderKey } from "@/components/payroll-order";
import { formatPercent } from "@/lib/formatters";

// =====================================================
// INITIAL VALUES
// =====================================================

const initialIncome: IncomeFormValues = {
  salary: 0,
  allowance: 0,
  overtime: 0,
  holidayAllowance: 0,
  bonus: 0,
  other: 0,
};

// =====================================================
// INITIAL PAYROLL TREATMENT
// =====================================================

const initialPayrollTreatments: PayrollTreatmentValues = {
  salary: "GROSS",
  allowance: "GROSS",
  overtime: "GROSS",
  holidayAllowance: "GROSS",
  bonus: "GROSS",
  other: "GROSS",
};

// =====================================================
// TAX YEAR
// =====================================================

const TAX_YEAR = 2026;

// =====================================================
// HELPERS
// =====================================================

function getIncomeTotal(values: IncomeFormValues) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function PayrollDetail({
  label,
  value,
  textValue,
}: {
  label: string;
  value?: number;
  textValue?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300">
      <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
        {textValue ?? `Rp ${formatRupiah(value ?? 0)}`}
      </p>
    </div>
  );
}

// =====================================================
// INCOME DEFINITIONS
// =====================================================

const incomeDefinitions: {
  key: keyof IncomeFormValues;
  name: string;
  type: IncomeItem["type"];
  sequence: number;
}[] = [
  {
    key: "salary",
    name: "Gaji Pokok",
    type: "salary",
    sequence: 1,
  },

  {
    key: "allowance",
    name: "Tunjangan",
    type: "allowance",
    sequence: 2,
  },

  {
    key: "overtime",
    name: "Lembur",
    type: "overtime",
    sequence: 3,
  },

  {
    key: "holidayAllowance",
    name: "THR",
    type: "holiday_allowance",
    sequence: 4,
  },

  {
    key: "bonus",
    name: "Bonus",
    type: "bonus",
    sequence: 5,
  },

  {
    key: "other",
    name: "Penghasilan Lainnya",
    type: "other",
    sequence: 6,
  },
];

// =====================================================
// PAGE
// =====================================================

export default function Home() {
  // =====================================================
  // EMPLOYEE / TAX PROFILE
  // =====================================================

  const [status, setStatus] = useState<TaxpayerStatus>("TK/0");

  const [month, setMonth] = useState<number>(9);

  const [isFinalMonth, setIsFinalMonth] = useState<boolean>(false);

  const [monthsWorked, setMonthsWorked] = useState<number>(12);

  const [taxSubjectStartedMidYear, setTaxSubjectStartedMidYear] =
    useState<boolean>(false);

  // =====================================================
  // INCOME
  // =====================================================

  const [income, setIncome] = useState<IncomeFormValues>(initialIncome);

  // =====================================================
  // FINAL PERIOD
  // =====================================================

  const [finalGrossIncome, setFinalGrossIncome] = useState<number>(0);

  const [deductions, setDeductions] = useState<FinalDeductionValues>({
    pensionContribution: 0,
    religiousContribution: 0,
    previousTaxWithheld: 0,
  });

  // =====================================================
  // PAYROLL GROSS-UP STATE
  // =====================================================

  const [payrollTreatments, setPayrollTreatments] =
    useState<PayrollTreatmentValues>(initialPayrollTreatments);

  // =====================================================
  // PAYROLL ORDER
  // =====================================================

  const [payrollOrder, setPayrollOrder] = useState<PayrollOrderKey[]>([
    "salary",
    "allowance",
    "overtime",
    "holidayAllowance",
    "bonus",
    "other",
  ]);

  // =====================================================
  // RESULT
  // =====================================================

  const [result, setResult] = useState<TaxSimulationResult | null>(null);

  // =====================================================
  // SIMULATION INCOME ITEMS
  // =====================================================

  const [simulationIncomeItems, setSimulationIncomeItems] = useState<
    IncomeItem[]
  >([]);

  // =====================================================
  // HANDLERS
  // =====================================================

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

  const handlePayrollTreatmentChange = (
    field: keyof PayrollTreatmentValues,
    value: PayrollTreatment,
  ) => {
    setPayrollTreatments((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // =====================================================
  // SIMULATION
  // =====================================================

  const handleSimulate = () => {
    // -----------------------------------------------------
    // INCOME ITEMS
    // -----------------------------------------------------

    const incomeItems = incomeDefinitions
      .map((definition) => ({
        name: definition.name,

        amount: income[definition.key],

        type: definition.type,

        sequence: definition.sequence,
      }))
      .filter((item) => item.amount > 0);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!isFinalMonth && incomeItems.length === 0) {
      setResult(null);
      return;
    }

    if (isFinalMonth && finalGrossIncome <= 0) {
      setResult(null);
      return;
    }

    // =====================================================
    // PAYROLL PAYMENTS
    // =====================================================

    const payrollDefinitions = incomeDefinitions.reduce(
      (definitions, definition) => {
        definitions[definition.key] = definition;

        return definitions;
      },
      {} as Record<keyof IncomeFormValues, (typeof incomeDefinitions)[number]>,
    );

    /**
     * GROSS:
     * amount = bruto payment.
     *
     * GROSS_UP:
     * amount = penghasilan sebelum
     * tunjangan PPh.
     *
     * Tunjangan PPh dihitung otomatis
     * oleh tax engine.
     */

    const payrollPayments: GrossUpPayment[] = payrollOrder
      .map((key) => payrollDefinitions[key])
      .filter((definition) => income[definition.key] > 0)
      .map((definition) => {
        const treatment = payrollTreatments[definition.key];

        const payment: GrossUpPayment = {
          id: definition.key,

          name: definition.name,

          amount: income[definition.key],

          treatment,
        };

        return payment;
      });

    const hasPayrollAllocation = !isFinalMonth && payrollPayments.length > 0;

    // -----------------------------------------------------
    // EFFECTIVE INCOME ITEMS (GROSS-UP SYNCHRONIZATION)
    // -----------------------------------------------------

    let effectiveIncomeItems = incomeItems;
    const hasGrossUpPayment = payrollPayments.some(
      (payment) => payment.treatment === "GROSS_UP",
    );

    if (hasPayrollAllocation && hasGrossUpPayment) {
      const config = getTaxConfig(TAX_YEAR);
      const terCategory = config.TER_CATEGORY[status];
      const grossUpResults = calculateGrossUpPayments({
        taxYear: TAX_YEAR,
        category: terCategory,
        payments: payrollPayments,
      });

      const allowanceMap = new Map(
        grossUpResults.map((r) => [r.id, r.actualTaxAllowance]),
      );

      effectiveIncomeItems = incomeDefinitions
        .map((definition) => {
          const baseAmount = income[definition.key];
          const allowance = allowanceMap.get(definition.key) ?? 0;

          return {
            name: definition.name,
            amount: baseAmount + allowance,
            type: definition.type,
            sequence: definition.sequence,
          };
        })
        .filter((item) => item.amount > 0);
    }

    // -----------------------------------------------------
    // SAVE INCOME ITEMS
    // -----------------------------------------------------

    setSimulationIncomeItems(effectiveIncomeItems);

    // =====================================================
    // SIMULATE TAX
    // =====================================================

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

        incomeItems: effectiveIncomeItems,

        finalGrossIncome: isFinalMonth ? finalGrossIncome : undefined,

        pensionContribution: deductions.pensionContribution,

        religiousContribution: deductions.religiousContribution,
      },

      {
        includePaymentImpact: !isFinalMonth,

        includePayrollAllocation: hasPayrollAllocation,

        payrollPayments: hasPayrollAllocation ? payrollPayments : undefined,

        previousTaxWithheld: deductions.previousTaxWithheld,
      },
    );

    setResult(simulation);
  };

  // =====================================================
  // RENDER
  // =====================================================

  const payrollPayments = result?.payrollAllocation?.payments ?? [];
  const finalPayrollPayment = payrollPayments[payrollPayments.length - 1];
  const totalInitialTaxAllowance = payrollPayments.reduce(
    (total, payment) => total + payment.actualTaxAllowance,
    0,
  );
  const hasGrossUpPayment = payrollPayments.some(
    (payment) => payment.treatment === "GROSS_UP",
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-mono text-base font-extrabold text-white shadow-xs">
              %
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                PPh 21 Simulator
              </p>

              <p className="text-xs text-slate-500">
                Simulasi edukasi pajak penghasilan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            {TAX_YEAR}
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="border-b border-slate-200/60 bg-gradient-to-b from-blue-50/50 via-slate-50/40 to-slate-50">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              Simulasi PPh 21
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
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
          {/* =================================================
              EMPLOYEE FORM
          ================================================== */}

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

          {/* =================================================
              INCOME FORM
          ================================================== */}

          <IncomeForm
            values={income}
            deductions={deductions}
            isFinalMonth={isFinalMonth}
            finalGrossIncome={finalGrossIncome}
            payrollTreatments={payrollTreatments}
            onChange={handleIncomeChange}
            onDeductionChange={handleDeductionChange}
            onFinalGrossIncomeChange={handleFinalGrossIncomeChange}
            onPayrollTreatmentChange={handlePayrollTreatmentChange}
          />

          {/* =================================================
              PAYROLL ORDER
          ================================================== */}

          {!isFinalMonth &&
            Object.values(payrollTreatments).some(
              (treatment) => treatment === "GROSS_UP",
            ) && (
              <PayrollOrder
                items={incomeDefinitions.map((definition) => ({
                  key: definition.key,

                  label: definition.name,

                  amount: income[definition.key],
                }))}
                order={payrollOrder}
                onChange={setPayrollOrder}
              />
            )}

          {/* =================================================
              SIMULATE BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={handleSimulate}
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/35 active:scale-[0.99]"
          >
            Simulasikan PPh 21 →
          </button>

          {/* =================================================
              VALIDATION MESSAGE
          ================================================== */}

          {isFinalMonth && finalGrossIncome <= 0 && (
            <p className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-5 text-amber-800">
              Untuk masa pajak terakhir, isi{" "}
              <strong>Total Penghasilan Bruto Periode</strong> sebelum
              menjalankan simulasi.
            </p>
          )}

          {isFinalMonth &&
            finalGrossIncome > 0 &&
            finalGrossIncome < getIncomeTotal(income) && (
              <p className="mt-3 rounded-2xl border border-red-200/80 bg-red-50/70 p-3.5 text-xs leading-5 text-red-800">
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
                <div className="rounded-3xl border border-blue-200/80 bg-white p-5 shadow-xs transition-shadow sm:p-7">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      HASIL SIMULASI
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      PPh 21 Masa Pajak
                    </h2>
                  </div>

                  <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-md shadow-blue-500/20 sm:p-7">
                    <p className="text-sm font-medium text-blue-100">
                      PPh 21 yang disimulasikan
                    </p>

                    <p className="mt-2 font-mono text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                      Rp {formatRupiah(result.monthly.tax)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                      <p className="text-xs font-medium text-slate-500">Total Bruto</p>

                      <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                        Rp {formatRupiah(result.monthly.grossIncome)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                      <p className="text-xs font-medium text-slate-500">Kategori TER</p>

                      <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                        {result.monthly.terCategory}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                      <p className="text-xs font-medium text-slate-500">TER Saat Ini</p>

                      <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                        {formatPercent(result.monthly.terRate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* =============================================
                    PAYROLL GROSS-UP RESULT
                ============================================== */}

                {result.payrollAllocation && hasGrossUpPayment && (
                  <div className="mt-6 rounded-3xl border border-amber-200/90 bg-white p-5 shadow-xs sm:p-7">
                    {/* HEADER */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-sm">
                          🧾
                        </span>

                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                          MEKANISME PAYROLL
                        </p>
                      </div>

                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                        Gross-Up & Re-Gross-Up
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        Bagian ini menjelaskan bagaimana tunjangan PPh terbentuk
                        dalam mekanisme payroll Gross-Up. Nilai Gross-Up dan
                        Re-Gross-Up merupakan mekanisme payroll dan bukan
                        tambahan PPh di luar PPh 21 resmi.
                      </p>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Tahap 1 & 2 — Pembayaran secara berurutan
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Setiap tahap menunjukkan perubahan bruto dan PPh
                            kumulatif ketika pembayaran tersebut diproses.
                          </p>
                        </div>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 shadow-xs">
                          {payrollPayments.length} pembayaran
                        </span>
                      </div>

                      <div className="mt-4 space-y-3.5">
                        {payrollPayments.map((payment, index) => (
                          <div
                            key={payment.id}
                            className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4.5 transition-all hover:bg-slate-50 hover:border-slate-300"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-xs font-bold text-white shadow-xs">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    Tahap {index + 1} — {payment.name}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {payment.treatment === "GROSS_UP"
                                      ? "Nominal input sebelum tunjangan PPh otomatis."
                                      : "Nominal input merupakan bruto pembayaran."}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold shadow-xs ${
                                  payment.treatment === "GROSS_UP"
                                    ? "bg-amber-100 border border-amber-300/80 text-amber-800"
                                    : "bg-slate-100 border border-slate-200 text-slate-700"
                                }`}
                              >
                                {payment.treatment === "GROSS_UP"
                                  ? "GROSS-UP"
                                  : "GROSS"}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <PayrollDetail
                                label={
                                  payment.treatment === "GROSS_UP"
                                    ? "Penghasilan sebelum tunjangan PPh"
                                    : "Bruto pembayaran"
                                }
                                value={payment.amount}
                              />
                              {payment.treatment === "GROSS_UP" && (
                                <>
                                  <PayrollDetail
                                    label="TER saat tunjangan dibentuk"
                                    textValue={formatPercent(payment.terRate)}
                                  />
                                  <PayrollDetail
                                    label="Rumus tunjangan PPh"
                                    textValue={`Rp ${formatRupiah(payment.grossUpBase)} × ${formatPercent(payment.terRate)} / (1 − ${formatPercent(payment.terRate)})`}
                                  />
                                  <PayrollDetail
                                    label="Tunjangan PPh otomatis"
                                    value={payment.actualTaxAllowance}
                                  />
                                  <PayrollDetail
                                    label="Potongan PPh pada slip gaji"
                                    value={payment.paymentTaxImpact}
                                  />
                                </>
                              )}
                              {payment.treatment === "GROSS" && (
                                <>
                                  <PayrollDetail
                                    label="Bruto sebelum pembayaran ini"
                                    value={
                                      index === 0
                                        ? 0
                                        : payrollPayments[index - 1]
                                            .cumulativeActualGross
                                    }
                                  />
                                  <PayrollDetail
                                    label="TER sebelum → sesudah"
                                    textValue={`${
                                      index === 0
                                        ? "0%"
                                        : formatPercent(
                                            payrollPayments[index - 1].terRate,
                                          )
                                    } → ${formatPercent(payment.terRate)}`}
                                  />
                                  <PayrollDetail
                                    label="PPh sebelum → sesudah pembayaran"
                                    textValue={`Rp ${formatRupiah(
                                      index === 0
                                        ? 0
                                        : payrollPayments[index - 1]
                                            .cumulativeTax,
                                    )} → Rp ${formatRupiah(
                                      payment.cumulativeTax,
                                    )}`}
                                  />
                                  <PayrollDetail
                                    label="Potongan PPh pada slip pembayaran ini"
                                    value={payment.paymentTaxImpact}
                                  />
                                </>
                              )}
                              <PayrollDetail
                                label="Bruto kumulatif setelah tahap ini"
                                value={payment.cumulativeActualGross}
                              />
                              <PayrollDetail
                                label="PPh kumulatif setelah tahap ini"
                                value={payment.cumulativeTax}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {finalPayrollPayment && (
                      <div className="mt-5 rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 via-amber-50/30 to-white p-4.5 sm:p-6 shadow-xs">
                        <p className="text-sm font-bold text-amber-950">
                          Tahap 3 — Re-Gross-Up setelah bruto bertambah
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Bonus atau pembayaran berikutnya dapat mengubah TER.
                          Engine lalu membandingkan tunjangan awal dengan
                          tunjangan yang seharusnya tersedia pada TER final.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <PayrollDetail
                            label="TER sebelum Re-Gross-Up"
                            textValue={formatPercent(finalPayrollPayment.terRate)}
                          />
                          <PayrollDetail
                            label="TER setelah Re-Gross-Up"
                            textValue={formatPercent(
                              finalPayrollPayment.finalTerRate,
                            )}
                          />
                          <PayrollDetail
                            label="Total tunjangan PPh awal"
                            value={totalInitialTaxAllowance}
                          />
                          <PayrollDetail
                            label="Tunjangan PPh yang seharusnya"
                            value={finalPayrollPayment.oriTaxAllowance}
                          />
                          <PayrollDetail
                            label="Gross-Up Adjustment"
                            value={result.payrollAllocation.grossUpAdjustment}
                          />
                          <PayrollDetail
                            label="Bruto setelah Re-Gross-Up"
                            value={result.payrollAllocation.brutoOri}
                          />
                          <PayrollDetail
                            label="PPh 21 resmi masa pajak"
                            value={result.payrollAllocation.officialTax}
                          />
                          <PayrollDetail
                            label="Rumus PPh resmi setelah adjustment"
                            textValue={`Rp ${formatRupiah(
                              result.payrollAllocation.brutoOri,
                            )} × ${formatPercent(
                              finalPayrollPayment.finalTerRate,
                            )}`}
                          />
                        </div>
                      </div>
                    )}

                    {hasGrossUpPayment && (
                      <div className="mt-4 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4.5">
                        <p className="text-sm font-bold text-blue-900">
                          Hubungkan dengan slip gaji
                        </p>
                        <p className="mt-1 text-xs leading-5 text-blue-800">
                          Pada tahap GROSS-UP, tunjangan PPh dibayarkan
                          perusahaan dan kemudian muncul sebagai potongan PPh
                          pada slip gaji yang sama. Pada pembayaran GROSS,
                          misalnya bonus, lihat “Potongan PPh pada slip
                          pembayaran ini”. Nilai tersebut adalah kenaikan PPh
                          kumulatif saat bonus masuk, bukan tarif khusus bonus.
                        </p>
                      </div>
                    )}

                    {/* =====================================================
                        MAIN RESULT
                    ====================================================== */}

                    <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4.5 transition-all hover:bg-slate-50 hover:border-slate-300">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">PPh 21 Resmi</p>

                        <p className="mt-1 font-mono text-xl font-extrabold text-slate-900">
                          Rp{" "}
                          {formatRupiah(result.payrollAllocation.officialTax)}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          PPh 21 yang dihitung berdasarkan simulasi pajak.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4.5 transition-all hover:bg-amber-50/80 hover:border-amber-300">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                          Gross-Up Adjustment
                        </p>

                        <p className="mt-1 font-mono text-xl font-extrabold text-amber-900">
                          Rp{" "}
                          {formatRupiah(
                            result.payrollAllocation.grossUpAdjustment,
                          )}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Selisih kebutuhan tunjangan PPh setelah perhitungan
                          kembali.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4.5 transition-all hover:bg-slate-50 hover:border-slate-300">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bruto Aktual</p>

                        <p className="mt-1 font-mono text-xl font-extrabold text-slate-900">
                          Rp{" "}
                          {formatRupiah(result.payrollAllocation.actualGross)}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Bruto setelah tunjangan PPh awal terbentuk.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4.5 transition-all hover:bg-amber-50/80 hover:border-amber-300">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                          Bruto Setelah Re-Gross-Up
                        </p>

                        <p className="mt-1 font-mono text-xl font-extrabold text-amber-900">
                          Rp {formatRupiah(result.payrollAllocation.brutoOri)}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Bruto setelah kebutuhan tunjangan PPh dihitung
                          kembali.
                        </p>
                      </div>
                    </div>

                    {/* =====================================================
                        AUDIT TRAIL
                    ====================================================== */}

                    <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Dari mana angka ini berasal?
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Ikuti alur pembentukan bruto dan tunjangan PPh pada
                            mekanisme Gross-Up.
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-xs">
                          AUDIT TRAIL
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {/* 01 */}
                        <div className="flex gap-3.5">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-700 shadow-xs border border-slate-200">
                              1
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              BRUTO AKTUAL
                            </p>

                            <p className="mt-1 font-mono text-xl font-extrabold text-slate-950">
                              Rp{" "}
                              {formatRupiah(
                                result.payrollAllocation.actualGross,
                              )}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Ini adalah total bruto aktual yang terbentuk
                              setelah mekanisme Gross-Up awal.
                            </p>
                          </div>
                        </div>

                        {/* CONNECTOR */}
                        <div className="ml-4 h-3 border-l-2 border-dashed border-slate-300" />

                        {/* 02 */}
                        <div className="flex gap-3.5">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-800 border border-amber-200 shadow-xs">
                              2
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-xs">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                              KEBUTUHAN PENYESUAIAN
                            </p>

                            <p className="mt-1 font-mono text-xl font-extrabold text-amber-900">
                              Rp{" "}
                              {formatRupiah(
                                result.payrollAllocation.grossUpAdjustment,
                              )}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              Jika posisi bruto menyebabkan kebutuhan tunjangan
                              PPh menjadi lebih besar, selisih tersebut muncul
                              sebagai Gross-Up Adjustment.
                            </p>
                          </div>
                        </div>

                        {/* CONNECTOR */}
                        <div className="ml-4 h-3 border-l-2 border-dashed border-slate-300" />

                        {/* 03 */}
                        <div className="flex gap-3.5">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-800 border border-blue-200 shadow-xs">
                              3
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              BRUTO SETELAH RE-GROSS-UP
                            </p>

                            <p className="mt-1 font-mono text-xl font-extrabold text-slate-950">
                              Rp{" "}
                              {formatRupiah(result.payrollAllocation.brutoOri)}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Nilai bruto setelah kebutuhan tunjangan PPh
                              dihitung kembali agar sesuai dengan posisi TER
                              yang berlaku.
                            </p>
                          </div>
                        </div>

                        {/* CONNECTOR */}
                        <div className="ml-4 h-3 border-l-2 border-dashed border-slate-300" />

                        {/* 04 */}
                        <div className="flex gap-3.5">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                              4
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4.5 text-white border border-slate-800 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  PPh 21 RESMI
                                </p>

                                <p className="mt-1 text-xs text-slate-300">
                                  Hasil akhir PPh 21 masa pajak
                                </p>
                              </div>

                              <p className="font-mono text-2xl font-extrabold tracking-tight text-white">
                                Rp{" "}
                                {formatRupiah(
                                  result.payrollAllocation.officialTax,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =====================================================
                        HOW TO READ
                    ====================================================== */}

                    <div className="mt-5 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4.5 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-base">💡</span>

                        <div>
                          <p className="text-sm font-bold text-blue-900">
                            Cara membaca hasil Gross-Up
                          </p>

                          <div className="mt-3 space-y-2 text-xs leading-5 text-blue-800">
                            <p>
                              <strong>Bruto Aktual</strong> menunjukkan kondisi
                              bruto setelah tunjangan PPh awal terbentuk.
                            </p>

                            <p>
                              <strong>Gross-Up Adjustment</strong> menunjukkan
                              tambahan kebutuhan tunjangan apabila perhitungan
                              payroll perlu disesuaikan kembali.
                            </p>

                            <p>
                              <strong>Bruto Setelah Re-Gross-Up</strong>{" "}
                              menunjukkan bruto setelah kebutuhan tunjangan PPh
                              dihitung kembali.
                            </p>

                            <p>
                              <strong>PPh 21 Resmi</strong> adalah hasil
                              perhitungan PPh 21 simulator. Gross-Up Adjustment
                              tidak ditambahkan lagi ke angka PPh 21 tersebut.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =====================================================
                        IMPORTANT NOTE
                    ====================================================== */}

                    <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5">⚠️</span>

                        <p className="text-xs leading-5 text-amber-800">
                          <strong className="text-amber-900">Penting:</strong>{" "}
                          Gross-Up dan Re-Gross-Up adalah mekanisme payroll
                          untuk membentuk tunjangan PPh. Nilai tersebut bukan
                          PPh tambahan yang harus dijumlahkan lagi dengan PPh 21
                          resmi.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* =============================================
                    EXISTING EDUCATION
                ============================================== */}

                {!hasGrossUpPayment && (
                  <>
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
              </>
            )}

            {/* =================================================
                FINAL RESULT
            ================================================== */}

            {result.final && (
              <div className="mt-6 rounded-3xl border border-blue-200/80 bg-white p-5 shadow-xs sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    HASIL PERHITUNGAN AKHIR
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    PPh 21 Masa Pajak Terakhir
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Perhitungan akhir membandingkan PPh 21 yang seharusnya
                    terutang selama periode perhitungan dengan PPh 21 yang sudah
                    dipotong sebelumnya.
                  </p>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-md shadow-blue-500/20 sm:p-7">
                  <p className="text-sm font-medium text-blue-100">
                    {result.final.finalTax > 0
                      ? "PPh 21 yang Masih Harus Dipotong"
                      : result.final.overpayment > 0
                        ? "Kelebihan Pemotongan PPh 21"
                        : "PPh 21 Final"}
                  </p>

                  <p className="mt-2 font-mono text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    Rp{" "}
                    {formatRupiah(
                      result.final.finalTax > 0
                        ? result.final.finalTax
                        : result.final.overpayment,
                    )}
                  </p>

                  <p className="mt-2 text-sm leading-5 text-blue-100">
                    {result.final.finalTax > 0
                      ? "Ini adalah selisih PPh 21 yang masih perlu dipotong pada masa pajak terakhir."
                      : result.final.overpayment > 0
                        ? "PPh 21 yang telah dipotong sebelumnya lebih besar daripada PPh 21 yang terutang."
                        : "PPh 21 yang sudah dipotong sebelumnya sama dengan PPh 21 yang terutang."}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                    <p className="text-xs font-medium text-slate-500">
                      Penghasilan Bruto Periode
                    </p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                      Rp {formatRupiah(result.final.grossIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                    <p className="text-xs font-medium text-slate-500">Penghasilan Neto</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                      Rp {formatRupiah(result.final.netIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                    <p className="text-xs font-medium text-slate-500">PTKP</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                      Rp {formatRupiah(result.final.ptkp)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-300/80">
                    <p className="text-xs font-medium text-slate-500">PKP</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900 sm:text-lg">
                      Rp {formatRupiah(result.final.taxableIncome)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-slate-900">
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

                      <span className="font-mono text-sm font-bold text-slate-900">
                        Rp {formatRupiah(result.final.annualTax)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-600">
                        PPh 21 sudah dipotong
                      </span>

                      <span className="font-mono text-sm font-bold text-slate-900">
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

                        <span className="font-mono text-base font-bold text-slate-900">
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

                {result.final.overpayment > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                    <p className="text-sm font-bold text-amber-900">
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
              <div className="mt-6 rounded-3xl border border-blue-200/80 bg-white p-5 shadow-xs sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    HASIL PERHITUNGAN AKHIR
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    PPh 21 Masa Pajak Terakhir
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Perhitungan ini menggunakan mekanisme part-year karena
                    penghasilan hanya diperoleh sebagian tahun.
                  </p>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-md shadow-blue-500/20 sm:p-7">
                  <p className="text-sm font-medium text-blue-100">
                    PPh 21 Final
                  </p>

                  <p className="mt-2 font-mono text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    Rp {formatRupiah(result.partYear.finalTax)}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <p className="text-xs font-medium text-slate-500">Penghasilan Bruto</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.grossIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Penghasilan Neto Aktual
                    </p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.netIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <p className="text-xs font-medium text-slate-500">Neto Disetahunkan</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.annualizedNetIncome)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <p className="text-xs font-medium text-slate-500">PKP</p>

                    <p className="mt-1 font-mono text-base font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.taxableIncome)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      PPh berdasarkan penghasilan disetahunkan
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.annualTax)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      PPh setelah prorata
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.proratedTax)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      PPh 21 yang sudah dipotong
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-900">
                      Rp {formatRupiah(result.partYear.previousTaxWithheld)}
                    </span>
                  </div>
                </div>

                {result.partYear.overpayment > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                    <p className="text-sm font-bold text-amber-900">
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
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">
              Hasil simulasi akan muncul di sini
            </p>

            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">
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
