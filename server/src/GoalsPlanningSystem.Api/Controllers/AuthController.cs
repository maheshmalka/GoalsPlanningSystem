using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GoalsPlanningSystem.Api.Auth;
using GoalsPlanningSystem.Api.DTOs;
using GoalsPlanningSystem.Domain.Entities;
using GoalsPlanningSystem.Domain.Enums;
using GoalsPlanningSystem.Infrastructure;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GoalsPlanningSystem.Api.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController(
    GoalsPlanningSystemDbContext db,
    JwtTokenService jwt,
    PasswordService passwords,
    IHttpClientFactory httpClientFactory,
    IOptions<OAuthOptions> oauthOptions) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResultDto>> Register(RegisterDto dto)
    {
        var email = dto.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(dto.DisplayName)) return BadRequest("Display name is required.");
        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 8) return BadRequest("Password must be at least 8 characters.");
        if (await db.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail)) return Conflict("An account with this email already exists.");

        var user = new ApplicationUser { Email = email, NormalizedEmail = normalizedEmail, DisplayName = dto.DisplayName.Trim() };
        user.PasswordHash = passwords.Hash(user, dto.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var (result, _) = await IssueTokensAsync(user);
        return result;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResultDto>> Login(LoginDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
        if (user is null || user.PasswordHash is null || !passwords.Verify(user, user.PasswordHash, dto.Password))
        {
            return Unauthorized("Invalid email or password.");
        }

        var (result, _) = await IssueTokensAsync(user);
        return result;
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResultDto>> Refresh(RefreshRequestDto dto)
    {
        var hash = JwtTokenService.HashToken(dto.RefreshToken);
        var token = await db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is null) return Unauthorized();

        if (!token.IsActive)
        {
            // Reuse of an already-rotated (or expired) token is a signal of theft: kill every other
            // active session for this user, not just this one.
            if (token.RevokedAt is not null)
            {
                var siblings = await db.RefreshTokens.Where(t => t.UserId == token.UserId && t.RevokedAt == null).ToListAsync();
                foreach (var s in siblings) s.RevokedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
            return Unauthorized();
        }

        token.RevokedAt = DateTime.UtcNow;
        var (result, newToken) = await IssueTokensAsync(token.User);
        token.ReplacedByTokenId = newToken.Id;
        await db.SaveChangesAsync();
        return result;
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResultDto>> GoogleLogin(GoogleLoginDto dto)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [oauthOptions.Value.GoogleClientId]
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Invalid Google token.");
        }

        if (!payload.EmailVerified) return Unauthorized("Google account email is not verified.");

        var user = await FindOrCreateExternalUserAsync(ExternalLoginProvider.Google, payload.Subject, payload.Email, payload.Name ?? payload.Email);
        var (result, _) = await IssueTokensAsync(user);
        return result;
    }

    [HttpPost("microsoft")]
    public async Task<ActionResult<AuthResultDto>> MicrosoftLogin(MicrosoftLoginDto dto)
    {
        // Calling Graph below proves the token is a genuine, unexpired Microsoft-issued token, but not
        // that it was issued to *this* app - any app a user has granted User.Read to could otherwise be
        // replayed here. The audience/client claim is checked first, before that call, to close that gap.
        // Safe to read without re-verifying the signature: by the time this token reaches Graph it will
        // already have been cryptographically validated there, and this check runs against the same token.
        if (!TokenWasIssuedToThisApp(dto.AccessToken)) return Unauthorized("Invalid Microsoft token.");

        var client = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", dto.AccessToken);

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return Unauthorized("Invalid Microsoft token.");

        var profile = await response.Content.ReadFromJsonAsync<MicrosoftGraphProfile>();
        var email = profile?.Mail ?? profile?.UserPrincipalName;
        if (profile is null || string.IsNullOrEmpty(profile.Id) || string.IsNullOrEmpty(email))
        {
            return Unauthorized("Invalid Microsoft token.");
        }

        var user = await FindOrCreateExternalUserAsync(ExternalLoginProvider.Microsoft, profile.Id, email, profile.DisplayName ?? email);
        var (result, _) = await IssueTokensAsync(user);
        return result;
    }

    private record MicrosoftGraphProfile(string Id, string? Mail, string? UserPrincipalName, string? DisplayName);

    private bool TokenWasIssuedToThisApp(string accessToken)
    {
        try
        {
            var token = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
            // v2.0 tokens use "azp", v1.0 tokens use "appid" - MSAL's default authority issues v2.0.
            var issuedTo = token.Claims.FirstOrDefault(c => c.Type is "azp" or "appid")?.Value;
            return string.Equals(issuedTo, oauthOptions.Value.MicrosoftClientId, StringComparison.OrdinalIgnoreCase);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    /// <summary>Looks up by (Provider, ProviderUserId) first (the stable identity), falling back to
    /// matching an existing local account by email so a user who registered with a password and later
    /// signs in with Google/Microsoft using the same address lands on the same account instead of a
    /// duplicate.</summary>
    private async Task<ApplicationUser> FindOrCreateExternalUserAsync(ExternalLoginProvider provider, string providerUserId, string email, string displayName)
    {
        var existingLogin = await db.ExternalLogins.Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Provider == provider && l.ProviderUserId == providerUserId);
        if (existingLogin is not null) return existingLogin.User;

        var normalizedEmail = email.Trim().ToUpperInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
        if (user is null)
        {
            user = new ApplicationUser { Email = email, NormalizedEmail = normalizedEmail, DisplayName = displayName };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        db.ExternalLogins.Add(new ExternalLogin { UserId = user.Id, Provider = provider, ProviderUserId = providerUserId });
        await db.SaveChangesAsync();
        return user;
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequestDto dto)
    {
        var hash = JwtTokenService.HashToken(dto.RefreshToken);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return NoContent();
    }

    private async Task<(AuthResultDto Result, RefreshToken Entity)> IssueTokensAsync(ApplicationUser user)
    {
        var (accessToken, accessExpiresAt) = jwt.GenerateAccessToken(user);
        var (rawRefresh, hash, refreshExpiresAt) = jwt.GenerateRefreshToken();

        var refreshToken = new RefreshToken { UserId = user.Id, TokenHash = hash, ExpiresAt = refreshExpiresAt };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        var result = new AuthResultDto(accessToken, accessExpiresAt, rawRefresh, new UserDto(user.Id, user.Email, user.DisplayName));
        return (result, refreshToken);
    }
}
