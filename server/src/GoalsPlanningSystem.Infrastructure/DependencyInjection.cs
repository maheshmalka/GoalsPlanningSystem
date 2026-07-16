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
                    sql.MigrationsHistoryTable("__EFMigrationsHistory")));
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
