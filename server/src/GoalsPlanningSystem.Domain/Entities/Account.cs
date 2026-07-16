using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

public class Account
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public decimal CurrentBalance { get; set; }

    public decimal ContributionAmount { get; set; }
    public ContributionFrequency ContributionFrequency { get; set; } = ContributionFrequency.None;

    /// <summary>Employer contribution as a % of the employee's contribution. EPF/NPS only.</summary>
    public decimal? EmployerMatchPct { get; set; }

    /// <summary>% of NPS corpus mandatorily annuitized at retirement (default 40%). NPS only.</summary>
    public decimal? NpsAnnuitizationPct { get; set; }

    /// <summary>Assumed annuity payout rate applied to the annuitized NPS portion. NPS only.</summary>
    public decimal? AssumedAnnuityRatePct { get; set; }

    public TaxTreatment TaxTreatment => AccountType.GetTaxTreatment();
    public CapitalGainsAssetCategory? CapitalGainsCategory => AccountType.GetCapitalGainsCategory();

    public List<AccountAllocation> Allocations { get; set; } = [];
    public List<GoalAccountLink> GoalLinks { get; set; } = [];
}
