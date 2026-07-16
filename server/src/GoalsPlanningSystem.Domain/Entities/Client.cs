using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public int RetirementAge { get; set; } = 60;
    public int LifeExpectancyAge { get; set; } = 85;

    public TaxRegime TaxRegime { get; set; } = TaxRegime.New;

    /// <summary>Single blended figure standing in for itemized 80C/80D/HRA etc. Old regime only.</summary>
    public decimal TotalDeductionsAmount { get; set; }

    public int? RiskScore { get; set; }
    public RiskProfile? RiskProfile { get; set; }
    public RiskProfile? RiskProfileOverride { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Account> Accounts { get; set; } = [];
    public List<Income> Incomes { get; set; } = [];
    public List<Expense> Expenses { get; set; } = [];
    public List<Goal> Goals { get; set; } = [];
    public List<RiskQuestionnaireResponse> RiskQuestionnaireResponses { get; set; } = [];

    public RiskProfile? EffectiveRiskProfile => RiskProfileOverride ?? RiskProfile;
}
