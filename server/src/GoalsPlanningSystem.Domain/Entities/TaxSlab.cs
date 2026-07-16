using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>One bracket of a regime's slab table. Kept as editable data since Union Budget changes these yearly.</summary>
public class TaxSlab
{
    public int Id { get; set; }
    public TaxRegime Regime { get; set; }
    public int SlabOrder { get; set; }
    public decimal LowerBound { get; set; }

    /// <summary>Null = no upper cap (top bracket).</summary>
    public decimal? UpperBound { get; set; }

    public decimal RatePct { get; set; }
}
