using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Tests.Tax;

public class TaxCalculatorTests
{
    private static readonly List<TaxSlabRule> NewRegimeSlabs =
    [
        new(1, 0, 400_000, 0m),
        new(2, 400_000, 800_000, 5m),
        new(3, 800_000, 1_200_000, 10m),
        new(4, 1_200_000, 1_600_000, 15m),
        new(5, 1_600_000, 2_000_000, 20m),
        new(6, 2_000_000, 2_400_000, 25m),
        new(7, 2_400_000, null, 30m)
    ];

    private static readonly TaxSettingsInput NewRegimeSettings = new(
        StandardDeduction: 75_000m, RebateIncomeThreshold: 1_200_000m, RebateMaxAmount: 60_000m, CessPct: 4m);

    private static readonly List<TaxSlabRule> OldRegimeSlabs =
    [
        new(1, 0, 250_000, 0m),
        new(2, 250_000, 500_000, 5m),
        new(3, 500_000, 1_000_000, 20m),
        new(4, 1_000_000, null, 30m)
    ];

    private static readonly TaxSettingsInput OldRegimeSettings = new(
        StandardDeduction: 50_000m, RebateIncomeThreshold: 500_000m, RebateMaxAmount: 12_500m, CessPct: 4m);

    [Fact]
    public void NewRegime_IncomeAboveRebateThreshold_ComputesSlabTaxPlusCess()
    {
        // Gross 15,00,000 -> taxable 14,25,000 after 75,000 standard deduction.
        // Slabs: 4-8L @5% = 20,000; 8-12L @10% = 40,000; 12-14.25L @15% = 33,750 => 93,750 + 4% cess = 97,500.
        var tax = TaxCalculator.CalculateOrdinaryTax(1_500_000m, 0m, NewRegimeSlabs, NewRegimeSettings);

        Assert.Equal(97_500m, tax);
    }

    [Fact]
    public void NewRegime_TaxableIncomeAtRebateThreshold_IsFullyRebatedToZero()
    {
        // Gross 12,75,000 -> taxable exactly 12,00,000, at the Section 87A threshold, so full rebate applies.
        var tax = TaxCalculator.CalculateOrdinaryTax(1_275_000m, 0m, NewRegimeSlabs, NewRegimeSettings);

        Assert.Equal(0m, tax);
    }

    [Fact]
    public void OldRegime_WithDeductions_ComputesSlabTaxPlusCess()
    {
        // Gross 8,00,000 - 50,000 standard - 1,50,000 deductions = 6,00,000 taxable.
        // 2.5-5L @5% = 12,500; 5-6L @20% = 20,000 => 32,500 + 4% cess = 33,800. Above rebate threshold, no rebate.
        var tax = TaxCalculator.CalculateOrdinaryTax(800_000m, 150_000m, OldRegimeSlabs, OldRegimeSettings);

        Assert.Equal(33_800m, tax);
    }

    [Fact]
    public void OldRegime_TaxableIncomeAtRebateThreshold_IsFullyRebatedToZero()
    {
        // Gross 5,50,000 - 50,000 standard = 5,00,000 taxable, at the old-regime rebate threshold.
        var tax = TaxCalculator.CalculateOrdinaryTax(550_000m, 0m, OldRegimeSlabs, OldRegimeSettings);

        Assert.Equal(0m, tax);
    }

    [Fact]
    public void ZeroIncome_ProducesZeroTax()
    {
        var tax = TaxCalculator.CalculateOrdinaryTax(0m, 0m, NewRegimeSlabs, NewRegimeSettings);

        Assert.Equal(0m, tax);
    }
}
