namespace GoalsPlanningSystem.Domain.Enums;

public static class AccountTypeExtensions
{
    // NPS is modeled separately (mandatory annuitization at retirement), so it is
    // neither Taxable nor TaxFree here - the simulation engine special-cases it.
    private static readonly HashSet<AccountType> TaxFreeTypes =
    [
        AccountType.Epf,
        AccountType.Ppf,
        AccountType.SukanyaSamriddhiYojana,
        // MVP simplification: assumes maturity proceeds qualify for the Section 10(10D)
        // exemption (premium <= 10% of sum assured), which holds for most retail policies.
        AccountType.Ulip,
        AccountType.EndowmentInsurance
    ];

    // Instruments whose gains are capital-gains-taxed on withdrawal. Anything Taxable
    // but absent here is taxed as interest income at the client's slab rate instead
    // (FDs, RDs, savings, SCSS, post office schemes, corporate bonds/NCDs).
    private static readonly Dictionary<AccountType, CapitalGainsAssetCategory> CapitalGainsCategories = new()
    {
        [AccountType.EquityMutualFund] = CapitalGainsAssetCategory.Equity,
        [AccountType.DirectEquity] = CapitalGainsAssetCategory.Equity,
        [AccountType.Elss] = CapitalGainsAssetCategory.Equity,
        [AccountType.DebtMutualFund] = CapitalGainsAssetCategory.DebtMutualFund,
        [AccountType.RealEstate] = CapitalGainsAssetCategory.RealEstate,
        [AccountType.GoldSgb] = CapitalGainsAssetCategory.Gold
    };

    public static TaxTreatment GetTaxTreatment(this AccountType type) => type switch
    {
        AccountType.Nps => TaxTreatment.TaxDeferred,
        _ when TaxFreeTypes.Contains(type) => TaxTreatment.TaxFree,
        _ => TaxTreatment.Taxable
    };

    /// <summary>
    /// Null means the account's growth is taxed as interest income at the client's
    /// slab rate on withdrawal, rather than under capital gains rules.
    /// </summary>
    public static CapitalGainsAssetCategory? GetCapitalGainsCategory(this AccountType type) =>
        CapitalGainsCategories.TryGetValue(type, out var category) ? category : null;
}
