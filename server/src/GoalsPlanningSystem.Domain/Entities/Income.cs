using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

public class Income
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public IncomeType IncomeType { get; set; }
    public decimal AnnualAmount { get; set; }
    public int StartYear { get; set; }

    /// <summary>Null = continues through the end of the plan horizon.</summary>
    public int? EndYear { get; set; }

    public decimal AnnualGrowthRatePct { get; set; }
}
