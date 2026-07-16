using GoalsPlanningSystem.Simulation.Metrics;

namespace GoalsPlanningSystem.Tests.Metrics;

public class FundingRatioCalculatorTests
{
    [Fact]
    public void ZeroDiscountRate_IsSimpleRatioOfSums()
    {
        // (1,00,000 assets + 10,000 contribution) / 50,000 goal cost = 2.2
        var ratio = FundingRatioCalculator.Calculate(
            currentAssets: 100_000m,
            futureContributions: [(0, 10_000m)],
            futureGoalCosts: [(0, 50_000m)],
            annualDiscountRate: 0.0);

        Assert.Equal(2.2m, ratio);
    }

    [Fact]
    public void NoGoalCosts_ReturnsNull()
    {
        var ratio = FundingRatioCalculator.Calculate(
            currentAssets: 100_000m,
            futureContributions: [],
            futureGoalCosts: [],
            annualDiscountRate: 0.06);

        Assert.Null(ratio);
    }

    [Fact]
    public void FutureGoalCost_IsDiscountedBackToPresentValue()
    {
        // 1,10,000 due in 1 year at 10% discount rate has PV = 1,00,000, so ratio against 1,00,000 assets = 1.0
        var ratio = FundingRatioCalculator.Calculate(
            currentAssets: 100_000m,
            futureContributions: [],
            futureGoalCosts: [(1, 110_000m)],
            annualDiscountRate: 0.10);

        Assert.NotNull(ratio);
        Assert.Equal(1.0, (double)ratio!.Value, precision: 4);
    }
}
