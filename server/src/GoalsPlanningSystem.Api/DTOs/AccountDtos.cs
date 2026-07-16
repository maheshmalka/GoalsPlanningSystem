using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record AllocationDto(int AssetClassId, string AssetClassName, decimal Percentage);

public record AllocationUpsertDto(int AssetClassId, decimal Percentage);

public record AccountDto(
    int Id,
    int ClientId,
    string Name,
    AccountType AccountType,
    TaxTreatment TaxTreatment,
    decimal CurrentBalance,
    decimal ContributionAmount,
    ContributionFrequency ContributionFrequency,
    decimal? EmployerMatchPct,
    decimal? NpsAnnuitizationPct,
    decimal? AssumedAnnuityRatePct,
    List<AllocationDto> Allocations);

public record AccountUpsertDto(
    string Name,
    AccountType AccountType,
    decimal CurrentBalance,
    decimal ContributionAmount,
    ContributionFrequency ContributionFrequency,
    decimal? EmployerMatchPct,
    decimal? NpsAnnuitizationPct,
    decimal? AssumedAnnuityRatePct,
    List<AllocationUpsertDto> Allocations);
