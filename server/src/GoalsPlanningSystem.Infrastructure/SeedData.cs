using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Infrastructure;

/// <summary>
/// Default reference data an advisor edits over time rather than starts from scratch: asset class
/// assumptions, the risk questionnaire, and the current FY's tax rules (Budget 2025 New regime slabs,
/// unchanged Old regime slabs, current post-July-2024 capital gains rules).
/// </summary>
public static class SeedData
{
    public static async Task SeedAsync(GoalsPlanningSystemDbContext context)
    {
        if (!context.GlobalSettings.Any())
        {
            context.GlobalSettings.Add(new GlobalSettings { InflationRatePct = 7m, SimulationCount = 2000 });
        }

        if (!context.AssetClasses.Any())
        {
            var indianEquity = new AssetClass { Name = "Indian Equity", ExpectedAnnualReturnPct = 12m, AnnualVolatilityPct = 18m };
            var intlEquity = new AssetClass { Name = "International Equity", ExpectedAnnualReturnPct = 10m, AnnualVolatilityPct = 16m };
            var debt = new AssetClass { Name = "Debt/Bonds", ExpectedAnnualReturnPct = 7m, AnnualVolatilityPct = 5m };
            var gold = new AssetClass { Name = "Gold", ExpectedAnnualReturnPct = 8m, AnnualVolatilityPct = 15m };
            var realEstate = new AssetClass { Name = "Real Estate", ExpectedAnnualReturnPct = 8m, AnnualVolatilityPct = 12m };
            var cash = new AssetClass { Name = "Cash", ExpectedAnnualReturnPct = 4m, AnnualVolatilityPct = 1m };

            context.AssetClasses.AddRange(indianEquity, intlEquity, debt, gold, realEstate, cash);

            context.AssetClassCorrelations.AddRange(
                Corr(indianEquity, intlEquity, 0.65m),
                Corr(indianEquity, debt, 0.10m),
                Corr(indianEquity, gold, -0.05m),
                Corr(indianEquity, realEstate, 0.20m),
                Corr(indianEquity, cash, 0.00m),
                Corr(intlEquity, debt, 0.05m),
                Corr(intlEquity, gold, 0.00m),
                Corr(intlEquity, realEstate, 0.15m),
                Corr(intlEquity, cash, 0.00m),
                Corr(debt, gold, 0.10m),
                Corr(debt, realEstate, 0.05m),
                Corr(debt, cash, 0.30m),
                Corr(gold, realEstate, 0.05m),
                Corr(gold, cash, 0.00m),
                Corr(realEstate, cash, 0.00m));
        }

        if (!context.RiskQuestions.Any())
        {
            context.RiskQuestions.AddRange(
                Question(1, "How many years until you plan to start withdrawing a significant portion of this investment?",
                    "Less than 3 years", "3-5 years", "5-10 years", "10-20 years", "More than 20 years"),
                Question(2, "Which statement best describes your comfort with investment losses?",
                    "I cannot tolerate any loss of principal",
                    "I can tolerate small, short-term losses",
                    "I can tolerate moderate fluctuations for better long-term returns",
                    "I can tolerate significant fluctuations for higher long-term returns",
                    "I am comfortable with large swings in pursuit of maximum returns"),
                Question(3, "How would you describe your investment experience?",
                    "None - new to investing",
                    "Limited - mostly bank deposits/PPF",
                    "Moderate - invest in mutual funds",
                    "Experienced - direct equity & mutual funds for 5+ years",
                    "Expert - actively manage a diversified multi-asset portfolio"),
                Question(4, "How stable and secure is your current income?",
                    "Highly uncertain / no regular income",
                    "Somewhat uncertain (business/freelance)",
                    "Reasonably stable",
                    "Very stable (salaried)",
                    "Very stable with multiple income sources"),
                Question(5, "If your portfolio fell 20% in value over a few months, what would you most likely do?",
                    "Sell all investments to prevent further loss",
                    "Sell a portion to reduce risk",
                    "Hold and wait for recovery",
                    "Continue investing as planned",
                    "Invest more to take advantage of lower prices"),
                Question(6, "What is your primary investment objective?",
                    "Preserve capital, minimal risk",
                    "Generate steady income with low risk",
                    "Balanced growth and income",
                    "Long-term growth, some risk acceptable",
                    "Maximum long-term growth, high risk acceptable"),
                Question(7, "How much of this portfolio might you need to access on short notice (within a year) for emergencies?",
                    "More than 50%", "25-50%", "10-25%", "Less than 10%", "None - fully committed for the long term"));
        }

        if (!context.TaxSlabs.Any())
        {
            // New regime (FY 2025-26 / Budget 2025)
            context.TaxSlabs.AddRange(
                Slab(TaxRegime.New, 1, 0, 400_000, 0m),
                Slab(TaxRegime.New, 2, 400_000, 800_000, 5m),
                Slab(TaxRegime.New, 3, 800_000, 1_200_000, 10m),
                Slab(TaxRegime.New, 4, 1_200_000, 1_600_000, 15m),
                Slab(TaxRegime.New, 5, 1_600_000, 2_000_000, 20m),
                Slab(TaxRegime.New, 6, 2_000_000, 2_400_000, 25m),
                Slab(TaxRegime.New, 7, 2_400_000, null, 30m),
                // Old regime (unchanged for several years)
                Slab(TaxRegime.Old, 1, 0, 250_000, 0m),
                Slab(TaxRegime.Old, 2, 250_000, 500_000, 5m),
                Slab(TaxRegime.Old, 3, 500_000, 1_000_000, 20m),
                Slab(TaxRegime.Old, 4, 1_000_000, null, 30m));
        }

        if (!context.TaxSettings.Any())
        {
            context.TaxSettings.AddRange(
                new TaxSettings { Regime = TaxRegime.New, StandardDeduction = 75_000m, RebateIncomeThreshold = 1_200_000m, RebateMaxAmount = 60_000m, CessPct = 4m },
                new TaxSettings { Regime = TaxRegime.Old, StandardDeduction = 50_000m, RebateIncomeThreshold = 500_000m, RebateMaxAmount = 12_500m, CessPct = 4m });
        }

        if (!context.CapitalGainsRules.Any())
        {
            context.CapitalGainsRules.AddRange(
                new CapitalGainsRule { AssetCategory = CapitalGainsAssetCategory.Equity, HoldingPeriodMonthsThreshold = 12, ShortTermTaxedAtSlabRate = false, ShortTermRatePct = 20m, LongTermRatePct = 12.5m, LongTermExemptionAmount = 125_000m },
                // Debt mutual funds purchased on/after 1 Apr 2023 are taxed at slab rate regardless of holding period.
                new CapitalGainsRule { AssetCategory = CapitalGainsAssetCategory.DebtMutualFund, HoldingPeriodMonthsThreshold = 0, ShortTermTaxedAtSlabRate = true, ShortTermRatePct = 0m, LongTermRatePct = 0m, LongTermExemptionAmount = 0m },
                new CapitalGainsRule { AssetCategory = CapitalGainsAssetCategory.RealEstate, HoldingPeriodMonthsThreshold = 24, ShortTermTaxedAtSlabRate = true, ShortTermRatePct = 0m, LongTermRatePct = 12.5m, LongTermExemptionAmount = 0m },
                new CapitalGainsRule { AssetCategory = CapitalGainsAssetCategory.Gold, HoldingPeriodMonthsThreshold = 24, ShortTermTaxedAtSlabRate = true, ShortTermRatePct = 0m, LongTermRatePct = 12.5m, LongTermExemptionAmount = 0m });
        }

        await context.SaveChangesAsync();
    }

    private static AssetClassCorrelation Corr(AssetClass a, AssetClass b, decimal correlation) =>
        new() { AssetClassA = a, AssetClassB = b, Correlation = correlation };

    private static TaxSlab Slab(TaxRegime regime, int order, decimal lower, decimal? upper, decimal rate) =>
        new() { Regime = regime, SlabOrder = order, LowerBound = lower, UpperBound = upper, RatePct = rate };

    private static RiskQuestion Question(int order, string text, params string[] options) => new()
    {
        DisplayOrder = order,
        Text = text,
        Options = options.Select((optionText, i) => new RiskQuestionOption
        {
            DisplayOrder = i + 1,
            Text = optionText,
            Points = i + 1
        }).ToList()
    };
}
