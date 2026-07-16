using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record IncomeDto(int Id, int ClientId, string Name, IncomeType IncomeType, decimal AnnualAmount, int StartYear, int? EndYear, decimal AnnualGrowthRatePct);

public record IncomeUpsertDto(string Name, IncomeType IncomeType, decimal AnnualAmount, int StartYear, int? EndYear, decimal AnnualGrowthRatePct);

public record ExpenseDto(int Id, int ClientId, string Name, ExpenseCategory Category, decimal AnnualAmount, int StartYear, int? EndYear, decimal? GrowthRateOverridePct);

public record ExpenseUpsertDto(string Name, ExpenseCategory Category, decimal AnnualAmount, int StartYear, int? EndYear, decimal? GrowthRateOverridePct);
