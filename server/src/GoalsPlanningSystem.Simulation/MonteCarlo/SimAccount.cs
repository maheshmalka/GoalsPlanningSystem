using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Simulation.MonteCarlo;

/// <summary>Mutable per-path account state. One instance is cloned per simulated path so paths don't share state.</summary>
public class SimAccount
{
    public required int AccountId { get; init; }
    public required TaxTreatment TaxTreatment { get; set; }
    public required CapitalGainsRuleInput? CgtRule { get; set; }
    public CapitalGainsAssetCategory? CgtCategory { get; init; }
    public decimal Balance { get; set; }
    public decimal CostBasis { get; set; }
    public required IReadOnlyDictionary<int, double> AllocationWeights { get; init; }
    public decimal MonthlyContribution { get; set; }
    public decimal EmployerMatchPct { get; set; }
    public bool IsNps { get; init; }
    public decimal NpsAnnuitizationPct { get; init; }
    public decimal AssumedAnnuityRatePct { get; init; }
    public bool NpsAnnuitized { get; set; }

    public SimAccount Clone() => new()
    {
        AccountId = AccountId,
        TaxTreatment = TaxTreatment,
        CgtRule = CgtRule,
        CgtCategory = CgtCategory,
        Balance = Balance,
        CostBasis = CostBasis,
        AllocationWeights = AllocationWeights,
        MonthlyContribution = MonthlyContribution,
        EmployerMatchPct = EmployerMatchPct,
        IsNps = IsNps,
        NpsAnnuitizationPct = NpsAnnuitizationPct,
        AssumedAnnuityRatePct = AssumedAnnuityRatePct,
        NpsAnnuitized = NpsAnnuitized
    };
}
