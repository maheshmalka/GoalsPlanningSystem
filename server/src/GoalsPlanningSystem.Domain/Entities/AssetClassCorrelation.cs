namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Pairwise correlation between two distinct asset classes. Store one row per unordered pair.</summary>
public class AssetClassCorrelation
{
    public int Id { get; set; }
    public int AssetClassAId { get; set; }
    public AssetClass AssetClassA { get; set; } = null!;
    public int AssetClassBId { get; set; }
    public AssetClass AssetClassB { get; set; } = null!;
    public decimal Correlation { get; set; }
}
