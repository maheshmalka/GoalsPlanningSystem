namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Singleton row (Id = 1) holding advisor-wide defaults.</summary>
public class GlobalSettings
{
    public int Id { get; set; }
    public decimal InflationRatePct { get; set; } = 7m;
    public int SimulationCount { get; set; } = 2000;
}
