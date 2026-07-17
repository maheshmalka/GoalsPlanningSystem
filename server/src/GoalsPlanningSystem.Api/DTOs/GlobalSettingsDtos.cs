using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Api.DTOs;

public record AssetClassDto(int Id, string Name, decimal ExpectedAnnualReturnPct, decimal AnnualVolatilityPct);

public record AssetClassUpsertDto(decimal ExpectedAnnualReturnPct, decimal AnnualVolatilityPct);

public record CorrelationDto(int AssetClassAId, int AssetClassBId, decimal Correlation);

public record TaxSlabDto(int Id, TaxRegime Regime, int SlabOrder, decimal LowerBound, decimal? UpperBound, decimal RatePct);

public record TaxSettingsDto(TaxRegime Regime, decimal StandardDeduction, decimal RebateIncomeThreshold, decimal RebateMaxAmount, decimal CessPct);

public record CapitalGainsRuleDto(
    CapitalGainsAssetCategory AssetCategory,
    int HoldingPeriodMonthsThreshold,
    bool ShortTermTaxedAtSlabRate,
    decimal ShortTermRatePct,
    decimal LongTermRatePct,
    decimal LongTermExemptionAmount);
