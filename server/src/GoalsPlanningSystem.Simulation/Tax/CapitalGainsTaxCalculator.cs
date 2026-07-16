namespace GoalsPlanningSystem.Simulation.Tax;

public record GainClassification(decimal AddToOrdinaryIncome, decimal LongTermGainAmount);

/// <summary>
/// Simplification: the simulation does not track individual purchase lots, so every realized gain is assumed
/// long-term (a reasonable assumption for a multi-decade retirement portfolio). Debt mutual funds are the one
/// current exception where holding period is irrelevant - they're always taxed as ordinary income.
/// </summary>
public static class CapitalGainsTaxCalculator
{
    public static GainClassification Classify(decimal gainAmount, CapitalGainsRuleInput rule) =>
        rule.HoldingPeriodMonthsThreshold == 0
            ? new GainClassification(gainAmount, 0m)
            : new GainClassification(0m, gainAmount);

    public static decimal CalculateLongTermTax(decimal totalLongTermGainForCategory, CapitalGainsRuleInput rule)
    {
        var taxableGain = Math.Max(0m, totalLongTermGainForCategory - rule.LongTermExemptionAmount);
        return taxableGain * rule.LongTermRatePct / 100m;
    }
}
