using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation.MonteCarlo;
using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Simulation;

public record ClientProfileInput(DateOnly DateOfBirth, int RetirementAge, int LifeExpectancyAge, TaxRegime TaxRegime, decimal TotalDeductionsAmount);

public record AccountInput(
    int AccountId,
    TaxTreatment TaxTreatment,
    CapitalGainsRuleInput? CgtRule,
    CapitalGainsAssetCategory? CgtCategory,
    decimal CurrentBalance,
    IReadOnlyDictionary<int, double> AllocationWeights,
    decimal MonthlyContribution,
    decimal EmployerMatchPct,
    bool IsNps,
    decimal NpsAnnuitizationPct,
    decimal AssumedAnnuityRatePct);

public record IncomeInput(IncomeType IncomeType, decimal AnnualAmount, int StartYear, int? EndYear, decimal AnnualGrowthRatePct);

public record ExpenseInput(decimal AnnualAmount, int StartYear, int? EndYear, decimal GrowthRatePct);

public record GoalInput(
    int GoalId,
    string Name,
    decimal TargetAmount,
    int StartYear,
    int EndYear,
    bool IsRecurring,
    decimal GrowthRatePct,
    IReadOnlyList<int> LinkedAccountIds);

public record TaxRegimeConfig(IReadOnlyList<TaxSlabRule> Slabs, TaxSettingsInput Settings);

public record SimulationSettingsInput(int SimulationCount, decimal InflationRatePct, int AsOfYear, int? RandomSeed = null);

public record SimulationRequest(
    ClientProfileInput Client,
    IReadOnlyList<AccountInput> Accounts,
    IReadOnlyList<IncomeInput> Incomes,
    IReadOnlyList<ExpenseInput> Expenses,
    IReadOnlyList<GoalInput> Goals,
    IReadOnlyList<AssetClassAssumption> AssetClasses,
    IReadOnlyList<AssetClassCorrelationPair> Correlations,
    int CashAssetClassId,
    IReadOnlyDictionary<TaxRegime, TaxRegimeConfig> TaxRegimes,
    IReadOnlyDictionary<CapitalGainsAssetCategory, CapitalGainsRuleInput> CapitalGainsRules,
    SimulationSettingsInput Settings);
