namespace GoalsPlanningSystem.Api.DTOs;

public record InsightDto(
    string Id,
    string Title,
    string Description,
    double BaselineProbabilityOfSuccessPct,
    double ProjectedProbabilityOfSuccessPct,
    double ProbabilityDeltaPct,
    decimal? BaselineFundingRatio,
    decimal? ProjectedFundingRatio);

public record PlanInsightsDto(
    double BaselineProbabilityOfSuccessPct,
    decimal? BaselineFundingRatio,
    List<InsightDto> Insights);
