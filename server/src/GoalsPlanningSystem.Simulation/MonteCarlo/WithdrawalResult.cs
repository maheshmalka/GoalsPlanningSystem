using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Simulation.MonteCarlo;

public class WithdrawalResult
{
    public decimal TotalWithdrawn { get; set; }
    public decimal Shortfall { get; set; }
    public decimal OrdinaryIncomeFromGains { get; set; }
    public Dictionary<CapitalGainsAssetCategory, decimal> LongTermGainsByCategory { get; } = new();

    public void AddLongTermGain(CapitalGainsAssetCategory category, decimal amount)
    {
        if (amount <= 0) return;
        LongTermGainsByCategory[category] = LongTermGainsByCategory.GetValueOrDefault(category) + amount;
    }
}
