namespace GoalsPlanningSystem.Domain.Entities;

public class AssetClass
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal ExpectedAnnualReturnPct { get; set; }
    public decimal AnnualVolatilityPct { get; set; }

    public List<AccountAllocation> AccountAllocations { get; set; } = [];
}
