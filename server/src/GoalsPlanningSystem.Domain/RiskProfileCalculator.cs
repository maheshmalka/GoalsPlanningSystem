using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain;

public static class RiskProfileCalculator
{
    /// <summary>Maps a questionnaire score (as a % of the maximum possible score) to a risk profile.</summary>
    public static RiskProfile FromScorePercentage(decimal percentage) => percentage switch
    {
        < 20m => Enums.RiskProfile.Conservative,
        < 40m => Enums.RiskProfile.ModeratelyConservative,
        < 60m => Enums.RiskProfile.Moderate,
        < 80m => Enums.RiskProfile.ModeratelyAggressive,
        _ => Enums.RiskProfile.Aggressive
    };
}
