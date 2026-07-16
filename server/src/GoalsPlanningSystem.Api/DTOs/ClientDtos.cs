using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record ClientListItemDto(int Id, string Name, int Age, RiskProfile? EffectiveRiskProfile);

public record ClientDetailDto(
    int Id,
    string Name,
    DateOnly DateOfBirth,
    int RetirementAge,
    int LifeExpectancyAge,
    TaxRegime TaxRegime,
    decimal TotalDeductionsAmount,
    int? RiskScore,
    RiskProfile? RiskProfile,
    RiskProfile? RiskProfileOverride,
    string? Notes);

public record ClientUpsertDto(
    string Name,
    DateOnly DateOfBirth,
    int RetirementAge,
    int LifeExpectancyAge,
    TaxRegime TaxRegime,
    decimal TotalDeductionsAmount,
    RiskProfile? RiskProfileOverride,
    string? Notes);
