namespace GoalsPlanningSystem.Simulation.Metrics;

public static class FundingRatioCalculator
{
    /// <summary>
    /// (Current Assets + PV of Future Contributions) / PV of Future Goal Costs, discounted at the client's
    /// blended expected portfolio return. Null when there are no goal costs to fund (ratio is undefined).
    /// </summary>
    public static decimal? Calculate(
        decimal currentAssets,
        IReadOnlyList<(int YearsFromNow, decimal Amount)> futureContributions,
        IReadOnlyList<(int YearsFromNow, decimal Amount)> futureGoalCosts,
        double annualDiscountRate)
    {
        var pvContributions = PresentValue(futureContributions, annualDiscountRate);
        var pvGoalCosts = PresentValue(futureGoalCosts, annualDiscountRate);

        if (pvGoalCosts <= 0)
        {
            return null;
        }

        return (currentAssets + pvContributions) / pvGoalCosts;
    }

    private static decimal PresentValue(IReadOnlyList<(int YearsFromNow, decimal Amount)> cashflows, double annualDiscountRate)
    {
        var total = 0m;
        foreach (var (years, amount) in cashflows)
        {
            var discountFactor = Math.Pow(1 + annualDiscountRate, Math.Max(0, years));
            total += amount / (decimal)discountFactor;
        }

        return total;
    }
}
