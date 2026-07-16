using GoalsPlanningSystem.Simulation.MonteCarlo;
using GoalsPlanningSystem.Simulation.Random;

namespace GoalsPlanningSystem.Tests.MonteCarlo;

public class CorrelatedReturnGeneratorTests
{
    [Fact]
    public void ZeroVolatility_TwelveMonthsCompounds_ToExactAnnualReturn()
    {
        var assetClasses = new List<AssetClassAssumption> { new(AssetClassId: 1, Name: "Test", ExpectedAnnualReturnPct: 12.0, AnnualVolatilityPct: 0.0) };
        var generator = new CorrelatedReturnGenerator(assetClasses, []);
        var rng = new GaussianRandom(seed: 42);

        decimal balance = 1000m;
        for (var i = 0; i < 12; i++)
        {
            var monthlyReturn = generator.GenerateMonthlyReturns(rng)[0];
            balance *= (decimal)(1 + monthlyReturn);
        }

        Assert.Equal(1120.0, (double)balance, precision: 6);
    }

    [Fact]
    public void ZeroVolatility_ReturnIsIdenticalRegardlessOfRandomDraw()
    {
        var assetClasses = new List<AssetClassAssumption> { new(1, "Test", 8.0, 0.0) };
        var generator = new CorrelatedReturnGenerator(assetClasses, []);

        var returnA = generator.GenerateMonthlyReturns(new GaussianRandom(1))[0];
        var returnB = generator.GenerateMonthlyReturns(new GaussianRandom(999))[0];

        Assert.Equal(returnA, returnB, precision: 10);
    }

    [Fact]
    public void PerfectNegativeCorrelation_ProducesOppositeSignedDraws()
    {
        var assetClasses = new List<AssetClassAssumption>
        {
            new(1, "A", 8.0, 15.0),
            new(2, "B", 8.0, 15.0)
        };
        var correlations = new List<AssetClassCorrelationPair> { new(1, 2, -1.0) };
        var generator = new CorrelatedReturnGenerator(assetClasses, correlations);
        var rng = new GaussianRandom(seed: 7);

        var returns = generator.GenerateMonthlyReturns(rng);

        // With perfect negative correlation, one asset's draw above its mean implies the other's is below.
        var aAboveMean = returns[0] > (Math.Pow(1.08, 1.0 / 12) - 1);
        var bAboveMean = returns[1] > (Math.Pow(1.08, 1.0 / 12) - 1);
        Assert.NotEqual(aAboveMean, bAboveMean);
    }
}
