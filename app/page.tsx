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

import type {
  GrossUpPayment,
  IncomeItem,
  TaxpayerStatus,
  TaxSimulationResult,
} from "@/lib/tax-engine/types";

import PayrollOrder, { type PayrollOrderKey } from "@/components/payroll-order";

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
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs leading-5 text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">
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

    // -----------------------------------------------------
    // SAVE INCOME ITEMS
    // -----------------------------------------------------

    setSimulationIncomeItems(incomeItems);

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

        incomeItems,

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
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            Simulasikan PPh 21 →
          </button>

          {/* =================================================
              VALIDATION MESSAGE
          ================================================== */}

          {isFinalMonth && finalGrossIncome <= 0 && (
            <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Untuk masa pajak terakhir, isi{" "}
              <strong>Total Penghasilan Bruto Periode</strong> sebelum
              menjalankan simulasi.
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

                  <div className="rounded-3xl bg-blue-50 p-6">
                    <p className="text-sm font-medium text-blue-700">
                      PPh 21 yang disimulasikan
                    </p>

                    <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                      Rp {formatRupiah(result.monthly.tax)}
                    </p>
                  </div>

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
                    PAYROLL GROSS-UP RESULT
                ============================================== */}

                {result.payrollAllocation && hasGrossUpPayment && (
                  <div className="mt-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
                    {/* HEADER */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                          🧾
                        </span>

                        <p className="text-sm font-semibold text-amber-600">
                          MEKANISME PAYROLL
                        </p>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-slate-900">
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

                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          {payrollPayments.length} pembayaran
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {payrollPayments.map((payment, index) => (
                          <div
                            key={payment.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-700 shadow-sm">
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
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  payment.treatment === "GROSS_UP"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-200 text-slate-700"
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
                                    textValue={`${payment.terRate * 100}%`}
                                  />
                                  <PayrollDetail
                                    label="Rumus tunjangan PPh"
                                    textValue={`Rp ${formatRupiah(payment.grossUpBase)} × ${payment.terRate * 100}% / (1 − ${payment.terRate * 100}%)`}
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
                                        ? 0
                                        : payrollPayments[index - 1].terRate *
                                          100
                                    }% → ${payment.terRate * 100}%`}
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
                      <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
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
                            textValue={`${finalPayrollPayment.terRate * 100}%`}
                          />
                          <PayrollDetail
                            label="TER setelah Re-Gross-Up"
                            textValue={`${finalPayrollPayment.finalTerRate * 100}%`}
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
                            )} × ${finalPayrollPayment.finalTerRate * 100}%`}
                          />
                        </div>
                      </div>
                    )}

                    {hasGrossUpPayment && (
                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">PPh 21 Resmi</p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          Rp{" "}
                          {formatRupiah(result.payrollAllocation.officialTax)}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          PPh 21 yang dihitung berdasarkan simulasi pajak.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs text-amber-700">
                          Gross-Up Adjustment
                        </p>

                        <p className="mt-1 text-lg font-bold text-amber-900">
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

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Bruto Aktual</p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          Rp{" "}
                          {formatRupiah(result.payrollAllocation.actualGross)}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Bruto setelah tunjangan PPh awal terbentuk.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs text-amber-700">
                          Bruto Setelah Re-Gross-Up
                        </p>

                        <p className="mt-1 text-lg font-bold text-amber-900">
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

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
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

                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                          AUDIT TRAIL
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {/* 01 */}
                        <div className="flex gap-3">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">
                              1
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl bg-white p-4">
                            <p className="text-xs font-semibold text-slate-500">
                              BRUTO AKTUAL
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-950">
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
                        <div className="ml-4 h-3 border-l border-dashed border-slate-300" />

                        {/* 02 */}
                        <div className="flex gap-3">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                              2
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-xs font-semibold text-amber-700">
                              KEBUTUHAN PENYESUAIAN
                            </p>

                            <p className="mt-1 text-xl font-bold text-amber-900">
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
                        <div className="ml-4 h-3 border-l border-dashed border-slate-300" />

                        {/* 03 */}
                        <div className="flex gap-3">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              3
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl bg-white p-4">
                            <p className="text-xs font-semibold text-slate-500">
                              BRUTO SETELAH RE-GROSS-UP
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-950">
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
                        <div className="ml-4 h-3 border-l border-dashed border-slate-300" />

                        {/* 04 */}
                        <div className="flex gap-3">
                          <div className="flex w-8 shrink-0 justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              4
                            </div>
                          </div>

                          <div className="flex-1 rounded-2xl bg-slate-900 p-4 text-white">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-300">
                                  PPh 21 RESMI
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Hasil akhir PPh 21 masa pajak
                                </p>
                              </div>

                              <p className="text-xl font-bold">
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

                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
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

                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
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

                <div className="rounded-3xl bg-blue-50 p-6">
                  <p className="text-sm font-medium text-blue-700">
                    PPh 21 Final
                  </p>

                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                    Rp {formatRupiah(result.partYear.finalTax)}
                  </p>
                </div>

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
