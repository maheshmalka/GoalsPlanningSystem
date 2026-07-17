namespace GoalsPlanningSystem.Api.Auth;

/// <summary>Client IDs only - these are public identifiers embedded in the SPA bundle, not secrets.
/// Verification is by trusting Google's/Microsoft's own signature/token checks (see AuthController),
/// so no client secret is needed server-side for either provider.</summary>
public class OAuthOptions
{
    public const string SectionName = "OAuth";

    public string GoogleClientId { get; set; } = string.Empty;
    public string MicrosoftClientId { get; set; } = string.Empty;
}
