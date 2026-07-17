using GoalsPlanningSystem.Domain.Enums;

namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>Links a local user to an external identity (Google/Microsoft "sub" claim), so the same
/// user can be found again on a later sign-in without re-creating an account.</summary>
public class ExternalLogin
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public ExternalLoginProvider Provider { get; set; }
    public string ProviderUserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
