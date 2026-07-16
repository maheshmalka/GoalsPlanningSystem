using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Tests.Tax;

public class CapitalGainsTaxCalculatorTests
{
    private static readonly CapitalGainsRuleInput EquityRule = new(
        HoldingPeriodMonthsThreshold: 12, LongTermRatePct: 12.5m, LongTermExemptionAmount: 125_000m);

    private static readonly CapitalGainsRuleInput DebtMutualFundRule = new(
        HoldingPeriodMonthsThreshold: 0, LongTermRatePct: 0m, LongTermExemptionAmount: 0m);

    [Fact]
    public void Equity_Classify_TreatsGainAsLongTerm()
    {
        var classification = CapitalGainsTaxCalculator.Classify(200_000m, EquityRule);

        Assert.Equal(200_000m, classification.LongTermGainAmount);
        Assert.Equal(0m, classification.AddToOrdinaryIncome);
    }

    [Fact]
    public void Equity_LongTermTax_AppliesExemptionThenRate()
    {
        // (2,00,000 - 1,25,000 exemption) * 12.5% = 9,375
        var tax = CapitalGainsTaxCalculator.CalculateLongTermTax(200_000m, EquityRule);

        Assert.Equal(9_375m, tax);
    }

    [Fact]
    public void Equity_GainBelowExemption_IsTaxFree()
    {
        var tax = CapitalGainsTaxCalculator.CalculateLongTermTax(100_000m, EquityRule);

        Assert.Equal(0m, tax);
    }

    [Fact]
    public void DebtMutualFund_Classify_IsAlwaysOrdinaryIncomeRegardlessOfHoldingPeriod()
    {
        var classification = CapitalGainsTaxCalculator.Classify(50_000m, DebtMutualFundRule);

        Assert.Equal(50_000m, classification.AddToOrdinaryIncome);
        Assert.Equal(0m, classification.LongTermGainAmount);
    }
}
