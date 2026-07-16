namespace GoalsPlanningSystem.Simulation.Tax;

public record TaxSlabRule(int SlabOrder, decimal LowerBound, decimal? UpperBound, decimal RatePct);

public record TaxSettingsInput(decimal StandardDeduction, decimal RebateIncomeThreshold, decimal RebateMaxAmount, decimal CessPct);

/// <summary>HoldingPeriodMonthsThreshold == 0 is the sentinel for "always taxed as ordinary income regardless of holding period" (current debt mutual fund rule).</summary>
public record CapitalGainsRuleInput(int HoldingPeriodMonthsThreshold, decimal LongTermRatePct, decimal LongTermExemptionAmount);
