using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation;
using GoalsPlanningSystem.Simulation.MonteCarlo;
using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Tests;

public class SimulationEngineTests
{
    private static readonly TaxRegimeConfig NewRegime = new(
        Slabs:
        [
            new(1, 0, 400_000, 0m), new(2, 400_000, 800_000, 5m), new(3, 800_000, 1_200_000, 10m),
            new(4, 1_200_000, 1_600_000, 15m), new(5, 1_600_000, 2_000_000, 20m),
            new(6, 2_000_000, 2_400_000, 25m), new(7, 2_400_000, null, 30m)
        ],
        Settings: new TaxSettingsInput(75_000m, 1_200_000m, 60_000m, 4m));

    private static readonly CapitalGainsRuleInput EquityRule = new(12, 12.5m, 125_000m);

    [Fact]
    public void NoIncomeOrExpenses_NeverShortfalls_AndProducesOrderedPercentileBands()
    {
        var request = new SimulationRequest(
            Client: new ClientProfileInput(new DateOnly(1996, 1, 1), RetirementAge: 60, LifeExpectancyAge: 65, TaxRegime.New, TotalDeductionsAmount: 0m),
            Accounts:
            [
                new AccountInput(
                    AccountId: 1, TaxTreatment: TaxTreatment.Taxable, CgtRule: EquityRule, CgtCategory: CapitalGainsAssetCategory.Equity,
                    CurrentBalance: 1_000_000m, AllocationWeights: new Dictionary<int, double> { [1] = 1.0 },
                    MonthlyContribution: 0m, EmployerMatchPct: 0m, IsNps: false, NpsAnnuitizationPct: 0m, AssumedAnnuityRatePct: 0m)
            ],
            Incomes: [],
            Expenses: [],
            Goals: [],
            AssetClasses: [new AssetClassAssumption(1, "Indian Equity", 12.0, 18.0)],
            Correlations: [],
            CashAssetClassId: 1,
            TaxRegimes: new Dictionary<TaxRegime, TaxRegimeConfig> { [TaxRegime.New] = NewRegime },
            CapitalGainsRules: new Dictionary<CapitalGainsAssetCategory, CapitalGainsRuleInput> { [CapitalGainsAssetCategory.Equity] = EquityRule },
            Settings: new SimulationSettingsInput(SimulationCount: 200, InflationRatePct: 7m, AsOfYear: 2026, RandomSeed: 123));

        var result = SimulationEngine.Run(request);

        Assert.Equal(100.0, result.ProbabilityOfPlanSuccessPct);
        Assert.Null(result.FundingRatio);
        Assert.NotEmpty(result.ProjectionBands);
        Assert.All(result.ProjectionBands, band =>
        {
            Assert.True(band.WorstCase <= band.AverageCase, $"Year {band.Year}: worst {band.WorstCase} should be <= average {band.AverageCase}");
            Assert.True(band.AverageCase <= band.BestCase, $"Year {band.Year}: average {band.AverageCase} should be <= best {band.BestCase}");
        });
    }

    [Fact]
    public void UnaffordableExpenses_DepletesPortfolioAndReportsShortfall()
    {
        var request = new SimulationRequest(
            Client: new ClientProfileInput(new DateOnly(1966, 1, 1), RetirementAge: 60, LifeExpectancyAge: 65, TaxRegime.New, TotalDeductionsAmount: 0m),
            Accounts:
            [
                new AccountInput(
                    1, TaxTreatment.Taxable, EquityRule, CapitalGainsAssetCategory.Equity,
                    CurrentBalance: 100_000m, AllocationWeights: new Dictionary<int, double> { [1] = 1.0 },
                    MonthlyContribution: 0m, EmployerMatchPct: 0m, IsNps: false, NpsAnnuitizationPct: 0m, AssumedAnnuityRatePct: 0m)
            ],
            Incomes: [],
            Expenses: [new ExpenseInput(AnnualAmount: 5_000_000m, StartYear: 2026, EndYear: null, GrowthRatePct: 7m, Category: ExpenseCategory.Essential)],
            Goals: [],
            AssetClasses: [new AssetClassAssumption(1, "Indian Equity", 12.0, 18.0)],
            Correlations: [],
            CashAssetClassId: 1,
            TaxRegimes: new Dictionary<TaxRegime, TaxRegimeConfig> { [TaxRegime.New] = NewRegime },
            CapitalGainsRules: new Dictionary<CapitalGainsAssetCategory, CapitalGainsRuleInput> { [CapitalGainsAssetCategory.Equity] = EquityRule },
            Settings: new SimulationSettingsInput(SimulationCount: 50, InflationRatePct: 7m, AsOfYear: 2026, RandomSeed: 99));

        var result = SimulationEngine.Run(request);

        Assert.Equal(0.0, result.ProbabilityOfPlanSuccessPct);
    }
}
