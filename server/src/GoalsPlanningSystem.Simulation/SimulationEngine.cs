using System.Collections.Concurrent;
using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation.Cashflow;
using GoalsPlanningSystem.Simulation.Metrics;
using GoalsPlanningSystem.Simulation.MonteCarlo;
using GoalsPlanningSystem.Simulation.Random;
using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Simulation;

public static class SimulationEngine
{
    public static SimulationResult Run(SimulationRequest request)
    {
        var currentAge = request.Settings.AsOfYear - request.Client.DateOfBirth.Year;
        var totalYears = Math.Max(1, request.Client.LifeExpectancyAge - currentAge);
        var totalMonths = totalYears * 12;
        var retirementMonth = Math.Max(0, (request.Client.RetirementAge - currentAge) * 12);

        var generator = new CorrelatedReturnGenerator(request.AssetClasses, request.Correlations);
        var assetClassIdToIndex = generator.AssetClasses
            .Select((a, i) => (a.AssetClassId, i))
            .ToDictionary(x => x.AssetClassId, x => x.i);

        var templateAccounts = request.Accounts.Select(ToSimAccount).ToList();
        var taxRegime = request.TaxRegimes[request.Client.TaxRegime];

        var recurringGoals = request.Goals.Where(g => g.IsRecurring).ToList();
        var oneTimeGoals = request.Goals.Where(g => !g.IsRecurring).ToList();

        var pathResults = new PathResult[request.Settings.SimulationCount];

        Parallel.For(0, request.Settings.SimulationCount, pathIndex =>
        {
            var seed = request.Settings.RandomSeed.HasValue
                ? request.Settings.RandomSeed.Value * 1_000_003 + pathIndex
                : (int?)null;
            var rng = new GaussianRandom(seed);
            pathResults[pathIndex] = RunPath(
                request, templateAccounts, generator, assetClassIdToIndex, taxRegime,
                recurringGoals, oneTimeGoals, currentAge, totalMonths, retirementMonth, rng);
        });

        var projectionBands = BuildProjectionBands(pathResults, request.Settings.AsOfYear, totalYears);
        var probabilityOfSuccess = 100.0 * pathResults.Count(p => !p.ExpensesEverShortfell) / pathResults.Length;
        var goalOutcomes = request.Goals.Select(g => new GoalOutcome(
            g.GoalId, g.Name,
            100.0 * pathResults.Count(p => p.GoalSuccess.GetValueOrDefault(g.GoalId, true)) / pathResults.Length)).ToList();

        var worst3MonthLossPct = (decimal)PercentileHelper.Percentile(
            pathResults.Select(p => p.Worst3MonthReturn).ToList(), 10) * 100m;

        var deterministicCashflow = DeterministicCashflowProjector.Project(
            request.Incomes, request.Expenses, request.Client.TotalDeductionsAmount, taxRegime,
            request.Settings.AsOfYear, request.Settings.AsOfYear + totalYears);

        var fundingRatio = CalculateFundingRatio(request, currentAge, totalYears);

        return new SimulationResult(projectionBands, deterministicCashflow, probabilityOfSuccess, goalOutcomes, fundingRatio, worst3MonthLossPct);
    }

    private static PathResult RunPath(
        SimulationRequest request,
        List<SimAccount> templateAccounts,
        CorrelatedReturnGenerator generator,
        Dictionary<int, int> assetClassIdToIndex,
        TaxRegimeConfig taxRegime,
        List<GoalInput> recurringGoals,
        List<GoalInput> oneTimeGoals,
        int currentAge,
        int totalMonths,
        int retirementMonth,
        GaussianRandom rng)
    {
        var portfolio = new Portfolio(templateAccounts.Select(a => a.Clone()).ToList());
        var monthlyReturnHistory = new List<double>(totalMonths);
        var yearEndValues = new Dictionary<int, decimal>();
        var goalSuccess = request.Goals.ToDictionary(g => g.GoalId, _ => true);
        var processedOneTimeGoals = new HashSet<int>();
        var expensesEverShortfell = false;
        decimal npsMonthlyAnnuityIncome = 0m;

        decimal ordinaryIncomeYtd = 0m;
        // Tracked separately from ordinaryIncomeYtd so the annual tax settlement only pulls the
        // portfolio-withdrawal-attributable share of tax from the portfolio. Tax on earned income
        // (salary, NPS annuity, etc.) is assumed paid out of that income's own take-home cash, the
        // same way it never actually reaches the portfolio as a deposit either.
        decimal earnedIncomeYtd = 0m;
        var longTermGainsYtd = new Dictionary<CapitalGainsAssetCategory, decimal>();

        for (var m = 0; m < totalMonths; m++)
        {
            var year = request.Settings.AsOfYear + m / 12;
            var isPreRetirement = m < retirementMonth;

            if (m == retirementMonth)
            {
                var annuitization = portfolio.AnnuitizeNps(request.CashAssetClassId);
                npsMonthlyAnnuityIncome = annuitization.MonthlyAnnuityIncome;
            }

            if (isPreRetirement)
            {
                portfolio.Contribute();
            }

            var monthlyReturns = generator.GenerateMonthlyReturns(rng);
            monthlyReturnHistory.Add(portfolio.GrowMonth(monthlyReturns, assetClassIdToIndex));

            var monthlyIncome = MonthlyAmount(request.Incomes, year, i => i.AnnualAmount, i => i.AnnualGrowthRatePct, i => i.StartYear, i => i.EndYear)
                + (m >= retirementMonth ? npsMonthlyAnnuityIncome : 0m);
            ordinaryIncomeYtd += monthlyIncome;
            earnedIncomeYtd += monthlyIncome;

            var monthlyExpense = MonthlyAmount(request.Expenses, year, e => e.AnnualAmount, e => e.GrowthRatePct, e => e.StartYear, e => e.EndYear);
            var netExpenseNeed = Math.Max(0m, monthlyExpense - monthlyIncome);
            if (netExpenseNeed > 0)
            {
                var wr = portfolio.Withdraw(netExpenseNeed);
                Accumulate(wr, ref ordinaryIncomeYtd, longTermGainsYtd);
                if (wr.Shortfall > 0) expensesEverShortfell = true;
            }

            foreach (var goal in recurringGoals.Where(g => g.StartYear <= year && year <= g.EndYear))
            {
                var monthlyGoalAmount = GrowAmount(goal.TargetAmount, goal.GrowthRatePct, year - goal.StartYear) / 12m;
                var wr = WithdrawForGoal(portfolio, goal, monthlyGoalAmount);
                Accumulate(wr, ref ordinaryIncomeYtd, longTermGainsYtd);
                if (wr.Shortfall > 0) goalSuccess[goal.GoalId] = false;
            }

            if (m % 12 == 0)
            {
                foreach (var goal in oneTimeGoals.Where(g => g.StartYear == year && processedOneTimeGoals.Add(g.GoalId)))
                {
                    var amount = GrowAmount(goal.TargetAmount, goal.GrowthRatePct, year - goal.StartYear);
                    var wr = WithdrawForGoal(portfolio, goal, amount);
                    Accumulate(wr, ref ordinaryIncomeYtd, longTermGainsYtd);
                    goalSuccess[goal.GoalId] = wr.Shortfall <= 0;
                }
            }

            if (m % 12 == 11 || m == totalMonths - 1)
            {
                var ordinaryTax = TaxCalculator.CalculateOrdinaryTax(ordinaryIncomeYtd, request.Client.TotalDeductionsAmount, taxRegime.Slabs, taxRegime.Settings);
                var cgtTax = longTermGainsYtd.Sum(kvp => CapitalGainsTaxCalculator.CalculateLongTermTax(kvp.Value, request.CapitalGainsRules[kvp.Key]));

                // Apportion the (progressive, so not separable exactly) ordinary tax between earned
                // income and withdrawal-sourced income by their share of the year's total, and only
                // withdraw the withdrawal-attributable share plus CGT from the portfolio.
                var withdrawalAttributableFraction = ordinaryIncomeYtd > 0 ? Math.Max(0m, 1m - earnedIncomeYtd / ordinaryIncomeYtd) : 0m;
                var portfolioAttributableTax = ordinaryTax * withdrawalAttributableFraction + cgtTax;
                if (portfolioAttributableTax > 0)
                {
                    var wr = portfolio.Withdraw(portfolioAttributableTax);
                    if (wr.Shortfall > 0) expensesEverShortfell = true;
                }

                ordinaryIncomeYtd = 0m;
                earnedIncomeYtd = 0m;
                longTermGainsYtd.Clear();
                yearEndValues[year] = portfolio.TotalValue;
            }
        }

        var worst3Month = WorstRolling3MonthReturn(monthlyReturnHistory);
        return new PathResult(yearEndValues, expensesEverShortfell, goalSuccess, worst3Month);
    }

    private static WithdrawalResult WithdrawForGoal(Portfolio portfolio, GoalInput goal, decimal amount)
    {
        if (goal.LinkedAccountIds.Count == 0)
        {
            return portfolio.Withdraw(amount);
        }

        var linked = portfolio.WithdrawFromAccounts(amount, goal.LinkedAccountIds);
        if (linked.Shortfall <= 0)
        {
            return linked;
        }

        var fallback = portfolio.Withdraw(linked.Shortfall);
        return MergeResults(linked, fallback);
    }

    private static WithdrawalResult MergeResults(WithdrawalResult a, WithdrawalResult b)
    {
        var merged = new WithdrawalResult
        {
            TotalWithdrawn = a.TotalWithdrawn + b.TotalWithdrawn,
            Shortfall = b.Shortfall,
            OrdinaryIncomeFromGains = a.OrdinaryIncomeFromGains + b.OrdinaryIncomeFromGains
        };
        foreach (var (category, amount) in a.LongTermGainsByCategory) merged.AddLongTermGain(category, amount);
        foreach (var (category, amount) in b.LongTermGainsByCategory) merged.AddLongTermGain(category, amount);
        return merged;
    }

    private static void Accumulate(WithdrawalResult wr, ref decimal ordinaryIncomeYtd, Dictionary<CapitalGainsAssetCategory, decimal> longTermGainsYtd)
    {
        ordinaryIncomeYtd += wr.OrdinaryIncomeFromGains;
        foreach (var (category, amount) in wr.LongTermGainsByCategory)
        {
            longTermGainsYtd[category] = longTermGainsYtd.GetValueOrDefault(category) + amount;
        }
    }

    private static decimal MonthlyAmount<T>(
        IReadOnlyList<T> items, int year,
        Func<T, decimal> amount, Func<T, decimal> growthRate, Func<T, int> startYear, Func<T, int?> endYear) =>
        items.Where(i => startYear(i) <= year && (endYear(i) is null || year <= endYear(i)))
            .Sum(i => GrowAmount(amount(i), growthRate(i), year - startYear(i))) / 12m;

    private static decimal GrowAmount(decimal baseAmount, decimal annualGrowthRatePct, int yearsElapsed) =>
        baseAmount * (decimal)Math.Pow(1 + (double)annualGrowthRatePct / 100.0, Math.Max(0, yearsElapsed));

    private static double WorstRolling3MonthReturn(List<double> monthlyReturns)
    {
        if (monthlyReturns.Count < 3)
        {
            return monthlyReturns.Aggregate(1.0, (acc, r) => acc * (1 + r)) - 1;
        }

        var worst = double.MaxValue;
        for (var t = 0; t <= monthlyReturns.Count - 3; t++)
        {
            var cumulative = (1 + monthlyReturns[t]) * (1 + monthlyReturns[t + 1]) * (1 + monthlyReturns[t + 2]) - 1;
            if (cumulative < worst) worst = cumulative;
        }

        return worst;
    }

    private static List<YearlyProjectionBand> BuildProjectionBands(PathResult[] pathResults, int asOfYear, int totalYears)
    {
        var bands = new List<YearlyProjectionBand>();
        for (var year = asOfYear; year <= asOfYear + totalYears; year++)
        {
            var values = pathResults.Where(p => p.YearEndValues.ContainsKey(year)).Select(p => p.YearEndValues[year]).ToList();
            if (values.Count == 0) continue;

            bands.Add(new YearlyProjectionBand(
                year,
                PercentileHelper.Percentile(values, 10),
                PercentileHelper.Percentile(values, 50),
                PercentileHelper.Percentile(values, 90)));
        }

        return bands;
    }

    private static decimal? CalculateFundingRatio(SimulationRequest request, int currentAge, int totalYears)
    {
        var currentAssets = request.Accounts.Sum(a => a.CurrentBalance);

        var contributions = new List<(int, decimal)>();
        var retirementYearsFromNow = Math.Max(0, request.Client.RetirementAge - currentAge);
        foreach (var account in request.Accounts.Where(a => a.MonthlyContribution > 0))
        {
            for (var y = 0; y < retirementYearsFromNow; y++)
            {
                contributions.Add((y, account.MonthlyContribution * 12m * (1 + account.EmployerMatchPct / 100m)));
            }
        }

        var goalCosts = new List<(int, decimal)>();
        foreach (var goal in request.Goals)
        {
            var startOffset = goal.StartYear - request.Settings.AsOfYear;
            if (goal.IsRecurring)
            {
                var endOffset = goal.EndYear - request.Settings.AsOfYear;
                for (var y = Math.Max(0, startOffset); y <= endOffset; y++)
                {
                    goalCosts.Add((y, GrowAmount(goal.TargetAmount, goal.GrowthRatePct, y - startOffset)));
                }
            }
            else if (startOffset >= 0)
            {
                goalCosts.Add((startOffset, goal.TargetAmount));
            }
        }

        var totalBalance = request.Accounts.Sum(a => a.CurrentBalance);
        var blendedReturn = totalBalance > 0
            ? request.Accounts.Sum(a => (double)(a.CurrentBalance / totalBalance) *
                a.AllocationWeights.Sum(w => w.Value * (request.AssetClasses.First(ac => ac.AssetClassId == w.Key).ExpectedAnnualReturnPct / 100.0)))
            : request.AssetClasses.Average(a => a.ExpectedAnnualReturnPct) / 100.0;

        return FundingRatioCalculator.Calculate(currentAssets, contributions, goalCosts, blendedReturn);
    }

    private static SimAccount ToSimAccount(AccountInput input) => new()
    {
        AccountId = input.AccountId,
        TaxTreatment = input.TaxTreatment,
        CgtRule = input.CgtRule,
        CgtCategory = input.CgtCategory,
        Balance = input.CurrentBalance,
        // No historical cost-basis input exists in the data model, so today's balance is assumed to be its
        // own cost basis (zero unrealized gain at simulation start); only growth accrued during the simulation
        // is taxed on withdrawal.
        CostBasis = input.CurrentBalance,
        AllocationWeights = input.AllocationWeights,
        MonthlyContribution = input.MonthlyContribution,
        EmployerMatchPct = input.EmployerMatchPct,
        IsNps = input.IsNps,
        NpsAnnuitizationPct = input.NpsAnnuitizationPct,
        AssumedAnnuityRatePct = input.AssumedAnnuityRatePct
    };

    private record PathResult(Dictionary<int, decimal> YearEndValues, bool ExpensesEverShortfell, Dictionary<int, bool> GoalSuccess, double Worst3MonthReturn);
}
