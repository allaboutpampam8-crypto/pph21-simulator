export type TaxpayerStatus =
  | "TK/0"
  | "TK/1"
  | "TK/2"
  | "TK/3"
  | "K/0"
  | "K/1"
  | "K/2"
  | "K/3";

export type TERCategory = "A" | "B" | "C";

export type IncomeType =
  | "salary"
  | "allowance"
  | "overtime"
  | "holiday_allowance"
  | "bonus"
  | "incentive"
  | "other";

export interface IncomeItem {
  name: string;
  amount: number;
  type: IncomeType;
  sequence: number;
}

/**
 * Profil wajib pajak untuk simulasi.
 */
export interface TaxpayerProfile {
  taxYear: number;
  status: TaxpayerStatus;
  month: number;
  isFinalMonth: boolean;

  /**
   * Jumlah bulan pegawai memperoleh penghasilan
   * dari pemberi kerja dalam tahun pajak.
   *
   * Full year = 12
   * September - Desember = 4
   * Januari - Agustus = 8
   */
  monthsWorked?: number;

  /**
   * Menentukan apakah kewajiban pajak baru dimulai
   * pada tahun berjalan.
   *
   * true  = perlu annualisasi
   * false = tidak annualisasi
   */
  taxSubjectStartedMidYear?: boolean;
}

/**
 * Input penghasilan untuk satu masa pajak.
 */
export interface TaxCalculationInput {
  profile: TaxpayerProfile;

  /**
   * Komponen penghasilan pada masa pajak
   * yang sedang disimulasikan.
   */
  incomeItems: IncomeItem[];

  /**
   * Total penghasilan bruto kumulatif selama
   * periode yang diperhitungkan untuk masa final.
   *
   * Field ini digunakan ketika isFinalMonth = true.
   *
   * Contoh:
   * Gaji Desember       = Rp20 juta
   * Total bruto setahun = Rp240 juta
   *
   * incomeItems        → Rp20 juta
   * finalGrossIncome    → Rp240 juta
   */
  finalGrossIncome?: number;

  /**
   * Iuran pensiun / hari tua yang menjadi pengurang
   * apabila memenuhi ketentuan perpajakan.
   */
  pensionContribution?: number;

  /**
   * Zakat / sumbangan keagamaan wajib yang dibayarkan
   * melalui pemberi kerja dan memenuhi ketentuan.
   */
  religiousContribution?: number;
}

/**
 * Hasil pencarian TER berdasarkan kategori dan bruto.
 */
export interface TERResult {
  category: TERCategory;
  rate: number;
  bracket: {
    min: number;
    max: number | null;
    rate: number;
  };
}

/**
 * Hasil perhitungan PPh 21 masa pajak biasa
 * (bukan masa pajak terakhir).
 */
export interface MonthlyTaxResult {
  grossIncome: number;
  terCategory: TERCategory;
  terRate: number;
  tax: number;
}

/**
 * Detail penghasilan dan pengurang yang digunakan
 * untuk perhitungan masa pajak terakhir.
 */
export interface FinalTaxBreakdown {
  grossIncome: number;

  jobExpense: number;
  pensionContribution: number;
  religiousContribution: number;

  netIncome: number;
  ptkp: number;
  taxableIncome: number;

  annualTax: number;
  previousTaxWithheld: number;

  finalTax: number;
  overpayment: number;
}

/**
 * Hasil perhitungan PPh 21 masa pajak terakhir.
 */
export interface FinalTaxResult extends FinalTaxBreakdown {
  tax: number;
}

/**
 * Snapshot penghasilan pada satu titik pembayaran.
 *
 * Digunakan untuk fitur edukasi:
 * Gaji → Lembur → THR → Bonus
 */
export interface PaymentImpactResult {
  sequence: number;

  paymentName: string;
  paymentAmount: number;

  cumulativeGross: number;

  terCategory: TERCategory;
  terRate: number;

  simulatedCumulativeTax: number;
  paymentImpact: number;
}

/**
 * Input untuk simulasi dampak berdasarkan urutan pembayaran.
 */
export interface PaymentImpactInput {
  taxYear: number;
  category: TERCategory;
  payments: IncomeItem[];
}

/**
 * Hasil keseluruhan simulasi masa pajak.
 */
export interface TaxSimulationResult {
  /**
   * Total penghasilan pada masa pajak
   * yang sedang disimulasikan.
   */
  grossIncome: number;

  /**
   * Untuk masa pajak biasa.
   */
  monthly?: MonthlyTaxResult;

  /**
   * Untuk masa pajak terakhir full-year.
   */
  final?: FinalTaxResult;

  /**
   * Untuk masa pajak terakhir part-year.
   */
  partYear?: PartYearTaxResult;

  /**
   * Simulasi edukasi berdasarkan urutan pembayaran.
   */
  paymentImpact?: PaymentImpactResult[];
}


/**
 * Input untuk perhitungan PPh 21 masa pajak terakhir.
 */
export interface FinalTaxInput {
  taxYear: number;
  status: TaxpayerStatus;

  /**
   * Jumlah bulan yang diperhitungkan dalam tahun pajak.
   * Untuk pegawai yang bekerja penuh satu tahun = 12.
   */
  monthsWorked: number;

  /**
   * Total penghasilan bruto selama periode yang diperhitungkan.
   */
  annualGrossIncome: number;

  /**
   * Total iuran pensiun / hari tua yang memenuhi ketentuan
   * sebagai pengurang.
   */
  pensionContribution?: number;

  /**
   * Total zakat / sumbangan keagamaan wajib yang memenuhi
   * ketentuan sebagai pengurang.
   */
  religiousContribution?: number;

  /**
   * Total PPh 21 yang sudah dipotong pada masa pajak
   * sebelumnya.
   */
  previousTaxWithheld: number;
}


/**
 * Input untuk pegawai yang penghasilannya hanya diperhitungkan
 * sebagian dalam tahun pajak.
 */
export interface PartYearTaxInput {
  taxYear: number;
  status: TaxpayerStatus;

  /**
   * Jumlah bulan penghasilan yang benar-benar diperoleh
   * dalam tahun pajak.
   *
   * Contoh:
   * September - Desember = 4 bulan.
   */
  monthsWorked: number;

  /**
   * Menunjukkan apakah kewajiban pajak baru dimulai
   * di tengah tahun.
   *
   * true  -> penghasilan perlu disetahunkan
   * false -> menggunakan penghasilan aktual
   */
  taxSubjectStartedMidYear: boolean;

  /**
   * Total bruto selama periode bekerja.
   */
  grossIncome: number;

  /**
   * Total iuran pensiun / hari tua yang memenuhi
   * ketentuan sebagai pengurang.
   */
  pensionContribution?: number;

  /**
   * Total zakat / sumbangan keagamaan wajib yang
   * memenuhi ketentuan sebagai pengurang.
   */
  religiousContribution?: number;

  /**
   * PPh 21 yang sudah dipotong sebelum masa pajak terakhir.
   */
  previousTaxWithheld: number;
}


/**
 * Hasil perhitungan PPh 21 pegawai part-year.
 */
export interface PartYearTaxResult {
  grossIncome: number;

  jobExpense: number;
  pensionContribution: number;
  religiousContribution: number;

  netIncome: number;

  /**
   * Penghasilan neto yang digunakan sebagai dasar
   * penghitungan setelah proses annualisasi jika diperlukan.
   */
  annualizedNetIncome: number;

  ptkp: number;
  taxableIncome: number;

  annualTax: number;

  /**
   * PPh setelah prorata apabila kewajiban pajak
   * baru dimulai di tengah tahun.
   */
  proratedTax: number;

  previousTaxWithheld: number;

  finalTax: number;
  overpayment: number;

  tax: number;
}