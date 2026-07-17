using GoalsPlanningSystem.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace GoalsPlanningSystem.Api.Auth;

/// <summary>Thin wrapper around ASP.NET Core's PasswordHasher (PBKDF2) - used standalone, without the
/// rest of ASP.NET Core Identity, since sign-in here issues JWTs rather than auth cookies.</summary>
public class PasswordService
{
    private readonly PasswordHasher<ApplicationUser> _hasher = new();

    public string Hash(ApplicationUser user, string password) => _hasher.HashPassword(user, password);

    public bool Verify(ApplicationUser user, string hash, string password) =>
        _hasher.VerifyHashedPassword(user, hash, password) != PasswordVerificationResult.Failed;
}
