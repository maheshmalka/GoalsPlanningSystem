using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Current-rules-only STCG/LTCG treatment per asset category. Editable since these change with the Budget.</summary>
public class CapitalGainsRule
{
    public int Id { get; set; }
    public CapitalGainsAssetCategory AssetCategory { get; set; }
    public int HoldingPeriodMonthsThreshold { get; set; }

    /// <summary>When true, short-term gains are taxed at the client's slab rate rather than <see cref="ShortTermRatePct"/> (debt mutual funds).</summary>
    public bool ShortTermTaxedAtSlabRate { get; set; }

    public decimal ShortTermRatePct { get; set; }
    public decimal LongTermRatePct { get; set; }

    /// <summary>Annual exemption on long-term gains before <see cref="LongTermRatePct"/> applies (e.g. ₹1.25L for equity).</summary>
    public decimal LongTermExemptionAmount { get; set; }
}
