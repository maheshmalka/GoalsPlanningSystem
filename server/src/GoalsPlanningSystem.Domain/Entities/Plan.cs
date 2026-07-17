namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>
/// The top-level unit of work: one household (1-2 clients, typically spouses). Expenses and goals are
/// shared at this level since they're household-level concerns; accounts and income stay on the
/// individual Client since they're individually owned.
/// </summary>
public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>The advisor account that owns this plan - all API access to a plan and everything
    /// under it is scoped to this user.</summary>
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Drives the simulation's household timeline (retirement age, tax regime) when a plan has two clients.</summary>
    public int? PrimaryClientId { get; set; }
    public Client? PrimaryClient { get; set; }

    public decimal InflationRatePct { get; set; } = 7m;
    public int SimulationCount { get; set; } = 2000;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Client> Clients { get; set; } = [];
    public List<Expense> Expenses { get; set; } = [];
    public List<Goal> Goals { get; set; } = [];
}
