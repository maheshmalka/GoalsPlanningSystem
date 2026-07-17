export interface User {
  id: number;
  email: string;
  displayName: string;
}

export interface AuthResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: User;
}

export type TaxRegime = "Old" | "New";

export type AccountType =
  | "EquityMutualFund" | "DebtMutualFund" | "DirectEquity" | "Epf" | "Ppf" | "Nps"
  | "FixedDeposit" | "RecurringDeposit" | "SavingsAccount" | "RealEstate" | "GoldSgb"
  | "Elss" | "SukanyaSamriddhiYojana" | "SeniorCitizenSavingsScheme" | "PostOfficeScheme"
  | "Ulip" | "EndowmentInsurance" | "CorporateBondNcd" | "Other";

export type TaxTreatment = "Taxable" | "TaxDeferred" | "TaxFree";
export type ContributionFrequency = "None" | "Monthly" | "Annual";
export type IncomeType = "Salary" | "Bonus" | "Rental" | "Pension" | "Business" | "NpsAnnuity" | "Other";
export type ExpenseCategory = "Essential" | "Discretionary" | "Healthcare" | "Housing" | "Other";
export type GoalType =
  | "Retirement" | "ChildEducation" | "ChildMarriage" | "HomePurchase" | "VehiclePurchase"
  | "EmergencyFund" | "MajorPurchase" | "Legacy" | "Other";
export type GoalPriority = "Essential" | "Important" | "Aspirational";
export type RiskProfile = "Conservative" | "ModeratelyConservative" | "Moderate" | "ModeratelyAggressive" | "Aggressive";
export type CapitalGainsAssetCategory = "Equity" | "DebtMutualFund" | "RealEstate" | "Gold";

export interface ClientListItem {
  id: number;
  name: string;
  age: number;
  effectiveRiskProfile: RiskProfile | null;
}

export interface ClientDetail {
  id: number;
  name: string;
  dateOfBirth: string;
  retirementAge: number;
  lifeExpectancyAge: number;
  taxRegime: TaxRegime;
  totalDeductionsAmount: number;
  riskScore: number | null;
  riskProfile: RiskProfile | null;
  riskProfileOverride: RiskProfile | null;
  notes: string | null;
}

export type ClientUpsert = Omit<ClientDetail, "id" | "riskScore" | "riskProfile">;

export interface Plan {
  id: number;
  name: string;
  clients: ClientListItem[];
}

export interface PlanDetail {
  id: number;
  name: string;
  inflationRatePct: number;
  simulationCount: number;
  primaryClientId: number | null;
  clients: ClientListItem[];
}

export type PlanUpsert = Omit<PlanDetail, "id" | "clients">;

export interface Allocation {
  assetClassId: number;
  assetClassName: string;
  percentage: number;
}

export interface AllocationUpsert {
  assetClassId: number;
  percentage: number;
}

export interface Account {
  id: number;
  clientId: number;
  name: string;
  accountType: AccountType;
  taxTreatment: TaxTreatment;
  currentBalance: number;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  employerMatchPct: number | null;
  npsAnnuitizationPct: number | null;
  assumedAnnuityRatePct: number | null;
  allocations: Allocation[];
}

export interface AccountUpsert {
  name: string;
  accountType: AccountType;
  currentBalance: number;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  employerMatchPct: number | null;
  npsAnnuitizationPct: number | null;
  assumedAnnuityRatePct: number | null;
  allocations: AllocationUpsert[];
}

export interface Income {
  id: number;
  clientId: number;
  name: string;
  incomeType: IncomeType;
  annualAmount: number;
  startYear: number;
  endYear: number | null;
  annualGrowthRatePct: number;
}

export type IncomeUpsert = Omit<Income, "id" | "clientId">;

export interface Expense {
  id: number;
  planId: number;
  name: string;
  category: ExpenseCategory;
  annualAmount: number;
  startYear: number;
  endYear: number | null;
  growthRateOverridePct: number | null;
}

export type ExpenseUpsert = Omit<Expense, "id" | "planId">;

export interface Goal {
  id: number;
  planId: number;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  priority: GoalPriority;
  startYear: number;
  endYear: number;
  isRecurring: boolean;
  growthRateOverridePct: number | null;
  linkedAccountIds: number[];
}

export type GoalUpsert = Omit<Goal, "id" | "planId">;

export interface RiskOption {
  id: number;
  displayOrder: number;
  text: string;
  points: number;
}

export interface RiskQuestion {
  id: number;
  displayOrder: number;
  text: string;
  options: RiskOption[];
}

export interface RiskResult {
  rawScore: number;
  minPossibleScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  computedProfile: RiskProfile;
  override: RiskProfile | null;
}

export interface AssetClass {
  id: number;
  name: string;
  expectedAnnualReturnPct: number;
  annualVolatilityPct: number;
}

export interface Correlation {
  assetClassAId: number;
  assetClassBId: number;
  correlation: number;
}

export interface TaxSlab {
  id: number;
  regime: TaxRegime;
  slabOrder: number;
  lowerBound: number;
  upperBound: number | null;
  ratePct: number;
}

export interface TaxSettingsEntry {
  regime: TaxRegime;
  standardDeduction: number;
  rebateIncomeThreshold: number;
  rebateMaxAmount: number;
  cessPct: number;
}

export interface CapitalGainsRule {
  assetCategory: CapitalGainsAssetCategory;
  holdingPeriodMonthsThreshold: number;
  shortTermTaxedAtSlabRate: boolean;
  shortTermRatePct: number;
  longTermRatePct: number;
  longTermExemptionAmount: number;
}

export interface YearlyProjectionBand {
  year: number;
  worstCase: number;
  averageCase: number;
  bestCase: number;
}

export interface YearlyCashflow {
  year: number;
  income: number;
  expense: number;
  tax: number;
  netCashflow: number;
}

export interface GoalOutcome {
  goalId: number;
  name: string;
  probabilityOfSuccessPct: number;
}

export interface SimulationResult {
  projectionBands: YearlyProjectionBand[];
  deterministicCashflow: YearlyCashflow[];
  probabilityOfPlanSuccessPct: number;
  goalOutcomes: GoalOutcome[];
  fundingRatio: number | null;
  worst3MonthLossPct: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  baselineProbabilityOfSuccessPct: number;
  projectedProbabilityOfSuccessPct: number;
  probabilityDeltaPct: number;
  baselineFundingRatio: number | null;
  projectedFundingRatio: number | null;
}

export interface PlanInsights {
  baselineProbabilityOfSuccessPct: number;
  baselineFundingRatio: number | null;
  insights: Insight[];
}
