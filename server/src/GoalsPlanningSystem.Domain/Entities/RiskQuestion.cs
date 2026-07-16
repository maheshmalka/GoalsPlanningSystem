namespace GoalsPlanningSystem.Domain.Entities;

public class RiskQuestion
{
    public int Id { get; set; }
    public int DisplayOrder { get; set; }
    public string Text { get; set; } = string.Empty;

    public List<RiskQuestionOption> Options { get; set; } = [];
}
