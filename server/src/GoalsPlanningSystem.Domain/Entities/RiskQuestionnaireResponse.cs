namespace GoalsPlanningSystem.Domain.Entities;

public class RiskQuestionnaireResponse
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public int RiskQuestionId { get; set; }
    public RiskQuestion RiskQuestion { get; set; } = null!;
    public int RiskQuestionOptionId { get; set; }
    public RiskQuestionOption RiskQuestionOption { get; set; } = null!;

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
