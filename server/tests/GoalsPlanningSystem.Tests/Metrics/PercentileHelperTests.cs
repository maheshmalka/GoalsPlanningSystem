using GoalsPlanningSystem.Simulation.Metrics;

namespace GoalsPlanningSystem.Tests.Metrics;

public class PercentileHelperTests
{
    private static readonly List<double> Samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    [Fact]
    public void Median_OfTenSamples_InterpolatesBetweenMiddleTwo()
    {
        var result = PercentileHelper.Percentile(Samples, 50);

        Assert.Equal(5.5, result, precision: 6);
    }

    [Fact]
    public void TenthPercentile_InterpolatesNearLowEnd()
    {
        var result = PercentileHelper.Percentile(Samples, 10);

        Assert.Equal(1.9, result, precision: 6);
    }

    [Fact]
    public void SingleSample_ReturnsThatSample()
    {
        var result = PercentileHelper.Percentile(new List<double> { 42 }, 50);

        Assert.Equal(42, result);
    }

    [Fact]
    public void EmptySamples_ReturnsZero()
    {
        var result = PercentileHelper.Percentile(new List<double>(), 50);

        Assert.Equal(0, result);
    }
}
