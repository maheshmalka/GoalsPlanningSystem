using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GoalsPlanningSystem.Infrastructure;

/// <summary>
/// Lets `dotnet ef migrations add ... -c SqliteGoalsPlanningSystemDbContext` (or the SqlServer equivalent)
/// construct each context at design time without spinning up the full API host. The connection strings here
/// are only used to pick SQL dialect for migration generation - they are never actually opened.
/// </summary>
public class SqliteDesignTimeFactory : IDesignTimeDbContextFactory<SqliteGoalsPlanningSystemDbContext>
{
    public SqliteGoalsPlanningSystemDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SqliteGoalsPlanningSystemDbContext>()
            .UseSqlite("Data Source=design-time.db")
            .Options;
        return new SqliteGoalsPlanningSystemDbContext(options);
    }
}

public class SqlServerDesignTimeFactory : IDesignTimeDbContextFactory<SqlServerGoalsPlanningSystemDbContext>
{
    public SqlServerGoalsPlanningSystemDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SqlServerGoalsPlanningSystemDbContext>()
            .UseSqlServer("Server=design-time;Database=design-time;TrustServerCertificate=True")
            .Options;
        return new SqlServerGoalsPlanningSystemDbContext(options);
    }
}
