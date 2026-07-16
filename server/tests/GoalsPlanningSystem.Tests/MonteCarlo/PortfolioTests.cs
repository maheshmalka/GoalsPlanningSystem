using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation.MonteCarlo;

namespace GoalsPlanningSystem.Tests.MonteCarlo;

public class PortfolioTests
{
    private static SimAccount Account(int id, TaxTreatment treatment, decimal balance, bool isNps = false) => new()
    {
        AccountId = id,
        TaxTreatment = treatment,
        CgtRule = null,
        Balance = balance,
        CostBasis = balance,
        AllocationWeights = new Dictionary<int, double>(),
        MonthlyContribution = 0m,
        EmployerMatchPct = 0m,
        IsNps = isNps,
        NpsAnnuitizationPct = 0m,
        AssumedAnnuityRatePct = 0m
    };

    [Fact]
    public void Withdraw_DrainsTaxableBeforeTaxDeferredBeforeTaxFree()
    {
        var portfolio = new Portfolio(
        [
            Account(1, TaxTreatment.Taxable, 1000m),
            Account(2, TaxTreatment.TaxDeferred, 1000m),
            Account(3, TaxTreatment.TaxFree, 1000m)
        ]);

        var result = portfolio.Withdraw(1500m);

        Assert.Equal(1500m, result.TotalWithdrawn);
        Assert.Equal(0m, result.Shortfall);
        Assert.Equal(0m, portfolio.Accounts.Single(a => a.AccountId == 1).Balance);
        Assert.Equal(500m, portfolio.Accounts.Single(a => a.AccountId == 2).Balance);
        Assert.Equal(1000m, portfolio.Accounts.Single(a => a.AccountId == 3).Balance);
    }

    [Fact]
    public void Withdraw_MoreThanAvailable_ReportsShortfallAndDrainsEverything()
    {
        var portfolio = new Portfolio(
        [
            Account(1, TaxTreatment.Taxable, 1000m),
            Account(2, TaxTreatment.TaxFree, 1000m)
        ]);

        var result = portfolio.Withdraw(3000m);

        Assert.Equal(2000m, result.TotalWithdrawn);
        Assert.Equal(1000m, result.Shortfall);
        Assert.Equal(0m, portfolio.TotalValue);
    }

    [Fact]
    public void AnnuitizeNps_SplitsBalanceIntoAnnuityIncomeAndTaxFreeLumpSum()
    {
        var npsAccount = new SimAccount
        {
            AccountId = 1,
            TaxTreatment = TaxTreatment.TaxDeferred,
            CgtRule = null,
            Balance = 1_000_000m,
            CostBasis = 1_000_000m,
            AllocationWeights = new Dictionary<int, double> { [10] = 1.0 },
            MonthlyContribution = 0m,
            EmployerMatchPct = 0m,
            IsNps = true,
            NpsAnnuitizationPct = 40m,
            AssumedAnnuityRatePct = 6m
        };
        var portfolio = new Portfolio([npsAccount]);

        var result = portfolio.AnnuitizeNps(cashAssetClassId: 10);

        // Annuitized: 40% of 10,00,000 = 4,00,000 @ 6%/yr / 12 = 2,000/month. Lump sum: 6,00,000.
        Assert.Equal(2_000m, result.MonthlyAnnuityIncome);
        Assert.Equal(600_000m, result.LumpSumAmount);
        Assert.Equal(0m, npsAccount.Balance);
        Assert.True(npsAccount.NpsAnnuitized);
        Assert.Equal(600_000m, portfolio.TotalValue);
    }

    [Fact]
    public void WithdrawFromAccounts_PrefersLinkedAccountsOverGeneralPool()
    {
        var portfolio = new Portfolio(
        [
            Account(1, TaxTreatment.Taxable, 500m),
            Account(2, TaxTreatment.Taxable, 1000m)
        ]);

        var result = portfolio.WithdrawFromAccounts(300m, [1]);

        Assert.Equal(300m, result.TotalWithdrawn);
        Assert.Equal(0m, result.Shortfall);
        Assert.Equal(200m, portfolio.Accounts.Single(a => a.AccountId == 1).Balance);
        Assert.Equal(1000m, portfolio.Accounts.Single(a => a.AccountId == 2).Balance);
    }
}
