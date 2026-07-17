import { z } from "zod";

const currentYear = new Date().getFullYear();

export const clientSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .refine((v) => new Date(v) <= new Date(), "Date of birth cannot be in the future")
      .refine((v) => {
        const age = currentYear - new Date(v).getFullYear();
        return age >= 0 && age <= 100;
      }, "Enter a realistic date of birth"),
    retirementAge: z.coerce.number().int("Must be a whole number").min(35, "Too low").max(80, "Too high"),
    lifeExpectancyAge: z.coerce.number().int("Must be a whole number").min(40, "Too low").max(110, "Too high"),
    taxRegime: z.enum(["Old", "New"]),
    totalDeductionsAmount: z.coerce.number().min(0, "Cannot be negative"),
    riskProfileOverride: z
      .enum(["Conservative", "ModeratelyConservative", "Moderate", "ModeratelyAggressive", "Aggressive"])
      .nullable(),
    notes: z.string().max(2000, "Notes are too long").nullable(),
  })
  .refine((data) => data.lifeExpectancyAge > data.retirementAge, {
    message: "Life expectancy must be after retirement age",
    path: ["lifeExpectancyAge"],
  });

export type ClientFormValues = z.infer<typeof clientSchema>;

// Plain z.number(), not z.coerce: allocations are set via setValue() with real numbers already
// (see AccountsTab's setAllocation), not through FormTextField's string-based Controller flow.
const allocationSchema = z.object({
  assetClassId: z.number(),
  percentage: z.number().min(0.01, "Must be greater than 0").max(100, "Cannot exceed 100"),
});

const accountTypeEnum = z.enum([
  "EquityMutualFund", "DebtMutualFund", "DirectEquity", "Epf", "Ppf", "Nps", "FixedDeposit", "RecurringDeposit",
  "SavingsAccount", "RealEstate", "GoldSgb", "Elss", "SukanyaSamriddhiYojana", "SeniorCitizenSavingsScheme",
  "PostOfficeScheme", "Ulip", "EndowmentInsurance", "CorporateBondNcd", "Other",
]);

export const accountSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    accountType: accountTypeEnum,
    currentBalance: z.coerce.number().min(0, "Cannot be negative"),
    contributionAmount: z.coerce.number().min(0, "Cannot be negative"),
    contributionFrequency: z.enum(["None", "Monthly", "Annual"]),
    employerMatchPct: z.coerce.number().min(0).max(100, "Cannot exceed 100%").nullable(),
    npsAnnuitizationPct: z.coerce.number().min(0).max(100, "Cannot exceed 100%").nullable(),
    assumedAnnuityRatePct: z.coerce.number().min(0).max(30, "Enter a realistic rate").nullable(),
    allocations: z.array(allocationSchema).min(1, "Add at least one asset allocation"),
  })
  .refine(
    (data) => {
      const total = data.allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
      return Math.abs(total - 100) < 0.01;
    },
    { message: "Allocation must total exactly 100%", path: ["allocations"] },
  );

export type AccountFormValues = z.infer<typeof accountSchema>;

const incomeTypeEnum = z.enum(["Salary", "Bonus", "Rental", "Pension", "Business", "NpsAnnuity", "Other"]);

export const incomeSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    incomeType: incomeTypeEnum,
    annualAmount: z.coerce.number().positive("Must be greater than 0"),
    startYear: z.coerce.number().int().min(1950, "Enter a valid year").max(2100, "Enter a valid year"),
    endYear: z.coerce.number().int().min(1950).max(2200).nullable(),
    annualGrowthRatePct: z.coerce.number().min(-20, "Too low").max(50, "Too high"),
  })
  .refine((data) => data.endYear == null || data.endYear >= data.startYear, {
    message: "End year must be on or after the start year",
    path: ["endYear"],
  });

export type IncomeFormValues = z.infer<typeof incomeSchema>;

const expenseCategoryEnum = z.enum(["Essential", "Discretionary", "Healthcare", "Housing", "Other"]);

export const expenseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    category: expenseCategoryEnum,
    annualAmount: z.coerce.number().positive("Must be greater than 0"),
    startYear: z.coerce.number().int().min(1950, "Enter a valid year").max(2100, "Enter a valid year"),
    endYear: z.coerce.number().int().min(1950).max(2200).nullable(),
    growthRateOverridePct: z.coerce.number().min(-20, "Too low").max(50, "Too high").nullable(),
  })
  .refine((data) => data.endYear == null || data.endYear >= data.startYear, {
    message: "End year must be on or after the start year",
    path: ["endYear"],
  });

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

const goalTypeEnum = z.enum([
  "Retirement", "ChildEducation", "ChildMarriage", "HomePurchase", "VehiclePurchase", "EmergencyFund",
  "MajorPurchase", "Legacy", "Other",
]);

export const goalSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
    goalType: goalTypeEnum,
    targetAmount: z.coerce.number().positive("Must be greater than 0"),
    priority: z.enum(["Essential", "Important", "Aspirational"]),
    startYear: z.coerce.number().int().min(currentYear - 1, "Cannot be in the past").max(2100, "Enter a valid year"),
    endYear: z.coerce.number().int().min(1950).max(2200),
    isRecurring: z.boolean(),
    growthRateOverridePct: z.coerce.number().min(-20, "Too low").max(50, "Too high").nullable(),
    linkedAccountIds: z.array(z.number()),
  })
  .refine((data) => !data.isRecurring || data.endYear >= data.startYear, {
    message: "End year must be on or after the start year",
    path: ["endYear"],
  });

export type GoalFormValues = z.infer<typeof goalSchema>;

export const planSchema = z.object({
  name: z.string().trim().min(1, "Plan name is required").max(200, "Name is too long"),
  inflationRatePct: z.coerce.number().min(0, "Cannot be negative").max(30, "Enter a realistic rate"),
  simulationCount: z.coerce.number().int("Must be a whole number").min(100, "At least 100 for meaningful results").max(20000, "20,000 max for performance"),
  primaryClientId: z.number().nullable(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

export const assetClassSchema = z.object({
  expectedAnnualReturnPct: z.coerce.number().min(-20, "Too low").max(40, "Too high"),
  annualVolatilityPct: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
});

export type AssetClassFormValues = z.infer<typeof assetClassSchema>;

export const correlationSchema = z.object({
  correlation: z.coerce.number().min(-1, "Must be between -1 and 1").max(1, "Must be between -1 and 1"),
});

export type CorrelationFormValues = z.infer<typeof correlationSchema>;

export const taxSlabSchema = z
  .object({
    lowerBound: z.coerce.number().min(0, "Cannot be negative"),
    upperBound: z.coerce.number().positive("Must be greater than 0").nullable(),
    ratePct: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  })
  .refine((data) => data.upperBound == null || data.upperBound > data.lowerBound, {
    message: "Must be greater than the lower bound",
    path: ["upperBound"],
  });

export type TaxSlabFormValues = z.infer<typeof taxSlabSchema>;

export const taxSettingsSchema = z.object({
  standardDeduction: z.coerce.number().min(0, "Cannot be negative"),
  rebateIncomeThreshold: z.coerce.number().min(0, "Cannot be negative"),
  rebateMaxAmount: z.coerce.number().min(0, "Cannot be negative"),
  cessPct: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
});

export type TaxSettingsFormValues = z.infer<typeof taxSettingsSchema>;

export const capitalGainsRuleSchema = z.object({
  longTermRatePct: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  longTermExemptionAmount: z.coerce.number().min(0, "Cannot be negative"),
});

export type CapitalGainsRuleFormValues = z.infer<typeof capitalGainsRuleSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password is too long"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
