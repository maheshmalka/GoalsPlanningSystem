using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Infrastructure;
using GoalsPlanningSystem.Simulation;
using GoalsPlanningSystem.Simulation.MonteCarlo;
using GoalsPlanningSystem.Simulation.Tax;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/plans/{planId:int}/projections")]
public class ProjectionsController(GoalsPlanningSystemDbContext db) : ControllerBase
{
    private const decimal DefaultNpsAnnuitizationPct = 40m;
    private const decimal DefaultAssumedAnnuityRatePct = 6m;

    [HttpPost]
    public async Task<ActionResult<SimulationResult>> Run(int planId)
    {
        var plan = await db.Plans.AsNoTracking().Include(p => p.Clients).FirstOrDefaultAsync(p => p.Id == planId);
        if (plan is null) return NotFound();

        if (plan.Clients.Count == 0)
        {
            return Problem("Plan has no clients to project.");
        }

        // Single-household-timeline simplification: the primary client's age, retirement, and tax regime
        // drive the simulation; the other client's accounts/income still pool in, but their own
        // retirement age and tax situation aren't separately modeled.
        var primaryClient = plan.Clients.FirstOrDefault(c => c.Id == plan.PrimaryClientId) ?? plan.Clients.First();

        var clientIds = plan.Clients.Select(c => c.Id).ToList();
        var accounts = await db.Accounts.AsNoTracking().Include(a => a.Allocations)
            .Where(a => clientIds.Contains(a.ClientId)).ToListAsync();
        var incomes = await db.Incomes.AsNoTracking().Where(i => clientIds.Contains(i.ClientId)).ToListAsync();
        var expenses = await db.Expenses.AsNoTracking().Where(e => e.PlanId == planId).ToListAsync();
        var goals = await db.Goals.AsNoTracking().Include(g => g.AccountLinks).Where(g => g.PlanId == planId).ToListAsync();

        var assetClasses = await db.AssetClasses.AsNoTracking().ToListAsync();
        var correlations = await db.AssetClassCorrelations.AsNoTracking().ToListAsync();
        var taxSlabs = await db.TaxSlabs.AsNoTracking().ToListAsync();
        var taxSettings = await db.TaxSettings.AsNoTracking().ToListAsync();
        var capitalGainsRules = await db.CapitalGainsRules.AsNoTracking().ToListAsync();

        if (accounts.Count == 0)
        {
            return Problem("Plan has no accounts to project.");
        }

        var cashAssetClass = assetClasses.FirstOrDefault(a => a.Name == "Cash") ?? assetClasses.First();
        var cgtRuleByCategory = capitalGainsRules.ToDictionary(r => r.AssetCategory, ToCgtRuleInput);

        var request = new SimulationRequest(
            Client: new ClientProfileInput(
                primaryClient.DateOfBirth, primaryClient.RetirementAge, primaryClient.LifeExpectancyAge,
                primaryClient.TaxRegime, primaryClient.TotalDeductionsAmount),
            Accounts: accounts.Select(a => ToAccountInput(a, cgtRuleByCategory)).ToList(),
            Incomes: incomes.Select(i => new IncomeInput(i.IncomeType, i.AnnualAmount, i.StartYear, i.EndYear, i.AnnualGrowthRatePct)).ToList(),
            Expenses: expenses.Select(e => new ExpenseInput(e.AnnualAmount, e.StartYear, e.EndYear, e.GrowthRateOverridePct ?? plan.InflationRatePct)).ToList(),
            Goals: goals.Select(g => new GoalInput(
                g.Id, g.Name, g.TargetAmount, g.StartYear, g.EndYear, g.IsRecurring,
                g.GrowthRateOverridePct ?? plan.InflationRatePct,
                g.AccountLinks.Select(l => l.AccountId).ToList())).ToList(),
            AssetClasses: assetClasses.Select(a => new AssetClassAssumption(a.Id, a.Name, (double)a.ExpectedAnnualReturnPct, (double)a.AnnualVolatilityPct)).ToList(),
            Correlations: correlations.Select(c => new AssetClassCorrelationPair(c.AssetClassAId, c.AssetClassBId, (double)c.Correlation)).ToList(),
            CashAssetClassId: cashAssetClass.Id,
            TaxRegimes: BuildTaxRegimes(taxSlabs, taxSettings),
            CapitalGainsRules: cgtRuleByCategory,
            Settings: new SimulationSettingsInput(plan.SimulationCount, plan.InflationRatePct, DateTime.UtcNow.Year));

        var result = SimulationEngine.Run(request);
        return result;
    }

    private static AccountInput ToAccountInput(Account a, Dictionary<CapitalGainsAssetCategory, CapitalGainsRuleInput> cgtRules)
    {
        var monthlyContribution = a.ContributionFrequency switch
        {
            ContributionFrequency.Monthly => a.ContributionAmount,
            ContributionFrequency.Annual => a.ContributionAmount / 12m,
            _ => 0m
        };

        var cgtRule = a.CapitalGainsCategory.HasValue && cgtRules.TryGetValue(a.CapitalGainsCategory.Value, out var rule) ? rule : null;

        return new AccountInput(
            a.Id, a.TaxTreatment, cgtRule, a.CapitalGainsCategory, a.CurrentBalance,
            a.Allocations.ToDictionary(al => al.AssetClassId, al => (double)(al.Percentage / 100m)),
            monthlyContribution, a.EmployerMatchPct ?? 0m,
            a.AccountType == AccountType.Nps,
            a.NpsAnnuitizationPct ?? DefaultNpsAnnuitizationPct,
            a.AssumedAnnuityRatePct ?? DefaultAssumedAnnuityRatePct);
    }

    private static CapitalGainsRuleInput ToCgtRuleInput(CapitalGainsRule r) =>
        new(r.ShortTermTaxedAtSlabRate ? 0 : r.HoldingPeriodMonthsThreshold, r.LongTermRatePct, r.LongTermExemptionAmount);

    private static Dictionary<TaxRegime, TaxRegimeConfig> BuildTaxRegimes(List<TaxSlab> slabs, List<TaxSettings> settings) =>
        settings.ToDictionary(
            s => s.Regime,
            s => new TaxRegimeConfig(
                slabs.Where(sl => sl.Regime == s.Regime).OrderBy(sl => sl.SlabOrder)
                    .Select(sl => new TaxSlabRule(sl.SlabOrder, sl.LowerBound, sl.UpperBound, sl.RatePct)).ToList(),
                new TaxSettingsInput(s.StandardDeduction, s.RebateIncomeThreshold, s.RebateMaxAmount, s.CessPct)));
}
