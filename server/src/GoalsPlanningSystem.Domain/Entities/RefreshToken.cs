namespace GoalsPlanningSystem.Domain.Entities;

/// <summary>
/// Only a SHA-256 hash of the raw token is stored, never the token itself - matches how PasswordHash
/// is handled, so a database read alone can't be replayed as a live session. Rotation forms a chain via
/// ReplacedByTokenId: reusing an already-rotated token is a signal of theft (see AuthController.Refresh),
/// which is why the chain is tracked instead of just deleting the old row.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public int? ReplacedByTokenId { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}
