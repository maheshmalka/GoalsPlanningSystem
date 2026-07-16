namespace GoalsPlanningSystem.Simulation.MonteCarlo;

public static class CholeskyDecomposition
{
    /// <summary>
    /// Decomposes a symmetric positive-(semi)definite correlation matrix into lower-triangular L where L*L^T = matrix.
    /// A tiny epsilon is added to the diagonal for numerical stability against near-singular inputs.
    /// </summary>
    public static double[,] Decompose(double[,] matrix)
    {
        var n = matrix.GetLength(0);
        var l = new double[n, n];
        const double epsilon = 1e-8;

        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j <= i; j++)
            {
                var sum = 0.0;
                for (var k = 0; k < j; k++)
                {
                    sum += l[i, k] * l[j, k];
                }

                if (i == j)
                {
                    var diagonal = matrix[i, i] + epsilon - sum;
                    l[i, j] = Math.Sqrt(Math.Max(diagonal, epsilon));
                }
                else
                {
                    l[i, j] = (matrix[i, j] - sum) / l[j, j];
                }
            }
        }

        return l;
    }

    public static double[] Multiply(double[,] l, double[] z)
    {
        var n = z.Length;
        var result = new double[n];
        for (var i = 0; i < n; i++)
        {
            var sum = 0.0;
            for (var j = 0; j <= i; j++)
            {
                sum += l[i, j] * z[j];
            }
            result[i] = sum;
        }
        return result;
    }
}
