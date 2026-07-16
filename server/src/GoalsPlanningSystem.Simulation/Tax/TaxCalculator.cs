namespace GoalsPlanningSystem.Simulation.Tax;

/// <summary>Slab-based ordinary income tax: standard deduction, per-bracket rates, Section 87A rebate, then cess.</summary>
public static class TaxCalculator
{
    public static decimal CalculateOrdinaryTax(
        decimal grossIncome,
        decimal additionalDeductions,
        IReadOnlyList<TaxSlabRule> slabs,
        TaxSettingsInput settings)
    {
        var taxableIncome = Math.Max(0m, grossIncome - settings.StandardDeduction - additionalDeductions);

        var slabTax = 0m;
        foreach (var slab in slabs.OrderBy(s => s.SlabOrder))
        {
            if (taxableIncome <= slab.LowerBound)
            {
                continue;
            }

            var upper = slab.UpperBound ?? decimal.MaxValue;
            var amountInSlab = Math.Min(taxableIncome, upper) - slab.LowerBound;
            if (amountInSlab <= 0)
            {
                continue;
            }

            slabTax += amountInSlab * slab.RatePct / 100m;
        }

        if (taxableIncome <= settings.RebateIncomeThreshold)
        {
            var rebate = Math.Min(slabTax, settings.RebateMaxAmount);
            slabTax -= rebate;
        }

        var cess = slabTax * settings.CessPct / 100m;
        return slabTax + cess;
    }
}
