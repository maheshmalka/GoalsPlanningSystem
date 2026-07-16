namespace GoalsPlanningSystem.Domain.Entities;

public class RiskQuestionOption
{
    public int Id { get; set; }
    public int RiskQuestionId { get; set; }
    public RiskQuestion RiskQuestion { get; set; } = null!;

    public int DisplayOrder { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Points { get; set; }
}
