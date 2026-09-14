export { getTER } from "./ter";

export {
  calculateMonthlyTax,
} from "./monthly";

export {
  calculateFinalTax,
} from "./final";

export {
  calculatePartYearTax,
} from "./part-year";

export {
  calculatePaymentImpact,
} from "./payment-impact";

export {
  simulateTax,
} from "./simulate";

export type {
  TERResult,
  MonthlyTaxResult,
  FinalTaxInput,
  FinalTaxResult,
  PartYearTaxInput,
  PartYearTaxResult,
  PaymentImpactInput,
  PaymentImpactResult,
  TaxCalculationInput,
  TaxpayerProfile,
  TaxSimulationResult,
} from "./types";

export type {
  TaxSimulationOptions,
} from "./simulate";