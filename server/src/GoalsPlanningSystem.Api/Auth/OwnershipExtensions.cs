using GoalsPlanningSystem.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace GoalsPlanningSystem.Api.Auth;

/// <summary>Every resource in this app hangs off a Plan, and every Plan is owned by exactly one user
/// (see Plan.UserId), so these two checks are the only ownership joins the API ever needs.</summary>
public static class OwnershipExtensions
{
    public static Task<bool> IsPlanOwnedByUserAsync(this GoalsPlanningSystemDbContext db, int planId, int userId) =>
        db.Plans.AnyAsync(p => p.Id == planId && p.UserId == userId);

    public static Task<bool> IsClientOwnedByUserAsync(this GoalsPlanningSystemDbContext db, int clientId, int userId) =>
        db.Clients.AnyAsync(c => c.Id == clientId && c.Plan.UserId == userId);
}
