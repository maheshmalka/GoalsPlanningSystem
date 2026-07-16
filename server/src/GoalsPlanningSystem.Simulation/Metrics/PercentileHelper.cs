namespace GoalsPlanningSystem.Simulation.Metrics;

public static class PercentileHelper
{
    /// <summary>Linear-interpolation percentile (0-100) over an unsorted sample.</summary>
    public static double Percentile(IReadOnlyList<double> samples, double percentile)
    {
        if (samples.Count == 0)
        {
            return 0;
        }

        var sorted = samples.OrderBy(x => x).ToArray();
        if (sorted.Length == 1)
        {
            return sorted[0];
        }

        var rank = percentile / 100.0 * (sorted.Length - 1);
        var lowerIndex = (int)Math.Floor(rank);
        var upperIndex = (int)Math.Ceiling(rank);
        if (lowerIndex == upperIndex)
        {
            return sorted[lowerIndex];
        }

        var fraction = rank - lowerIndex;
        return sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * fraction;
    }

    public static decimal Percentile(IReadOnlyList<decimal> samples, double percentile) =>
        (decimal)Percentile(samples.Select(s => (double)s).ToList(), percentile);
}
