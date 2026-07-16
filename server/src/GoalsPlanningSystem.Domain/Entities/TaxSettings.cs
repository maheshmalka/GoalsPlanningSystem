using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Per-regime standard deduction, Section 87A rebate, and cess. One row per <see cref="TaxRegime"/>.</summary>
public class TaxSettings
{
    public int Id { get; set; }
    public TaxRegime Regime { get; set; }
    public decimal StandardDeduction { get; set; }

    /// <summary>Taxable income at/below this qualifies for the full Section 87A rebate.</summary>
    public decimal RebateIncomeThreshold { get; set; }

    /// <summary>Maximum tax rebate amount under Section 87A.</summary>
    public decimal RebateMaxAmount { get; set; }

    public decimal CessPct { get; set; } = 4m;
}
