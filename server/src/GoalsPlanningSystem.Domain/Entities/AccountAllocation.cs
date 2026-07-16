namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>What % of an account's balance sits in each simulation asset class. Should sum to 100 per account.</summary>
public class AccountAllocation
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;
    public int AssetClassId { get; set; }
    public AssetClass AssetClass { get; set; } = null!;
    public decimal Percentage { get; set; }
}
