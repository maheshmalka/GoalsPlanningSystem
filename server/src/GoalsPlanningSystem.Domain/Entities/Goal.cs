using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

public class Goal
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public GoalType GoalType { get; set; }
    public decimal TargetAmount { get; set; }
    public GoalPriority Priority { get; set; } = GoalPriority.Important;
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public bool IsRecurring { get; set; }

    /// <summary>Null = use the global inflation rate.</summary>
    public decimal? GrowthRateOverridePct { get; set; }

    /// <summary>Optional earmarking; empty = funded from the general portfolio pool.</summary>
    public List<GoalAccountLink> AccountLinks { get; set; } = [];
}
