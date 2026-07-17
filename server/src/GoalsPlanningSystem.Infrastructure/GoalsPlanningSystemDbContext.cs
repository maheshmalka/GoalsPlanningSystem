using GoalsPlanningSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Infrastructure;

/// <summary>
/// Shared model definition. Never registered directly in DI - use <see cref="SqliteGoalsPlanningSystemDbContext"/>
/// or <see cref="SqlServerGoalsPlanningSystemDbContext"/> so each provider gets its own migration history
/// (SQL Server and SQLite need different generated SQL for the same model).
/// </summary>
public abstract class GoalsPlanningSystemDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AccountAllocation> AccountAllocations => Set<AccountAllocation>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalAccountLink> GoalAccountLinks => Set<GoalAccountLink>();
    public DbSet<RiskQuestion> RiskQuestions => Set<RiskQuestion>();
    public DbSet<RiskQuestionOption> RiskQuestionOptions => Set<RiskQuestionOption>();
    public DbSet<RiskQuestionnaireResponse> RiskQuestionnaireResponses => Set<RiskQuestionnaireResponse>();
    public DbSet<AssetClass> AssetClasses => Set<AssetClass>();
    public DbSet<AssetClassCorrelation> AssetClassCorrelations => Set<AssetClassCorrelation>();
    public DbSet<TaxSlab> TaxSlabs => Set<TaxSlab>();
    public DbSet<TaxSettings> TaxSettings => Set<TaxSettings>();
    public DbSet<CapitalGainsRule> CapitalGainsRules => Set<CapitalGainsRule>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<decimal>().HavePrecision(18, 4);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Plan>(e =>
        {
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.HasMany(p => p.Clients).WithOne(c => c.Plan).HasForeignKey(c => c.PlanId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Expenses).WithOne(x => x.Plan).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Goals).WithOne(g => g.Plan).HasForeignKey(g => g.PlanId).OnDelete(DeleteBehavior.Cascade);
            // Independent of the Clients collection above (different FK, opposite direction), so this
            // doesn't create the multi-cascade-path conflict SQL Server rejects: deleting a Client just
            // nulls this column rather than cascading back into Plan.
            e.HasOne(p => p.PrimaryClient).WithMany().HasForeignKey(p => p.PrimaryClientId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Client>(e =>
        {
            e.Property(c => c.Name).IsRequired().HasMaxLength(200);
            e.HasMany(c => c.Accounts).WithOne(a => a.Client).HasForeignKey(a => a.ClientId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Incomes).WithOne(i => i.Client).HasForeignKey(i => i.ClientId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.RiskQuestionnaireResponses).WithOne(r => r.Client).HasForeignKey(r => r.ClientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Account>(e =>
        {
            e.Property(a => a.Name).IsRequired().HasMaxLength(200);
            e.HasMany(a => a.Allocations).WithOne(al => al.Account).HasForeignKey(al => al.AccountId).OnDelete(DeleteBehavior.Cascade);
            // Restrict, not Cascade: GoalAccountLink already cascades from Goal, and SQL Server (unlike
            // SQLite) rejects a table with two cascade paths back to the same ancestor. Accounts with
            // active goal links are cleaned up explicitly in AccountsController before deletion.
            e.HasMany(a => a.GoalLinks).WithOne(gl => gl.Account).HasForeignKey(gl => gl.AccountId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AccountAllocation>(e =>
        {
            e.HasIndex(a => new { a.AccountId, a.AssetClassId }).IsUnique();
            e.HasOne(a => a.AssetClass).WithMany(ac => ac.AccountAllocations).HasForeignKey(a => a.AssetClassId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssetClass>(e =>
        {
            e.Property(a => a.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(a => a.Name).IsUnique();
        });

        modelBuilder.Entity<AssetClassCorrelation>(e =>
        {
            e.HasIndex(c => new { c.AssetClassAId, c.AssetClassBId }).IsUnique();
            e.HasOne(c => c.AssetClassA).WithMany().HasForeignKey(c => c.AssetClassAId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.AssetClassB).WithMany().HasForeignKey(c => c.AssetClassBId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Goal>(e =>
        {
            e.Property(g => g.Name).IsRequired().HasMaxLength(200);
            e.HasMany(g => g.AccountLinks).WithOne(l => l.Goal).HasForeignKey(l => l.GoalId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiskQuestion>(e =>
        {
            e.Property(q => q.Text).IsRequired();
            e.HasMany(q => q.Options).WithOne(o => o.RiskQuestion).HasForeignKey(o => o.RiskQuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiskQuestionnaireResponse>(e =>
        {
            e.HasIndex(r => new { r.ClientId, r.RiskQuestionId }).IsUnique();
            e.HasOne(r => r.RiskQuestionOption).WithMany().HasForeignKey(r => r.RiskQuestionOptionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TaxSlab>(e =>
        {
            e.HasIndex(t => new { t.Regime, t.SlabOrder }).IsUnique();
        });

        modelBuilder.Entity<TaxSettings>(e =>
        {
            e.HasIndex(t => t.Regime).IsUnique();
        });

        modelBuilder.Entity<CapitalGainsRule>(e =>
        {
            e.HasIndex(c => c.AssetCategory).IsUnique();
        });
    }
}
