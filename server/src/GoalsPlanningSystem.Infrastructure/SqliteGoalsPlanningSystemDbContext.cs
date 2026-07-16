using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Infrastructure;

/// <summary>Used for local development. Its migrations live in Migrations/Sqlite.</summary>
public class SqliteGoalsPlanningSystemDbContext(DbContextOptions<SqliteGoalsPlanningSystemDbContext> options)
    : GoalsPlanningSystemDbContext(options);
