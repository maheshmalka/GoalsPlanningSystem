namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Earmarks a specific account (or part of it) toward funding a goal.</summary>
public class GoalAccountLink
{
    public int Id { get; set; }
    public int GoalId { get; set; }
    public Goal Goal { get; set; } = null!;
    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;
}
