using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Simulation.Tax;

namespace GoalsPlanningSystem.Simulation.MonteCarlo;

public record NpsAnnuitizationResult(decimal MonthlyAnnuityIncome, decimal LumpSumAmount);

/// <summary>One client's account collection for a single simulated path. Mutated month by month.</summary>
public class Portfolio(List<SimAccount> accounts)
{
    private int _nextSyntheticAccountId = -1;
    public List<SimAccount> Accounts { get; } = accounts;

    public decimal TotalValue => Accounts.Sum(a => a.Balance);

    /// <summary>Intended for cloning a fresh, pre-simulation template into one Portfolio per path (no synthetic accounts exist yet).</summary>
    public Portfolio Clone() => new(Accounts.Select(a => a.Clone()).ToList());

    /// <summary>Applies each account's contribution (plus employer match) for the month. Call only in pre-retirement months.</summary>
    public void Contribute()
    {
        foreach (var account in Accounts.Where(a => a.MonthlyContribution > 0 && !a.NpsAnnuitized))
        {
            var matchFraction = 1 + account.EmployerMatchPct / 100m;
            var amount = account.MonthlyContribution * matchFraction;
            account.Balance += amount;
            account.CostBasis += amount;
        }
    }

    /// <summary>
    /// Applies this month's correlated asset-class returns to every account per its allocation weights.
    /// Returns the balance-weighted blended return actually realized this month (growth-only, before any
    /// contribution/withdrawal cashflow), used for the worst-3-month-loss metric.
    /// </summary>
    public double GrowMonth(double[] monthlyReturnsByIndex, IReadOnlyDictionary<int, int> assetClassIdToIndex)
    {
        var totalBefore = (double)TotalValue;
        if (totalBefore <= 0)
        {
            return 0;
        }

        var weightedGrowth = 0.0;
        foreach (var account in Accounts.Where(a => a.Balance > 0))
        {
            var accountReturn = 0.0;
            foreach (var (assetClassId, weight) in account.AllocationWeights)
            {
                if (assetClassIdToIndex.TryGetValue(assetClassId, out var idx))
                {
                    accountReturn += weight * monthlyReturnsByIndex[idx];
                }
            }

            weightedGrowth += (double)account.Balance * accountReturn;
            account.Balance *= (decimal)(1 + accountReturn);
        }

        return weightedGrowth / totalBefore;
    }

    /// <summary>
    /// Converts each not-yet-annuitized NPS account at retirement: the annuitized portion becomes ongoing
    /// income, the remainder becomes a tax-free lump sum reinvested as a new taxable (cash-allocated) account.
    /// </summary>
    public NpsAnnuitizationResult AnnuitizeNps(int cashAssetClassId)
    {
        decimal totalMonthlyAnnuity = 0m;
        decimal totalLumpSum = 0m;

        foreach (var account in Accounts.Where(a => a.IsNps && !a.NpsAnnuitized).ToList())
        {
            var annuitizedAmount = account.Balance * account.NpsAnnuitizationPct / 100m;
            var lumpSumAmount = account.Balance - annuitizedAmount;

            totalMonthlyAnnuity += annuitizedAmount * account.AssumedAnnuityRatePct / 100m / 12m;
            totalLumpSum += lumpSumAmount;

            account.Balance = 0m;
            account.CostBasis = 0m;
            account.NpsAnnuitized = true;

            if (lumpSumAmount > 0)
            {
                Accounts.Add(new SimAccount
                {
                    AccountId = _nextSyntheticAccountId--,
                    TaxTreatment = TaxTreatment.Taxable,
                    CgtRule = null,
                    Balance = lumpSumAmount,
                    CostBasis = lumpSumAmount,
                    AllocationWeights = new Dictionary<int, double> { [cashAssetClassId] = 1.0 },
                    MonthlyContribution = 0m,
                    EmployerMatchPct = 0m
                });
            }
        }

        return new NpsAnnuitizationResult(totalMonthlyAnnuity, totalLumpSum);
    }

    /// <summary>Withdraws in tax-optimized order: Taxable, then Tax-Deferred, then Tax-Free; pro-rata by balance within each bucket.</summary>
    public WithdrawalResult Withdraw(decimal amountNeeded) => WithdrawFrom(amountNeeded, _ => true);

    /// <summary>
    /// Withdraws only from the given (goal-earmarked) accounts first, in the same tax-optimized order. Any
    /// shortfall is left for the caller to fund from the general pool via a follow-up <see cref="Withdraw"/> call.
    /// </summary>
    public WithdrawalResult WithdrawFromAccounts(decimal amountNeeded, IReadOnlyCollection<int> accountIds) =>
        WithdrawFrom(amountNeeded, a => accountIds.Contains(a.AccountId));

    private WithdrawalResult WithdrawFrom(decimal amountNeeded, Func<SimAccount, bool> filter)
    {
        var result = new WithdrawalResult();
        if (amountNeeded <= 0)
        {
            return result;
        }

        var remaining = amountNeeded;
        foreach (var treatment in new[] { TaxTreatment.Taxable, TaxTreatment.TaxDeferred, TaxTreatment.TaxFree })
        {
            if (remaining <= 0) break;

            var group = Accounts.Where(a => a.TaxTreatment == treatment && a.Balance > 0 && !a.IsNps && filter(a)).ToList();
            var groupTotal = group.Sum(a => a.Balance);
            if (groupTotal <= 0) continue;

            var amountFromGroup = Math.Min(remaining, groupTotal);
            foreach (var account in group)
            {
                var share = account.Balance / groupTotal;
                var withdrawn = amountFromGroup * share;
                if (withdrawn <= 0) continue;

                if (treatment == TaxTreatment.Taxable)
                {
                    var gainFraction = account.Balance > 0 ? Math.Max(0m, 1 - account.CostBasis / account.Balance) : 0m;
                    var gainPortion = withdrawn * gainFraction;

                    if (account.CgtRule is null)
                    {
                        result.OrdinaryIncomeFromGains += gainPortion;
                    }
                    else
                    {
                        var classification = CapitalGainsTaxCalculator.Classify(gainPortion, account.CgtRule);
                        result.OrdinaryIncomeFromGains += classification.AddToOrdinaryIncome;
                        if (classification.LongTermGainAmount > 0 && account.CgtCategory is { } category)
                        {
                            result.AddLongTermGain(category, classification.LongTermGainAmount);
                        }
                    }

                    account.CostBasis -= account.CostBasis * (withdrawn / account.Balance);
                }

                account.Balance -= withdrawn;
                result.TotalWithdrawn += withdrawn;
            }

            remaining -= amountFromGroup;
        }

        result.Shortfall = Math.Max(0m, remaining);
        return result;
    }

}
