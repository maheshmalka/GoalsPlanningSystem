using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Simulation.Cashflow;

/// <summary>
/// Non-random Income - Expenses - Tax per year, independent of the Monte Carlo engine (does not touch
/// portfolio state - it reflects recurring cashflows only, as is standard in planning-tool cashflow views).
/// </summary>
public static class DeterministicCashflowProjector
{
    public static List<YearlyCashflow> Project(
        IReadOnlyList<IncomeInput> incomes,
        IReadOnlyList<ExpenseInput> expenses,
        decimal totalDeductions,
        TaxRegimeConfig taxRegime,
        int startYear,
        int endYear)
    {
        var results = new List<YearlyCashflow>();

        for (var year = startYear; year <= endYear; year++)
        {
            var income = incomes
                .Where(i => i.StartYear <= year && (i.EndYear is null || year <= i.EndYear))
                .Sum(i => GrowAmount(i.AnnualAmount, i.AnnualGrowthRatePct, year - i.StartYear));

            var expense = expenses
                .Where(e => e.StartYear <= year && (e.EndYear is null || year <= e.EndYear))
                .Sum(e => GrowAmount(e.AnnualAmount, e.GrowthRatePct, year - e.StartYear));

            var tax = TaxCalculator.CalculateOrdinaryTax(income, totalDeductions, taxRegime.Slabs, taxRegime.Settings);
            results.Add(new YearlyCashflow(year, income, expense, tax, income - expense - tax));
        }

        return results;
    }

    private static decimal GrowAmount(decimal baseAmount, decimal annualGrowthRatePct, int yearsElapsed) =>
        baseAmount * (decimal)Math.Pow(1 + (double)annualGrowthRatePct / 100.0, Math.Max(0, yearsElapsed));
}
