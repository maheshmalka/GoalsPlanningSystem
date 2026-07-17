using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record GoalDto(
    int Id,
    int PlanId,
    string Name,
    GoalType GoalType,
    decimal TargetAmount,
    GoalPriority Priority,
    int StartYear,
    int EndYear,
    bool IsRecurring,
    decimal? GrowthRateOverridePct,
    List<int> LinkedAccountIds);

public record GoalUpsertDto(
    string Name,
    GoalType GoalType,
    decimal TargetAmount,
    GoalPriority Priority,
    int StartYear,
    int EndYear,
    bool IsRecurring,
    decimal? GrowthRateOverridePct,
    List<int> LinkedAccountIds);
