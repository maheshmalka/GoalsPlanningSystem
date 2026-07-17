using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public ExpenseCategory Category { get; set; }
    public decimal AnnualAmount { get; set; }
    public int StartYear { get; set; }
    public int? EndYear { get; set; }

    /// <summary>Null = use the plan's inflation rate.</summary>
    public decimal? GrowthRateOverridePct { get; set; }
}
