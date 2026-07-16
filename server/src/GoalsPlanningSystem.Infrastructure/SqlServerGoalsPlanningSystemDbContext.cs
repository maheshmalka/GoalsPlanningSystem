using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Infrastructure;

/// <summary>Used against Azure SQL in deployed environments. Its migrations live in Migrations/SqlServer.</summary>
public class SqlServerGoalsPlanningSystemDbContext(DbContextOptions<SqlServerGoalsPlanningSystemDbContext> options)
    : GoalsPlanningSystemDbContext(options);
