using GoalsPlanningSystem.Simulation.Random;

namespace GoalsPlanningSystem.Simulation.MonteCarlo;

/// <summary>
/// Draws correlated monthly returns across asset classes via Cholesky decomposition of their correlation
/// matrix combined with a geometric Brownian motion conversion of each class's annual return/volatility.
/// </summary>
public class CorrelatedReturnGenerator
{
    private readonly List<AssetClassAssumption> _assetClasses;
    private readonly double[,] _choleskyL;
    private readonly double[] _monthlyLogMu;
    private readonly double[] _monthlySigma;

    public IReadOnlyList<AssetClassAssumption> AssetClasses => _assetClasses;

    public CorrelatedReturnGenerator(IReadOnlyList<AssetClassAssumption> assetClasses, IReadOnlyList<AssetClassCorrelationPair> correlations)
    {
        _assetClasses = assetClasses.OrderBy(a => a.AssetClassId).ToList();
        var n = _assetClasses.Count;
        var indexById = _assetClasses.Select((a, i) => (a.AssetClassId, i)).ToDictionary(x => x.AssetClassId, x => x.i);

        var matrix = new double[n, n];
        for (var i = 0; i < n; i++)
        {
            matrix[i, i] = 1.0;
        }

        foreach (var pair in correlations)
        {
            if (!indexById.TryGetValue(pair.AssetClassAId, out var i) || !indexById.TryGetValue(pair.AssetClassBId, out var j))
            {
                continue;
            }

            matrix[i, j] = pair.Correlation;
            matrix[j, i] = pair.Correlation;
        }

        _choleskyL = CholeskyDecomposition.Decompose(matrix);

        _monthlyLogMu = new double[n];
        _monthlySigma = new double[n];
        for (var i = 0; i < n; i++)
        {
            var annualReturn = _assetClasses[i].ExpectedAnnualReturnPct / 100.0;
            var annualVol = _assetClasses[i].AnnualVolatilityPct / 100.0;
            var monthlyArithmeticMu = Math.Pow(1 + annualReturn, 1.0 / 12) - 1;
            var monthlySigma = annualVol / Math.Sqrt(12);
            _monthlySigma[i] = monthlySigma;
            _monthlyLogMu[i] = Math.Log(1 + monthlyArithmeticMu) - 0.5 * monthlySigma * monthlySigma;
        }
    }

    /// <summary>Returns one correlated simple monthly return per asset class, in the same order as <see cref="AssetClasses"/>.</summary>
    public double[] GenerateMonthlyReturns(GaussianRandom rng)
    {
        var n = _assetClasses.Count;
        var z = new double[n];
        for (var i = 0; i < n; i++)
        {
            z[i] = rng.NextStandardNormal();
        }

        var correlatedZ = CholeskyDecomposition.Multiply(_choleskyL, z);
        var returns = new double[n];
        for (var i = 0; i < n; i++)
        {
            returns[i] = Math.Exp(_monthlyLogMu[i] + _monthlySigma[i] * correlatedZ[i]) - 1;
        }

        return returns;
    }
}
