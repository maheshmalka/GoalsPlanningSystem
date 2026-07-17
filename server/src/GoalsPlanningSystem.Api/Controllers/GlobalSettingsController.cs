using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/global-settings")]
public class GlobalSettingsController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    [HttpGet("asset-classes")]
    public async Task<ActionResult<List<AssetClassDto>>> GetAssetClasses()
    {
        var classes = await db.AssetClasses.AsNoTracking().ToListAsync();
        return classes.Select(a => new AssetClassDto(a.Id, a.Name, a.ExpectedAnnualReturnPct, a.AnnualVolatilityPct)).ToList();
    }

    [HttpPut("asset-classes/{id:int}")]
    public async Task<ActionResult<AssetClassDto>> UpdateAssetClass(int id, AssetClassUpsertDto dto)
    {
        var assetClass = await db.AssetClasses.FirstOrDefaultAsync(a => a.Id == id);
        if (assetClass is null) return NotFound();

        assetClass.ExpectedAnnualReturnPct = dto.ExpectedAnnualReturnPct;
        assetClass.AnnualVolatilityPct = dto.AnnualVolatilityPct;
        await db.SaveChangesAsync();
        return new AssetClassDto(assetClass.Id, assetClass.Name, assetClass.ExpectedAnnualReturnPct, assetClass.AnnualVolatilityPct);
    }

    [HttpGet("correlations")]
    public async Task<ActionResult<List<CorrelationDto>>> GetCorrelations()
    {
        var correlations = await db.AssetClassCorrelations.AsNoTracking().ToListAsync();
        return correlations.Select(c => new CorrelationDto(c.AssetClassAId, c.AssetClassBId, c.Correlation)).ToList();
    }

    [HttpPut("correlations")]
    public async Task<ActionResult<CorrelationDto>> UpdateCorrelation(CorrelationDto dto)
    {
        var correlation = await db.AssetClassCorrelations.FirstOrDefaultAsync(c =>
            (c.AssetClassAId == dto.AssetClassAId && c.AssetClassBId == dto.AssetClassBId) ||
            (c.AssetClassAId == dto.AssetClassBId && c.AssetClassBId == dto.AssetClassAId));
        if (correlation is null) return NotFound();

        correlation.Correlation = dto.Correlation;
        await db.SaveChangesAsync();
        return dto;
    }

    [HttpGet("tax-slabs")]
    public async Task<ActionResult<List<TaxSlabDto>>> GetTaxSlabs()
    {
        var slabs = await db.TaxSlabs.AsNoTracking().OrderBy(s => s.Regime).ThenBy(s => s.SlabOrder).ToListAsync();
        return slabs.Select(s => new TaxSlabDto(s.Id, s.Regime, s.SlabOrder, s.LowerBound, s.UpperBound, s.RatePct)).ToList();
    }

    [HttpPut("tax-slabs/{id:int}")]
    public async Task<ActionResult<TaxSlabDto>> UpdateTaxSlab(int id, TaxSlabDto dto)
    {
        var slab = await db.TaxSlabs.FirstOrDefaultAsync(s => s.Id == id);
        if (slab is null) return NotFound();

        slab.LowerBound = dto.LowerBound;
        slab.UpperBound = dto.UpperBound;
        slab.RatePct = dto.RatePct;
        await db.SaveChangesAsync();
        return new TaxSlabDto(slab.Id, slab.Regime, slab.SlabOrder, slab.LowerBound, slab.UpperBound, slab.RatePct);
    }

    [HttpGet("tax-settings")]
    public async Task<ActionResult<List<TaxSettingsDto>>> GetTaxSettings()
    {
        var settings = await db.TaxSettings.AsNoTracking().ToListAsync();
        return settings.Select(s => new TaxSettingsDto(s.Regime, s.StandardDeduction, s.RebateIncomeThreshold, s.RebateMaxAmount, s.CessPct)).ToList();
    }

    [HttpPut("tax-settings/{regime}")]
    public async Task<ActionResult<TaxSettingsDto>> UpdateTaxSettings(TaxRegime regime, TaxSettingsDto dto)
    {
        var settings = await db.TaxSettings.FirstOrDefaultAsync(s => s.Regime == regime);
        if (settings is null) return NotFound();

        settings.StandardDeduction = dto.StandardDeduction;
        settings.RebateIncomeThreshold = dto.RebateIncomeThreshold;
        settings.RebateMaxAmount = dto.RebateMaxAmount;
        settings.CessPct = dto.CessPct;
        await db.SaveChangesAsync();
        return dto;
    }

    [HttpGet("capital-gains-rules")]
    public async Task<ActionResult<List<CapitalGainsRuleDto>>> GetCapitalGainsRules()
    {
        var rules = await db.CapitalGainsRules.AsNoTracking().ToListAsync();
        return rules.Select(r => new CapitalGainsRuleDto(
            r.AssetCategory, r.HoldingPeriodMonthsThreshold, r.ShortTermTaxedAtSlabRate, r.ShortTermRatePct, r.LongTermRatePct, r.LongTermExemptionAmount)).ToList();
    }

    [HttpPut("capital-gains-rules/{category}")]
    public async Task<ActionResult<CapitalGainsRuleDto>> UpdateCapitalGainsRule(CapitalGainsAssetCategory category, CapitalGainsRuleDto dto)
    {
        var rule = await db.CapitalGainsRules.FirstOrDefaultAsync(r => r.AssetCategory == category);
        if (rule is null) return NotFound();

        rule.HoldingPeriodMonthsThreshold = dto.HoldingPeriodMonthsThreshold;
        rule.ShortTermTaxedAtSlabRate = dto.ShortTermTaxedAtSlabRate;
        rule.ShortTermRatePct = dto.ShortTermRatePct;
        rule.LongTermRatePct = dto.LongTermRatePct;
        rule.LongTermExemptionAmount = dto.LongTermExemptionAmount;
        await db.SaveChangesAsync();
        return dto;
    }
}
