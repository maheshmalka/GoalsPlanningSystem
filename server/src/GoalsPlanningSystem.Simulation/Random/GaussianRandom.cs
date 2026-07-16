namespace GoalsPlanningSystem.Simulation.Random;

/// <summary>Seedable standard-normal generator (Box-Muller) so simulations are reproducible in tests.</summary>
public class GaussianRandom(int? seed = null)
{
    private readonly System.Random _random = seed.HasValue ? new System.Random(seed.Value) : new System.Random();
    private double? _spare;

    public double NextStandardNormal()
    {
        if (_spare.HasValue)
        {
            var value = _spare.Value;
            _spare = null;
            return value;
        }

        double u1, u2, s;
        do
        {
            u1 = 2.0 * _random.NextDouble() - 1.0;
            u2 = 2.0 * _random.NextDouble() - 1.0;
            s = u1 * u1 + u2 * u2;
        } while (s is >= 1.0 or 0.0);

        var factor = Math.Sqrt(-2.0 * Math.Log(s) / s);
        _spare = u2 * factor;
        return u1 * factor;
    }

    public double NextUniform() => _random.NextDouble();
}
