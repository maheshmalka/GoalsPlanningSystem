namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>
/// Password is optional because a user who only ever signs in via Google/Microsoft never sets one -
/// PasswordHash stays null until (if ever) they set a local password.
/// </summary>
public class ApplicationUser
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ExternalLogin> ExternalLogins { get; set; } = [];
    public List<RefreshToken> RefreshTokens { get; set; } = [];
    public List<Plan> Plans { get; set; } = [];
}
