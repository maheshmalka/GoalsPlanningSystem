using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GoalsPlanningSystem.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers the DbContext under the shared <see cref="GoalsPlanningSystemDbContext"/> type so application
    /// code never depends on the provider, while the concrete instance (and its migration set) is chosen by the
    /// "DatabaseProvider" config value: "Sqlite" (default, local dev) or "SqlServer" (Azure SQL).
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["DatabaseProvider"] ?? "Sqlite";
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

        if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<GoalsPlanningSystemDbContext, SqlServerGoalsPlanningSystemDbContext>(options =>
                options.UseSqlServer(connectionString, sql =>
                {
                    sql.MigrationsHistoryTable("__EFMigrationsHistory");
                    // Azure SQL serverless auto-pauses when idle; the first connection after a pause (or any
                    // transient network blip) commonly fails while the database resumes. Without this, that
                    // first failure aborts Program.cs's startup Migrate() call outright and the app never
                    // gets a working schema.
                    sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(15), errorNumbersToAdd: null);
                }));
        }
        else
        {
            services.AddDbContext<GoalsPlanningSystemDbContext, SqliteGoalsPlanningSystemDbContext>(options =>
                options.UseSqlite(connectionString, sqlite =>
                    sqlite.MigrationsHistoryTable("__EFMigrationsHistory")));
        }

        return services;
    }
}
